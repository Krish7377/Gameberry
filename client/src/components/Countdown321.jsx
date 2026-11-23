// client/src/components/Countdown321.jsx — Pre-round 3-2-1 Countdown
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../audio/SoundContext.jsx';

export default function Countdown321({ onComplete }) {
  const [count, setCount] = useState(3);
  const { playSound } = useSound();

  useEffect(() => {
    playSound('countdown_tick');

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          playSound('win_nikal');
          setTimeout(onComplete, 400);
          return 0; // 'GO!'
        }
        playSound('countdown_tick');
        return prev - 1;
      });
    }, 850);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          exit={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: '7.5rem',
            color: count === 0 ? '#16a34a' : '#ea580c',
            textShadow: count === 0 ? '0 6px 30px rgba(22, 163, 74, 0.4)' : '0 6px 30px rgba(234, 88, 12, 0.4)',
          }}
        >
          {count === 0 ? 'GO!' : count}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
