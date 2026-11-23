// ── Event Bus ──
// Engines emit events (move, win, loss, combo, etc.) and the view layer
// maps them to sounds and animations via this simple pub/sub.

export function createEventBus() {
  const listeners = new Map();

  return {
    on(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(handler);
      return () => listeners.get(event)?.delete(handler);
    },
    emit(event, data) {
      if (listeners.has(event)) {
        for (const handler of listeners.get(event)) handler(data);
      }
    },
    off(event, handler) {
      listeners.get(event)?.delete(handler);
    },
    clear() {
      listeners.clear();
    },
  };
}

/** Singleton bus for the app. */
export const globalBus = createEventBus();
