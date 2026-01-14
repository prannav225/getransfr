import { useCallback } from "react";

export type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error";

export function useHaptics() {
  const triggerHaptic = useCallback((type: HapticType = "light") => {
    if (typeof navigator === "undefined" || !navigator.vibrate) return;

    try {
      switch (type) {
        case "light":
          navigator.vibrate(10);
          break;
        case "medium":
          navigator.vibrate(20);
          break;
        case "heavy":
          navigator.vibrate(50);
          break;
        case "success":
          navigator.vibrate([20, 50, 20]);
          break;
        case "warning":
          navigator.vibrate([50, 100, 50]);
          break;
        case "error":
          navigator.vibrate([100, 50, 100, 50, 100]);
          break;
      }
    } catch (e) {
      // Ignore vibration errors on non-supported hardware
    }
  }, []);

  return { triggerHaptic };
}
