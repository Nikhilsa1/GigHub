import Notification from '../models/Notification.js';
import Transaction from '../models/Transaction.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { ApiError } from '../utils/http.js';
import { topUp } from '../services/wallet.service.js';
import { resolveDispute } from '../services/task.service.js';
import { subscribe } from '../services/events.service.js';
import { verifyToken } from '../middleware/auth.js';
import { dbStatus } from '../config/db.js';
import config from '../config/env.js';

// ─── Notifications ───────────────────────────────────────────────────────────
export async function listNotifications(req, res) {
  const items = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json(items.map((n) => n.toJSON()));
}
export async function markAllRead(req, res) {
  await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } });
  res.status(204).end();
}
export async function markRead(req, res) {
  await Notification.updateOne({ _id: req.params.id, userId: req.user._id }, { $set: { read: true } });
  res.status(204).end();
}
export async function clearNotifications(req, res) {
  await Notification.deleteMany({ userId: req.user._id });
  res.status(204).end();
}

// ─── Wallet ──────────────────────────────────────────────────────────────────
export async function getWallet(req, res) {
  const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
  const { walletBalance, escrowLocked, totalEarned, totalSpent } = req.user;
  res.json({ walletBalance, escrowLocked, totalEarned, totalSpent, transactions: transactions.map((t) => t.toJSON()) });
}
export async function topUpWallet(req, res) {
  await topUp(req.user._id, req.body.amount, 'Demo top-up');
  const user = await User.findById(req.user._id);
  res.json({ walletBalance: user.walletBalance });
}

// ─── Admin ───────────────────────────────────────────────────────────────────
export async function adminOverview(_req, res) {
  const now = new Date();
  const [disputes, overdue, users, feeAgg] = await Promise.all([
    Task.find({ status: 'cancelled', $or: [{ disputeResolved: false }, { cancelledBy: 'worker' }] }).sort({ updatedAt: -1 }).limit(100),
    Task.find({ status: 'in_progress', deadline: { $lt: now } }).sort({ deadline: 1 }).limit(100),
    User.find().sort({ redMarks: -1, trustScore: 1 }).limit(500),
    Transaction.aggregate([{ $match: { type: 'platform_fee' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);
  res.json({
    disputes: disputes.map((t) => t.toJSON()),
    overdue: overdue.map((t) => t.toJSON()),
    users: users.map((u) => u.toJSON()),
    platformRevenue: feeAgg[0]?.total || 0,
  });
}
export async function adminResolve(req, res) {
  const result = await resolveDispute(req.params.id, req.user, req.body.workerSharePct);
  res.json({ task: result.task.toJSON(), payout: result.payout });
}
export async function adminUnban(req, res) {
  const user = await User.findByIdAndUpdate(req.params.id, { $set: { bannedUntil: null } }, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  res.json(user.toJSON());
}

// ─── Public platform stats (landing page / pitch) ────────────────────────────
export async function platformStats(_req, res) {
  const [students, tasks, completed, gmvAgg] = await Promise.all([
    User.countDocuments(),
    Task.countDocuments(),
    Task.countDocuments({ status: 'completed' }),
    Transaction.aggregate([{ $match: { type: 'escrow_hold' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);
  res.json({ students, tasks, completed, gmv: gmvAgg[0]?.total || 0 });
}

// ─── Health ──────────────────────────────────────────────────────────────────
export async function health(_req, res) {
  const db = dbStatus();
  res.status(db === 'connected' ? 200 : 503).json({
    status: db === 'connected' ? 'ok' : 'degraded',
    db,
    mlService: config.mlServiceUrl ? 'configured' : 'local-engine',
    uptimeSec: Math.round(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
  });
}

// ─── Server-Sent Events (real-time push) ─────────────────────────────────────
/**
 * EventSource can't send headers, so the JWT comes as ?token=. The stream pushes
 * `notification`, `task:changed` and `me:changed` events; the client refetches what it needs.
 */
export async function eventStream(req, res) {
  let userId;
  try {
    userId = verifyToken(String(req.query.token || ''));
  } catch {
    throw ApiError.unauthorized('Invalid stream token');
  }
  if (!(await User.exists({ _id: userId }))) throw ApiError.unauthorized();

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(`event: ready\ndata: {}\n\n`);

  const send = ({ event, payload }) => res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  const unsubscribe = subscribe(String(userId), send);
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
}
