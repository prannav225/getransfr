import { useState, useCallback, useRef } from 'react';

/**
 * Hook to manage the Screen Wake Lock API
 * Prevents the screen from turning off during long transfers
 */
export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        setIsActive(true);
        
        wakeLockRef.current.addEventListener('release', () => {
          setIsActive(false);
        });
        
        console.log('Wake Lock is active');
      } catch (err: any) {
        console.warn(`${err.name}, ${err.message}`);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      setIsActive(false);
      console.log('Wake Lock released');
    }
  }, []);

  return { isActive, requestWakeLock, releaseWakeLock };
}
