import { useCallback, useState, useEffect } from 'react';

export function useSound() {
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('dropmate-muted') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('dropmate-muted', String(isMuted));
  }, [isMuted]);

  const playSound = useCallback((type: 'whoosh' | 'ding' | 'error') => {
    if (isMuted) return;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'whoosh') {
      // Sweeping frequency for "Whoosh"
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, now);
      oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.5);
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      oscillator.start();
      oscillator.stop(now + 0.5);
    } else if (type === 'ding') {
      // High-pitched "Ding"
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(1200, now);
      oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      oscillator.start();
      oscillator.stop(now + 0.3);
    } else if (type === 'error') {
      // Buzzer sound for error
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(150, now);
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      oscillator.start();
      oscillator.stop(now + 0.3);
    }
  }, [isMuted]);

  return { playSound, isMuted, setIsMuted };
}
