import { Capacitor, registerPlugin } from "@capacitor/core";

interface WidgetBridgePlugin {
  saveWidgetData(options: {
    currency1: string;
    currency2: string;
    rate: number;
    updatedAt: string;
  }): Promise<void>;
  reloadWidgets(): Promise<void>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>("WidgetBridge");

/**
 * Check if we're running in a native Capacitor environment.
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Push widget currency pair + rate to the native layer (App Groups on iOS,
 * SharedPreferences on Android). The native WidgetKit / RemoteViews extension
 * reads from the same shared container to render the home-screen widget.
 */
export async function saveWidgetConfig(
  currency1: string,
  currency2: string,
  rate: number
): Promise<boolean> {
  if (!isNativePlatform()) {
    console.log("[WidgetBridge] Not native – skipping save");
    return false;
  }

  try {
    await WidgetBridge.saveWidgetData({
      currency1,
      currency2,
      rate,
      updatedAt: new Date().toISOString(),
    });
    await WidgetBridge.reloadWidgets();
    console.log("[WidgetBridge] Widget data saved & timeline reloaded");
    return true;
  } catch (err) {
    console.warn("[WidgetBridge] Failed to save widget data", err);
    return false;
  }
}
