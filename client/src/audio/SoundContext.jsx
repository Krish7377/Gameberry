// client/src/audio/SoundContext.jsx — Audio Manager with Web Audio synth fallback
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { soundMap } from './soundMap.js';

const SoundContext = createContext(null);

export function SoundProvider({ children }) {
  // Safe default: Muted on first launch for lab demos!
  const [muted, setMuted] = useState(() => {
    const saved = localStorage.getItem('ra_muted');
    return saved === null ? true : saved === 'true';
  });

  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem('ra_volume');
    return saved ? Number(saved) : 0.6;
  });

  const audioCtxRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('ra_muted', String(muted));
  }, [muted]);

  useEffect(() => {
    localStorage.setItem('ra_volume', String(volume));
  }, [volume]);

  const toggleMute = () => {
    setMuted(prev => !prev);
  };

  const setVolume = (val) => {
    setVolumeState(Math.max(0, Math.min(1, val)));
  };

  const playSound = (soundId) => {
    if (muted) return;

    const config = soundMap[soundId];
    if (!config) return;

    // Initialize AudioContext lazily on user gesture
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }

    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Try HTML Audio element for MP3 first, fallback to oscillator synth
    const audio = new Audio(`/sounds/${config.file}`);
    audio.volume = volume;

    audio.play().catch(() => {
      // Synth oscillator fallback
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = config.type || 'sine';
        osc.frequency.setValueAtTime(config.fallbackFreq || 440, ctx.currentTime);

        // Quick attack and decay
        gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (config.duration || 0.2));

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + (config.duration || 0.2));
      } catch (e) {
        // Audio error ignored safely
      }
    });
  };

  return (
    <SoundContext.Provider value={{ muted, volume, toggleMute, setVolume, playSound }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSound must be used within SoundProvider');
  return ctx;
}
