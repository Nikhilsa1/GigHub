import Task, { TASK_STATUS } from '../models/Task.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import { ApiError } from '../utils/http.js';
import { applyTaskFailure, applyTaskSuccess, applyNewRating, isBanned } from './trust.service.js';
import { holdEscrow, refundEscrow, releaseEscrow } from './wallet.service.js';
import { notify } from './notification.service.js';
import { broadcast, publishToUser } from './events.service.js';

/**
 * Task lifecycle state machine.
 *
 *   open ──select──▶ in_progress ──approve──▶ completed
 *    │                 │   │
 *    │                 │   └─reject─▶ open          (escrow refunded, task reopened)
 *    │                 ├─worker withdraw─▶ cancelled (penalty + full refund)
 *    │                 └─client cancel──▶ cancelled (escrow frozen → admin dispute)
 *    └─client cancel─▶ cancelled
 *
 * Every transition is a single conditional `findOneAndUpdate` whose filter encodes the
 * precondition (current status, actor). If two requests race, only one can win — the other
 * gets a 409 instead of corrupting state. No read-modify-write.
 */
const { OPEN, IN_PROGRESS, COMPLETED, CANCELLED } = TASK_STATUS;

const idStr = (v) => (v ? String(v) : null);

async function loadTaskOr404(taskId) {
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');
  return task;
}

function emitTaskChanged(task, ...userIds) {
  broadcast('task:changed', { taskId: idStr(task._id) });
  userIds.filter(Boolean).forEach((u) => publishToUser(idStr(u), 'me:changed'));
}

/** Fails with a precise reason when an atomic transition didn't match. */
async function explainConflict(taskId, expected) {
  const t = await Task.findById(taskId).select('status');
  if (!t) throw ApiError.notFound('Task not found');
  throw ApiError.conflict(`Task is "${t.status}", expected "${expected}". It may have been updated by someone else — refresh and try again.`);
}

// ─── Create ──────────────────────────────────────────────────────────────────
export async function createTask(creator, data) {
  const task = await Task.create({ ...data, creatorId: creator._id });
  emitTaskChanged(task);
  return task;
}

// ─── Apply ───────────────────────────────────────────────────────────────────
export async function applyToTask(taskId, worker, { bid, commitment, message }) {
  if (isBanned(worker)) throw ApiError.forbidden('Your account is temporarily suspended from applying to tasks.');

  const task = await Task.findOneAndUpdate(
    { _id: taskId, status: OPEN, creatorId: { $ne: worker._id }, 'applicants.userId': { $ne: worker._id } },
    { $push: { applicants: { userId: worker._id, bid, commitment, message, appliedAt: new Date() } } },
    { new: true },
  );

  if (!task) {
    const t = await loadTaskOr404(taskId);
    if (idStr(t.creatorId) === idStr(worker._id)) throw ApiError.badRequest('You cannot apply to your own task');
    if (t.applicants.some((a) => idStr(a.userId) === idStr(worker._id))) throw ApiError.conflict('You have already applied to this task');
    throw ApiError.conflict('This task is no longer accepting applications');
  }

  await notify(task.creatorId, { type: 'application', message: `New applicant for "${task.title}" (bid ₹${bid})`, taskId: task._id });
  emitTaskChanged(task);
  return task;
}

// ─── Select candidate (funds escrow) ─────────────────────────────────────────
export async function selectCandidate(taskId, client, applicantId) {
  const task = await loadTaskOr404(taskId);
  if (idStr(task.creatorId) !== idStr(client._id)) throw ApiError.forbidden('Only the task creator can select a candidate');
  if (task.status !== OPEN) throw ApiError.conflict('A candidate can only be selected while the task is open');

  const applicant = task.applicants.find((a) => idStr(a.userId) === idStr(applicantId));
  if (!applicant) throw ApiError.badRequest('That user has not applied to this task');

  const worker = await User.findById(applicantId);
  if (!worker) throw ApiError.notFound('Applicant account not found');
  if (isBanned(worker)) throw ApiError.conflict('This applicant is currently suspended and cannot be selected');

  // 1) Lock funds first — if the wallet can't cover it, nothing changes.
  await holdEscrow(client._id, task._id, applicant.bid);

  // 2) Atomic transition open → in_progress. Compensate (refund) if we lost a race.
  const updated = await Task.findOneAndUpdate(
    { _id: task._id, status: OPEN, creatorId: client._id },
    { $set: { status: IN_PROGRESS, selectedApplicantId: worker._id, escrowAmount: applicant.bid } },
    { new: true },
  );
  if (!updated) {
    await refundEscrow(client._id, task._id, applicant.bid, 'Selection aborted (concurrent update)');
    await explainConflict(task._id, OPEN);
  }

  await notify(worker._id, { type: 'selected', message: `🎉 You were selected for "${task.title}"! ₹${applicant.bid} is secured in escrow.`, taskId: task._id });
  const others = task.applicants.filter((a) => idStr(a.userId) !== idStr(worker._id));
  await Promise.all(others.map((a) => notify(a.userId, { type: 'default', message: `Another candidate was selected for "${task.title}".`, taskId: task._id })));

  emitTaskChanged(updated, client._id, worker._id);
  return updated;
}

