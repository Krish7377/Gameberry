// client/src/components/Timer.jsx — High-precision requestAnimationFrame Stopwatch / Countdown
import React, { useState, useEffect } from 'react';
import { formatTime } from '../core/stopwatch.js';
import { useSound } from '../audio/SoundContext.jsx';

export default function Timer({ stopwatch, countdown, isRunning = true }) {
  const [display, setDisplay] = useState('0:00.000');
  const [isCritical, setIsCritical] = useState(false);
  const { playSound } = useSound();

  useEffect(() => {
    let animId;
    let lastSecond = -1;

    function loop() {
      if (countdown) {
        const rem = countdown.remaining();
        setDisplay(formatTime(rem));
        const secondsLeft = Math.floor(rem / 1000);

        if (secondsLeft <= 10 && rem > 0) {
          setIsCritical(true);
          if (secondsLeft !== lastSecond) {
            playSound('tick');
            lastSecond = secondsLeft;
          }
        } else {
          setIsCritical(false);
        }
      } else if (stopwatch) {
        setDisplay(formatTime(stopwatch.elapsed()));
      }

      if (isRunning) {
        animId = requestAnimationFrame(loop);
      }
    }

    if (isRunning) {
      animId = requestAnimationFrame(loop);
    }

    return () => cancelAnimationFrame(animId);
  }, [stopwatch, countdown, isRunning]);

  return (
    <div
      style={{
        fontFamily: 'monospace',
        fontSize: '1.4rem',
        fontWeight: 700,
        padding: '0.45rem 1.1rem',
        borderRadius: 'var(--radius-sm)',
        background: isCritical ? '#fef2f2' : '#eff6ff',
        border: `2px solid ${isCritical ? '#fca5a5' : '#bfdbfe'}`,
        color: isCritical ? '#dc2626' : '#1d4ed8',
        boxShadow: isCritical ? '0 2px 10px rgba(220, 38, 38, 0.25)' : '0 2px 8px rgba(37, 99, 235, 0.12)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <span>⏱</span>
      <span>{display}</span>
    </div>
  );
}
