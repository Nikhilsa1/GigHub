import config from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Applicant Recommendation Engine.
 *
 * Explainable multi-factor scoring: every score ships with a per-factor breakdown so the
 * client (and the user) can see *why* a candidate ranks where they do.
 *
 * Strategy pattern: if ML_SERVICE_URL is configured the Python FastAPI service is consulted
 * (with a hard timeout); any failure falls back to the in-process engine so ranking never breaks.
 */
export const WEIGHTS = Object.freeze({
  quality: { skillMatch: 0.30, rating: 0.25, successRate: 0.20, cost: 0.05, newUser: 0.10, trust: 0.10 },
  cost: { skillMatch: 0.20, rating: 0.15, successRate: 0.15, cost: 0.30, newUser: 0.10, trust: 0.10 },
});

const COMMITMENT_FACTOR = { full: 1.0, partial: 0.92, uncertain: 0.8 };

const norm = (s) => String(s || '').toLowerCase().trim();

/** Fuzzy skill overlap against the task's subfield (specific) and category (general), weighted by self-rated proficiency. */
export function computeSkillMatch(user, task) {
  const skills = (user.skills || []).filter((s) => s?.name);
  if (!skills.length) return 0;

  const matchTarget = (target) => {
    if (!target) return 0;
    const t = norm(target);
    let best = 0;
    for (const s of skills) {
      const n = norm(s.name);
      if (n && (n.includes(t) || t.includes(n))) {
        const proficiency = Math.min(Math.max((s.rating ?? 3) / 5, 0.4), 1);
        best = Math.max(best, proficiency);
      }
    }
    return best;
  };

  const subfieldScore = matchTarget(task.subfield);
  const categoryScore = matchTarget(task.category);

  if (task.subfield && task.category) {
    // If exact subfield matches (e.g. Python), give primary credit even if user didn't write generic "Coding"
    if (subfieldScore > 0) {
      return Math.min(subfieldScore * 0.85 + (categoryScore > 0 ? categoryScore * 0.15 : subfieldScore * 0.15), 1);
    }
    return categoryScore * 0.6;
  }

  return subfieldScore || categoryScore || 0;
}

export function scoreApplicant(user, task, applicant, mode = 'quality') {
  const w = WEIGHTS[mode] || WEIGHTS.quality;
  const bid = applicant.bid;

  const factors = {
    skillMatch: computeSkillMatch(user, task),
    rating: (user.rating || 0) / 5,
    successRate: user.totalTasks > 0 ? user.completedTasks / user.totalTasks : 0,
    cost: task.budget > 0 ? 1 - Math.min(bid / task.budget, 1) : 0,
    newUser: (user.totalTasks || 0) < 3 ? 1 : 0,
    trust: (user.trustScore ?? 70) / 100,
  };

  const penaltyFactor = user.redMarks > 0 ? Math.max(0, 1 - user.redMarks * 0.2) : 1;
  const commitmentFactor = COMMITMENT_FACTOR[applicant.commitment] ?? 1;

  const breakdown = {};
  let raw = 0;
  for (const [k, v] of Object.entries(factors)) {
    const contribution = v * w[k];
    raw += contribution;
    breakdown[k] = { value: Math.round(v * 100) / 100, weight: w[k], points: Math.round(contribution * 100) };
  }

  const score = Math.round(raw * penaltyFactor * commitmentFactor * 100);
  return { score, breakdown, modifiers: { penaltyFactor, commitmentFactor } };
}

export function rankApplicantsLocal(applicants, usersById, task, mode) {
  return applicants
    .map((a) => {
      const user = usersById.get(String(a.userId));
      if (!user) return { ...a, score: 0, breakdown: null };
      return { ...a, ...scoreApplicant(user, task, a, mode) };
    })
    .sort((x, y) => y.score - x.score);
}

async function rankViaMlService(applicants, users, task, mode) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.mlTimeoutMs);
  try {
    const res = await fetch(`${config.mlServiceUrl}/api/recommender/rank-applicants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicants, users, task, mode }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`ML service responded ${res.status}`);
    const data = await res.json();
    return data.applicants;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Public entry point. Always resolves; reports which engine produced the ranking.
 */
export async function rankApplicants(applicants, users, task, mode = 'quality') {
  const usersById = new Map(users.map((u) => [String(u.id), u]));
  const local = rankApplicantsLocal(applicants, usersById, task, mode);

  if (!config.mlServiceUrl) return { engine: 'local', applicants: local };

  try {
    const remote = await rankViaMlService(applicants, users, task, mode);
    // Keep local explanations; trust the ML service for the final score/order.
    const localById = new Map(local.map((a) => [String(a.userId), a]));
    const merged = remote.map((r) => ({ ...localById.get(String(r.userId)), score: r.score }));
    return { engine: 'ml-service', applicants: merged };
  } catch (err) {
    logger.warn(`ML service unavailable, using local engine: ${err.message}`);
    return { engine: 'local-fallback', applicants: local };
  }
}

function deadlineFactor(deadline, now = Date.now()) {
  const days = (new Date(deadline).getTime() - now) / 86_400_000;
  if (days < 1) return 1.0;
  if (days < 3) return 0.8;
  if (days < 7) return 0.5;
  return 0.2;
}

/** Personalised feed ranking for a worker. */
export function recommendTasks(user, tasks) {
  const me = String(user.id || user._id);
  return tasks
    .filter((t) => t.status === 'open' && String(t.creatorId) !== me)
    .map((t) => {
      const skill = computeSkillMatch(user, t);
      const score = skill * 0.6 + (t.urgent ? 0.15 : 0) + deadlineFactor(t.deadline) * 0.1;
      return { task: t, recommendScore: Math.round(score * 100), skillMatch: Math.round(skill * 100) };
    })
    .sort((a, b) => b.recommendScore - a.recommendScore);
}
