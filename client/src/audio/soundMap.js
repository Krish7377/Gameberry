// client/src/audio/soundMap.js — Event to Sound file & synth fallback mappings
export const soundMap = {
  loss_khatam: {
    file: 'loss.mp3',
    fallbackFreq: 180,
    type: 'sawtooth',
    duration: 0.6,
  },
  win_nikal: {
    file: 'win.mp3',
    fallbackFreq: 660,
    type: 'triangle',
    duration: 0.5,
  },
  combo_hype: {
    file: 'combo.mp3',
    fallbackFreq: 880,
    type: 'sine',
    duration: 0.4,
  },
  click: {
    file: 'click.mp3',
    fallbackFreq: 440,
    type: 'sine',
    duration: 0.08,
  },
  hover: {
    file: 'hover.mp3',
    fallbackFreq: 330,
    type: 'sine',
    duration: 0.05,
  },
  slide: {
    file: 'slide.mp3',
    fallbackFreq: 280,
    type: 'sine',
    duration: 0.12,
  },
  tick: {
    file: 'tick.mp3',
    fallbackFreq: 520,
    type: 'square',
    duration: 0.06,
  },
  countdown_tick: {
    file: 'countdown.mp3',
    fallbackFreq: 600,
    type: 'sine',
    duration: 0.1,
  },
};
