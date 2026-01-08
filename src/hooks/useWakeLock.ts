import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Hook to manage the Screen Wake Lock API
 * Prevents the screen from turning off during long transfers
 */
export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const requestedRef = useRef(false);

  const requestWakeLock = useCallback(async () => {
    if ("wakeLock" in navigator) {
      try {
        requestedRef.current = true;
        // Only request if not already holding one
        if (!wakeLockRef.current) {
          const sentinel = await navigator.wakeLock.request("screen");
          wakeLockRef.current = sentinel;
          setIsActive(true);

          sentinel.addEventListener("release", () => {
            console.log("[WakeLock] Released internally");
            setIsActive(false);
            // We don't nullify wakeLockRef here because the visibility handler
            // might need to check if it's gone. Actually, the spec says it's
            // one-time use, so we should nullify it.
            wakeLockRef.current = null;
          });

          console.log("[WakeLock] Screen Wake Lock acquired");
        }
      } catch (err) {
        if (err instanceof Error) {
          console.warn(
            `[WakeLock] Failed to acquire lock: ${err.name}, ${err.message}`
          );
        } else {
          console.warn("[WakeLock] Failed to acquire lock:", err);
        }
      }
    } else {
      console.warn("[WakeLock] Wake Lock API not supported in this browser");
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    requestedRef.current = false;
    if (wakeLockRef.current) {
      wakeLockRef.current
        .release()
        .then(() => {
          wakeLockRef.current = null;
          setIsActive(false);
          console.log("[WakeLock] Released manually");
        })
        .catch((err) => {
          console.error("[WakeLock] Error releasing lock:", err);
          wakeLockRef.current = null;
          setIsActive(false);
        });
    }
  }, []);

  // Handle visibility changes to re-acquire lock
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (requestedRef.current && document.visibilityState === "visible") {
        console.log("[WakeLock] Page visible, re-requesting...");
        await requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [requestWakeLock]);

  // Handle tab close/unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  return { isActive, requestWakeLock, releaseWakeLock };
}
