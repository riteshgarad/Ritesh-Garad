import { useState, useEffect, useRef } from 'react';

export function useLiveTimer(startTime: any) {
  const [elapsed, setElapsed] = useState<number>(0); // in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      return;
    }

    const start = startTime.toDate ? startTime.toDate().getTime() : new Date(startTime).getTime();
    
    const update = () => {
      const now = new Date().getTime();
      setElapsed(Math.floor((now - start) / 1000));
    };

    update();
    timerRef.current = setInterval(update, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v < 10 ? "0" + v : v).join(":");
  };

  return {
    elapsed,
    formatted: formatTime(elapsed)
  };
}
