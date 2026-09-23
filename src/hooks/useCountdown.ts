// packages
import { useEffect, useState } from 'react';

export function useCountdown(seconds: number, running: boolean): { remaining: number; expired: boolean } {
  const [tracked, setTracked] = useState(seconds);
  const [remaining, setRemaining] = useState(seconds);
  if (tracked !== seconds) {
    setTracked(seconds);
    setRemaining(seconds);
  }
  useEffect(() => {
    if (!running || remaining <= 0) {
      return;
    }
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return (): void => clearInterval(id);
  }, [running, remaining]);
  return { remaining, expired: remaining <= 0 };
}
