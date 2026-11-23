// ── Stopwatch ──
// Uses a start timestamp, not setInterval, so throttled tabs can't drift it.
// The view calls elapsed() each animation frame and shows the result.

export function createStopwatch() {
  let startTime = null;
  let pauseOffset = 0;
  let running = false;

  return {
    start() {
      if (running) return;
      startTime = performance.now() - pauseOffset;
      running = true;
    },
    pause() {
      if (!running) return;
      pauseOffset = performance.now() - startTime;
      running = false;
    },
    reset() {
      startTime = null;
      pauseOffset = 0;
      running = false;
    },
    /** Returns elapsed milliseconds (whole number). */
    elapsed() {
      if (!running && startTime === null) return 0;
      if (!running) return Math.floor(pauseOffset);
      return Math.floor(performance.now() - startTime);
    },
    get isRunning() { return running; },
  };
}

/** Countdown variant for Speed Sudoku. */
export function createCountdown(durationMs) {
  const watch = createStopwatch();
  return {
    start: () => watch.start(),
    pause: () => watch.pause(),
    reset: () => watch.reset(),
    remaining() { return Math.max(0, durationMs - watch.elapsed()); },
    get expired() { return watch.elapsed() >= durationMs; },
    get isRunning() { return watch.isRunning; },
    elapsed: () => watch.elapsed(),
  };
}

/** Format milliseconds to M:SS.mmm */
export function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = ms % 1000;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}
