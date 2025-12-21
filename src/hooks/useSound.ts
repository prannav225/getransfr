import { useCallback } from 'react';
import { useSoundContext } from '@/context/SoundContext';

// Keep a persistent AudioContext reference to avoid "too many contexts" errors
let sharedAudioCtx: AudioContext | null = null;

export function useSound() {
  const { isMuted, setIsMuted } = useSoundContext();

  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (!isMuted && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore haptic errors
      }
    }
  }, [isMuted]);

  const playSound = useCallback((type: 'whoosh' | 'ding' | 'error' | 'tap', force = false) => {
    if (isMuted && !force) return;

    try {
      // Initialize shared context on first use
      if (!sharedAudioCtx) {
        sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume context if suspended (browser security)
      if (sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume();
      }

      const audioCtx = sharedAudioCtx;
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'whoosh') {
        triggerHaptic(20);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
      } else if (type === 'ding') {
        triggerHaptic([30, 50, 30]);
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(1200, now);
        oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
      } else if (type === 'error') {
        triggerHaptic([100, 50, 100]);
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, now);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
      } else if (type === 'tap') {
        triggerHaptic(10);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
      }
    } catch (err) {
      console.warn('[useSound] Audio playback failed:', err);
    }
  }, [isMuted, triggerHaptic]);

  return { playSound, triggerHaptic, isMuted, setIsMuted };
}
