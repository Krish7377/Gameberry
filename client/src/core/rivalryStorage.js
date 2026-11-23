// client/src/core/rivalryStorage.js — Persistent 7-Day Title Staking Storage
const STORAGE_KEY = 'ra_rivalry_titles_v1';

function isBotName(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  return lower.includes('roborival') || lower.includes('bot');
}

export function getActiveRivalries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    const now = Date.now();
    // Keep only strictly non-expired HUMAN vs HUMAN titles (7 days)
    return list.filter(
      (r) =>
        r &&
        r.expiresAt > now &&
        !isBotName(r.winnerName) &&
        !isBotName(r.loserName)
    );
  } catch (err) {
    console.warn('[rivalryStorage] read error:', err);
    return [];
  }
}

export function saveRivalryResult({ winnerName, winnerId, loserName, loserId, gameName, score }) {
  // Reject if any participant is a bot
  if (isBotName(winnerName) || isBotName(loserName)) {
    console.warn('[rivalryStorage] Titles cannot be staked or saved for bot matches.');
    return null;
  }

  try {
    const list = getActiveRivalries();
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days active

    // If loser previously had a title against winner, mark it reclaimed
    const updated = list.filter(
      (r) => !(r.winnerName === loserName && r.loserName === winnerName)
    );

    // Add new active rivalry title
    const newRecord = {
      id: 'riv_' + now + '_' + Math.random().toString(36).substring(2, 6),
      winnerName: winnerName || 'Winner',
      winnerId: winnerId || 'p1',
      loserName: loserName || 'Challenger',
      loserId: loserId || 'p2',
      gameName: gameName || 'Battle Arena',
      score: score || '1 - 0',
      createdAt: now,
      expiresAt,
    };

    updated.unshift(newRecord);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 10)));
    return newRecord;
  } catch (err) {
    console.warn('[rivalryStorage] save error:', err);
    return null;
  }
}

export function clearRivalry(id) {
  try {
    const list = getActiveRivalries().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('[rivalryStorage] clear error:', err);
  }
}
