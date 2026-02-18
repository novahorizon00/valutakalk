/**
 * Pro subscription state management.
 * 
 * This module manages the local subscription state. In production,
 * actual purchases are handled by Apple IAP / Google Play Billing
 * via Capacitor plugins. This module stores and validates the
 * subscription receipt/status locally.
 */

import { getFromStore, putToStore } from "./storageHelpers";

export interface ProSubscription {
  /** Whether the user has an active Pro subscription */
  isActive: boolean;
  /** Subscription source: "apple" | "google" | "dev" (for testing) */
  source?: "apple" | "google" | "dev";
  /** ISO date string of when the subscription expires */
  expiresAt?: string;
  /** Whether the user is on a free trial */
  isTrial?: boolean;
  /** Original purchase date */
  purchasedAt?: string;
  /** Product ID from the store */
  productId?: string;
}

const DEFAULT_SUB: ProSubscription = { isActive: false };

export async function getProStatus(): Promise<ProSubscription> {
  const stored = await getFromStore<ProSubscription>("settings", "pro_subscription");
  if (!stored) return DEFAULT_SUB;

  // Check expiration
  if (stored.expiresAt) {
    const expires = new Date(stored.expiresAt).getTime();
    if (expires < Date.now()) {
      // Expired — mark inactive
      const expired = { ...stored, isActive: false };
      await saveProStatus(expired);
      return expired;
    }
  }

  return stored;
}

export async function saveProStatus(status: ProSubscription): Promise<void> {
  return putToStore("settings", "pro_subscription", status);
}

/**
 * Check whether the user can use offline conversion.
 * Free users: online only.
 * Pro users: can use cached rates offline.
 */
export function canUseOffline(pro: ProSubscription): boolean {
  return pro.isActive;
}

/**
 * Activate a dev/test subscription (for development only).
 * In production, this is replaced by IAP receipt validation.
 */
export async function activateDevSubscription(daysValid = 30): Promise<ProSubscription> {
  const now = new Date();
  const expires = new Date(now.getTime() + daysValid * 24 * 60 * 60 * 1000);
  const status: ProSubscription = {
    isActive: true,
    source: "dev",
    expiresAt: expires.toISOString(),
    isTrial: false,
    purchasedAt: now.toISOString(),
    productId: "valutakalk.pro.monthly",
  };
  await saveProStatus(status);
  return status;
}
