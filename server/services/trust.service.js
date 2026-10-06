/**
 * Trust & Penalty Engine (pure functions — no DB access, fully unit-testable).
 *
 *  trust = 70 base
 *        + up to 25 for success rate
 *        + up to ±10 for rating deviation from 3★
 *        − 5 per penalty
 *        − 10 per red mark
 *  Every 3rd penalty => red mark + progressive ban (2, 4, 8, 16, 32 days).
 */
export const BAN_DURATIONS_DAYS = [2, 4, 8, 16, 32];
const DAY_MS = 86_400_000;

export function computeTrustScore(u) {
  const base = 70;
  const successBonus = u.totalTasks > 0 ? (u.completedTasks / u.totalTasks) * 25 : 0;
  const penaltyDeduction = (u.penalties || 0) * 5;
  const redMarkDeduction = (u.redMarks || 0) * 10;
  const ratingBonus = u.rating > 0 ? ((u.rating - 3) / 2) * 10 : 0;
  const score = base + successBonus - penaltyDeduction - redMarkDeduction + ratingBonus;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Returns the field changes to apply to a user who failed a committed task. */
export function applyTaskFailure(u, now = Date.now()) {
  const next = {
    failedTasks: (u.failedTasks || 0) + 1,
    totalTasks: (u.totalTasks || 0) + 1,
    penalties: (u.penalties || 0) + 1,
    redMarks: u.redMarks || 0,
    bannedUntil: u.bannedUntil || null,
  };
  if (next.penalties % 3 === 0) {
    next.redMarks += 1;
    const days = BAN_DURATIONS_DAYS[Math.min(next.redMarks - 1, BAN_DURATIONS_DAYS.length - 1)];
    next.bannedUntil = new Date(now + days * DAY_MS);
  }
  next.trustScore = computeTrustScore({ ...u, ...next });
  return next;
}

/** Returns the field changes to apply to a worker whose task was approved. */
export function applyTaskSuccess(u) {
  const next = {
    completedTasks: (u.completedTasks || 0) + 1,
    totalTasks: (u.totalTasks || 0) + 1,
  };
  next.trustScore = computeTrustScore({ ...u, ...next });
  return next;
}

/** Incremental average — O(1), no need to re-read every review. */
export function applyNewRating(u, rating) {
  const count = u.ratingCount || 0;
  const avg = count === 0 ? rating : (u.rating * count + rating) / (count + 1);
  const next = { rating: Math.round(avg * 10) / 10, ratingCount: count + 1 };
  next.trustScore = computeTrustScore({ ...u, ...next });
  return next;
}

export function isBanned(u, now = Date.now()) {
  const until = u.bannedUntil instanceof Date ? u.bannedUntil.getTime() : u.bannedUntil;
  return Boolean(until && until > now);
}
