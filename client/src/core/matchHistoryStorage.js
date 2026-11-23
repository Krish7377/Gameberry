// client/src/core/matchHistoryStorage.js — Persistent Local & Server Match History
const MATCH_STORAGE_KEY = 'ra_match_history_v1';

export function getMatchHistory() {
  try {
    const raw = localStorage.getItem(MATCH_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.warn('[matchHistoryStorage] read error:', err);
    return [];
  }
}

export function saveMatchRecord({
  gameName = 'Arena Game',
  gameId = 'unknown',
  opponentName = 'Opponent',
  opponentType = 'bot', // 'bot' | 'human' | 'solo'
  isTitleMatch = false,
  won = false,
  score = '1 - 0',
  durationSec = 0,
}) {
  try {
    const list = getMatchHistory();
    const now = Date.now();

    const record = {
      id: 'match_' + now + '_' + Math.random().toString(36).substring(2, 6),
      gameName,
      gameId,
      opponentName,
      opponentType,
      isTitleMatch: Boolean(isTitleMatch),
      won: Boolean(won),
      score,
      durationSec,
      playedAt: now,
    };

    // Keep up to 50 most recent matches
    const updated = [record, ...list].slice(0, 50);
    localStorage.setItem(MATCH_STORAGE_KEY, JSON.stringify(updated));
    return record;
  } catch (err) {
    console.warn('[matchHistoryStorage] save error:', err);
    return null;
  }
}

export function clearMatchHistory() {
  try {
    localStorage.removeItem(MATCH_STORAGE_KEY);
  } catch (err) {
    console.warn('[matchHistoryStorage] clear error:', err);
  }
}