// ─── Progress update ─────────────────────────────────────────────────────────
export async function postUpdate(taskId, user, { message, images = [] }) {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, status: IN_PROGRESS, $or: [{ creatorId: user._id }, { selectedApplicantId: user._id }] },
    { $push: { updates: { userId: user._id, message, images, createdAt: new Date() } } },
    { new: true },
  );
  if (!task) {
    const t = await loadTaskOr404(taskId);
    if (t.status !== IN_PROGRESS) await explainConflict(taskId, IN_PROGRESS);
    throw ApiError.forbidden('Only the client and selected worker can post updates');
  }
  const recipient = idStr(task.creatorId) === idStr(user._id) ? task.selectedApplicantId : task.creatorId;
  await notify(recipient, { type: 'update', message: `New progress update on "${task.title}"`, taskId: task._id });
  emitTaskChanged(task);
  return task;
}

// ─── Approve (releases escrow) ───────────────────────────────────────────────
export async function approveTask(taskId, client) {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, status: IN_PROGRESS, creatorId: client._id },
    { $set: { status: COMPLETED, approved: true, completedAt: new Date() } },
    { new: true },
  );
  if (!task) {
    const t = await loadTaskOr404(taskId);
    if (idStr(t.creatorId) !== idStr(client._id)) throw ApiError.forbidden('Only the task creator can approve work');
    await explainConflict(taskId, IN_PROGRESS);
  }

  const payout = await releaseEscrow({
    clientId: task.creatorId,
    workerId: task.selectedApplicantId,
    taskId: task._id,
    escrowAmount: task.escrowAmount,
    payAmount: task.escrowAmount,
  });

  const worker = await User.findById(task.selectedApplicantId);
  if (worker) await User.updateOne({ _id: worker._id }, { $set: applyTaskSuccess(worker) });

  await notify(task.selectedApplicantId, {
    type: 'selected',
    message: `✅ "${task.title}" approved! ₹${payout.net} credited to your wallet.`,
    taskId: task._id,
  });
  emitTaskChanged(task, task.creatorId, task.selectedApplicantId);
  return { task, payout };
}

// ─── Reject work (reopen + refund) ───────────────────────────────────────────
export async function rejectWork(taskId, client, reason) {
  const before = await loadTaskOr404(taskId);
  const task = await Task.findOneAndUpdate(
    { _id: taskId, status: IN_PROGRESS, creatorId: client._id },
    {
      $set: { status: OPEN, selectedApplicantId: null, escrowAmount: 0 },
      $push: { updates: { userId: client._id, message: `❌ Work rejected: ${reason}`, createdAt: new Date() } },
    },
    { new: true },
  );
  if (!task) {
    if (idStr(before.creatorId) !== idStr(client._id)) throw ApiError.forbidden('Only the task creator can reject work');
    await explainConflict(taskId, IN_PROGRESS);
  }

  await refundEscrow(client._id, task._id, before.escrowAmount, 'Work rejected — escrow refunded');
  await notify(before.selectedApplicantId, { type: 'update', message: `Your work on "${task.title}" was rejected: ${reason}`, taskId: task._id });
  emitTaskChanged(task, client._id, before.selectedApplicantId);
  return task;
}

