// server/services/titleRules.js — PURE functions, no DB access.
// Decides what title actions to take after a series completes.

/**
 * Determine what title changes occur after `winner` beats `loser`.
 *
 * @param {string} winner   - winner userId (as string)
 * @param {string} loser    - loser userId (as string)
 * @param {Array}  existingTitles - array of active title objects with
 *        { _id, winner, loser, status }
 * @returns {Array} actions - e.g.
 *   [{ type: 'award', winner, loser }]
 *   [{ type: 'renew', titleId }]
 *   [{ type: 'reclaim', titleId }, { type: 'award', winner, loser }]
 */
export function decideTitleOutcome(winner, loser, existingTitles) {
  const winnerStr = String(winner);
  const loserStr  = String(loser);
  const actions = [];

  // Check: does winner already hold an active title over loser?
  const existingWinnerTitle = existingTitles.find(
    (t) => String(t.winner) === winnerStr && String(t.loser) === loserStr && t.status === 'active'
  );
  if (existingWinnerTitle) {
    // Renew (reset expiry) instead of creating a duplicate
    actions.push({ type: 'renew', titleId: existingWinnerTitle._id });
    return actions;
  }

  // Check: did the loser hold an active title over the winner?
  const loserTitle = existingTitles.find(
    (t) => String(t.winner) === loserStr && String(t.loser) === winnerStr && t.status === 'active'
  );
  if (loserTitle) {
    // Reclaim it and award a new one to the winner
    actions.push({ type: 'reclaim', titleId: loserTitle._id });
  }

  // Award new title to winner
  actions.push({ type: 'award', winner: winnerStr, loser: loserStr });
  return actions;
}

/**
 * Is this title expired (past its expiresAt date)?
 */
export function isExpired(title, now = new Date()) {
  return new Date(title.expiresAt) <= now;
}

/**
 * Should this title be cleaned up (deleted from DB)?
 * True when it has been expired for more than `cleanupDays` days.
 */
export function shouldCleanup(title, now = new Date(), cleanupDays = 30) {
  if (!isExpired(title, now)) return false;
  const expiredAt = new Date(title.expiresAt);
  const diff = now.getTime() - expiredAt.getTime();
  return diff > cleanupDays * 24 * 60 * 60 * 1000;
}
