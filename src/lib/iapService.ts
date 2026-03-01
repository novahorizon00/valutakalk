/**
 * In-App Purchase service using RevenueCat.
 * 
 * Handles purchasing, restoring, and checking subscription status.
 * Falls back gracefully on web (non-native) to dev subscription logic.
 */

import { Capacitor } from "@capacitor/core";
import { saveProStatus, type ProSubscription } from "./proSubscription";

const ENTITLEMENT_ID = "pro";
const PRODUCT_ID = "valutakalk.pro.monthly";

/** Whether we're running in a native Capacitor shell */
const isNative = () => Capacitor.isNativePlatform();

/**
 * Dynamically import RevenueCat only on native platforms.
 * This avoids crashes on web where the native plugin isn't available.
 */
async function getRC() {
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  return Purchases;
}

/** Initialize RevenueCat SDK. Call once on app start. */
export async function initIAP(): Promise<void> {
  if (!isNative()) return;

  try {
    const Purchases = await getRC();
    // RevenueCat Apple API key (publishable, safe for client-side use).
    // Replace this with your actual key from RevenueCat dashboard → Project → API Keys → Apple.
    const apiKey = "appl_REPLACE_WITH_YOUR_REVENUECAT_APPLE_API_KEY";
    if (apiKey.includes("REPLACE")) {
      console.warn("[IAP] RevenueCat API key not configured. Replace the placeholder in iapService.ts");
      return;
    }
    await Purchases.configure({ apiKey });
    console.log("[IAP] RevenueCat initialized");
  } catch (err) {
    console.error("[IAP] Failed to initialize RevenueCat:", err);
  }
}

/**
 * Check current entitlement status from RevenueCat.
 * Returns a ProSubscription reflecting the user's active entitlements.
 */
export async function checkSubscriptionStatus(): Promise<ProSubscription> {
  if (!isNative()) {
    // On web, return whatever is stored locally
    const { getProStatus } = await import("./proSubscription");
    return getProStatus();
  }

  try {
    const Purchases = await getRC();
    const { customerInfo } = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

    if (entitlement) {
      const status: ProSubscription = {
        isActive: true,
        source: "apple",
        expiresAt: entitlement.expirationDate ?? undefined,
        isTrial: entitlement.periodType === "TRIAL",
        purchasedAt: entitlement.originalPurchaseDate ?? undefined,
        productId: entitlement.productIdentifier,
      };
      await saveProStatus(status);
      return status;
    }

    // No active entitlement
    const inactive: ProSubscription = { isActive: false };
    await saveProStatus(inactive);
    return inactive;
  } catch (err) {
    console.error("[IAP] Failed to check subscription:", err);
    // Fall back to local status
    const { getProStatus } = await import("./proSubscription");
    return getProStatus();
  }
}

/**
 * Purchase the Pro subscription.
 * Opens the native purchase flow via RevenueCat.
 */
export async function purchasePro(): Promise<ProSubscription> {
  if (!isNative()) {
    // Dev fallback: activate test subscription
    const { activateDevSubscription } = await import("./proSubscription");
    return activateDevSubscription(7);
  }

  try {
    const Purchases = await getRC();
    const offerings = await Purchases.getOfferings();
    const currentOffering = offerings?.current;

    if (!currentOffering) {
      throw new Error("No offerings available");
    }

    // Find the monthly package
    const pkg =
      currentOffering.monthly ??
      currentOffering.availablePackages.find(
        (p) => p.product.identifier === PRODUCT_ID
      ) ??
      currentOffering.availablePackages[0];

    if (!pkg) {
      throw new Error("No package available for purchase");
    }

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

    if (entitlement) {
      const status: ProSubscription = {
        isActive: true,
        source: "apple",
        expiresAt: entitlement.expirationDate ?? undefined,
        isTrial: entitlement.periodType === "TRIAL",
        purchasedAt: entitlement.originalPurchaseDate ?? undefined,
        productId: entitlement.productIdentifier,
      };
      await saveProStatus(status);
      return status;
    }

    // Purchase completed but no entitlement found
    return { isActive: false };
  } catch (err: any) {
    // User cancelled purchase
    if (err?.userCancelled || err?.code === "1") {
      console.log("[IAP] Purchase cancelled by user");
      const { getProStatus } = await import("./proSubscription");
      return getProStatus();
    }
    console.error("[IAP] Purchase failed:", err);
    throw err;
  }
}

/**
 * Restore previous purchases.
 * Required by App Store guidelines.
 */
export async function restorePurchases(): Promise<ProSubscription> {
  if (!isNative()) {
    // Dev fallback
    const { activateDevSubscription } = await import("./proSubscription");
    return activateDevSubscription(7);
  }

  try {
    const Purchases = await getRC();
    const { customerInfo } = await Purchases.restorePurchases();
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

    if (entitlement) {
      const status: ProSubscription = {
        isActive: true,
        source: "apple",
        expiresAt: entitlement.expirationDate ?? undefined,
        isTrial: entitlement.periodType === "TRIAL",
        purchasedAt: entitlement.originalPurchaseDate ?? undefined,
        productId: entitlement.productIdentifier,
      };
      await saveProStatus(status);
      return status;
    }

    // No purchases to restore
    const inactive: ProSubscription = { isActive: false };
    await saveProStatus(inactive);
    return inactive;
  } catch (err) {
    console.error("[IAP] Restore failed:", err);
    throw err;
  }
}