// ─── Cancel / withdraw ───────────────────────────────────────────────────────
export async function cancelTask(taskId, user, reason = '') {
  const before = await loadTaskOr404(taskId);
  const isClient = idStr(before.creatorId) === idStr(user._id);
  const isWorker = idStr(before.selectedApplicantId) === idStr(user._id);

  if (!isClient && !isWorker) throw ApiError.forbidden('Only the client or the selected worker can cancel this task');
  if (![OPEN, IN_PROGRESS].includes(before.status)) throw ApiError.conflict(`A ${before.status} task cannot be cancelled`);
  if (isWorker && before.status !== IN_PROGRESS) throw ApiError.conflict('You can only withdraw from a task in progress');

  const cancelledBy = isClient ? 'client' : 'worker';
  const task = await Task.findOneAndUpdate(
    { _id: taskId, status: before.status },
    { $set: { status: CANCELLED, cancelled: true, cancelledBy, cancellationReason: reason } },
    { new: true },
  );
  if (!task) await explainConflict(taskId, before.status);

  if (cancelledBy === 'worker') {
    // Worker failed a commitment: penalty + client gets a full refund.
    const worker = await User.findById(user._id);
    await User.updateOne({ _id: worker._id }, { $set: applyTaskFailure(worker) });
    await refundEscrow(task.creatorId, task._id, task.escrowAmount, 'Worker withdrew — full refund');
    await Task.updateOne({ _id: task._id }, { $set: { disputeResolved: true } });
    await notify(task.creatorId, { type: 'update', message: `The worker withdrew from "${task.title}". Your escrow was refunded in full.`, taskId: task._id });
  } else if (before.status === IN_PROGRESS) {
    // Client cancelled mid-way: escrow stays frozen until an admin decides the split.
    await notify(task.selectedApplicantId, {
      type: 'update',
      message: `"${task.title}" was cancelled by the client. An admin will review your contribution and decide the payout.`,
      taskId: task._id,
    });
  } else {
    await Task.updateOne({ _id: task._id }, { $set: { disputeResolved: true } });
  }

  emitTaskChanged(task, task.creatorId, task.selectedApplicantId);
  return Task.findById(task._id);
}

// ─── Rate ────────────────────────────────────────────────────────────────────
export async function rateUser(taskId, rater, { rating, feedback }) {
  const task = await loadTaskOr404(taskId);
  if (task.status !== COMPLETED) throw ApiError.conflict('You can only rate after the task is completed');

  const isClient = idStr(task.creatorId) === idStr(rater._id);
  const isWorker = idStr(task.selectedApplicantId) === idStr(rater._id);
  if (!isClient && !isWorker) throw ApiError.forbidden('Only participants of this task can leave a rating');

  const toUserId = isClient ? task.selectedApplicantId : task.creatorId;
  const review = await Review.create({ taskId: task._id, fromUserId: rater._id, toUserId, rating, feedback }); // unique index blocks duplicates

  const target = await User.findById(toUserId);
  if (target) await User.updateOne({ _id: target._id }, { $set: applyNewRating(target, rating) });

  await notify(toUserId, { type: 'default', message: `You received a ${rating}★ rating for "${task.title}"`, taskId: task._id });
  publishToUser(idStr(toUserId), 'me:changed');
  return review;
}

// ─── Admin: resolve a frozen escrow ──────────────────────────────────────────
export async function resolveDispute(taskId, admin, workerSharePct) {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, status: CANCELLED, disputeResolved: false },
    { $set: { disputeResolved: true } },
    { new: true },
  );
  if (!task) throw ApiError.conflict('This dispute does not exist or has already been resolved');

  const payAmount = Math.round(task.escrowAmount * (workerSharePct / 100));
  const payout = task.escrowAmount > 0 && task.selectedApplicantId
    ? await releaseEscrow({ clientId: task.creatorId, workerId: task.selectedApplicantId, taskId: task._id, escrowAmount: task.escrowAmount, payAmount })
    : { paid: 0, net: 0, fee: 0, refunded: 0 };

  await Task.updateOne(
    { _id: task._id },
    { $push: { updates: { userId: admin._id, message: `⚖️ Admin resolution: worker receives ${workerSharePct}% (₹${payout.net} after fee), client refunded ₹${payout.refunded}.`, createdAt: new Date() } } },
  );
  await notify(task.creatorId, { type: 'update', message: `Dispute on "${task.title}" resolved. ₹${payout.refunded} refunded to you.`, taskId: task._id });
  if (task.selectedApplicantId) {
    await notify(task.selectedApplicantId, { type: 'update', message: `Dispute on "${task.title}" resolved. ₹${payout.net} credited to you.`, taskId: task._id });
  }
  emitTaskChanged(task, task.creatorId, task.selectedApplicantId);
  return { task: await Task.findById(task._id), payout };
}

// ─── Read-side presenter ─────────────────────────────────────────────────────
/**
 * Hides competing bids from other applicants: only the creator (and admins) see every application;
 * everyone else sees anonymous counts plus their own application.
 */
export function presentTask(task, viewer) {
  const json = typeof task.toJSON === 'function' ? task.toJSON() : task;
  const viewerId = viewer ? idStr(viewer._id || viewer.id) : null;
  const creatorId = idStr(json.creatorId);
  const privileged = viewer && (viewer.role === 'admin' || creatorId === viewerId);
  if (privileged) return json;
  return {
    ...json,
    creatorId,
    selectedApplicantId: idStr(json.selectedApplicantId),
    applicants: (json.applicants || []).map((a) => {
      const aUserId = idStr(a.userId || a.id);
      if (aUserId && aUserId === viewerId) {
        return { ...a, userId: aUserId };
      }
      return { userId: aUserId, appliedAt: a.appliedAt };
    }),
  };
}
