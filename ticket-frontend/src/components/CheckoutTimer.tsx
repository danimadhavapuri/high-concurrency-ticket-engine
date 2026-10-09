import React, { useEffect, useState } from 'react';
import { useBookingStore } from '../store/useBookingStore';

export interface CheckoutTimerProps {
  onExpire?: () => void;
}

export const CheckoutTimer: React.FC<CheckoutTimerProps> = ({ onExpire }) => {
  const lockExpiresAt = useBookingStore((state) => state.lockExpiresAt);
  const resetLockTimer = useBookingStore((state) => state.resetLockTimer);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!lockExpiresAt) return;

    const updateTimer = () => {
      const remainingSeconds = Math.max(0, Math.floor((lockExpiresAt - Date.now()) / 1000));
      setTimeLeft(remainingSeconds);

      if (remainingSeconds === 0) {
        resetLockTimer();
        if (onExpire) {
          onExpire();
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [lockExpiresAt, resetLockTimer, onExpire]);

  if (!lockExpiresAt || timeLeft <= 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
      <span className="font-medium text-sm">Seats temporarily locked. Time remaining:</span>
      <span className="font-mono text-lg font-bold px-2 py-1 bg-amber-500/20 rounded">
        {formattedTime}
      </span>
    </div>
  );
};

export default CheckoutTimer;