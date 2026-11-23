// client/src/components/LoserFlash.jsx — Red / Grayscale Flash Screen on Defeat
import React from 'react';
import { motion } from 'framer-motion';

export default function LoserFlash({ onComplete }) {
  return (
    <motion.div
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 998,
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, rgba(0, 0, 0, 0.8) 100%)',
        backdropFilter: 'grayscale(100%) contrast(150%)',
        pointerEvents: 'none',
      }}
    />
  );
}
