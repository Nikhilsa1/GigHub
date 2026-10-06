import Task from '../models/Task.js';
import User from '../models/User.js';
import { ApiError } from '../utils/http.js';
import * as taskService from '../services/task.service.js';
import { rankApplicants, recommendTasks } from '../services/recommender.service.js';
import { presentUser } from './userController.js';

export async function list(req, res) {
  const { status, category, q, mine, page = 1, limit = 200 } = req.validatedQuery || {};
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (q) filter.$text = { $search: q };
  if (mine && req.user) {
    filter.$or = [{ creatorId: req.user._id }, { selectedApplicantId: req.user._id }, { 'applicants.userId': req.user._id }];
  }

  const [items, total] = await Promise.all([
    Task.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Task.countDocuments(filter),
  ]);

  res.json({ items: items.map((t) => taskService.presentTask(t, req.user)), total, page, limit });
}

export async function getOne(req, res) {
  const task = await Task.findById(req.params.id);
  if (!task) throw ApiError.notFound('Task not found');
  res.json(taskService.presentTask(task, req.user));
}

export async function create(req, res) {
  const task = await taskService.createTask(req.user, req.body);
  res.status(201).json(taskService.presentTask(task, req.user));
}

export async function apply(req, res) {
  const task = await taskService.applyToTask(req.params.id, req.user, req.body);
  res.status(201).json(taskService.presentTask(task, req.user));
}

export async function select(req, res) {
  const task = await taskService.selectCandidate(req.params.id, req.user, req.body.applicantId);
  res.json(taskService.presentTask(task, req.user));
}

export async function postUpdate(req, res) {
  const task = await taskService.postUpdate(req.params.id, req.user, req.body);
  res.status(201).json(taskService.presentTask(task, req.user));
}

export async function approve(req, res) {
  const { task, payout } = await taskService.approveTask(req.params.id, req.user);
  res.json({ task: taskService.presentTask(task, req.user), payout });
}

export async function reject(req, res) {
  const task = await taskService.rejectWork(req.params.id, req.user, req.body.reason);
  res.json(taskService.presentTask(task, req.user));
}

export async function cancel(req, res) {
  const task = await taskService.cancelTask(req.params.id, req.user, req.body.reason);
  res.json(taskService.presentTask(task, req.user));
}

export async function rate(req, res) {
  const review = await taskService.rateUser(req.params.id, req.user, req.body);
  res.status(201).json(review.toJSON());
}

/** Explainable, server-side ranking — creator only. */
export async function ranked(req, res) {
  const task = await Task.findById(req.params.id);
  if (!task) throw ApiError.notFound('Task not found');
  if (String(task.creatorId) !== req.userId && req.user.role !== 'admin') throw ApiError.forbidden('Only the task creator can view ranked applicants');

  const mode = req.query.mode === 'cost' ? 'cost' : 'quality';
  const users = await User.find({ _id: { $in: task.applicants.map((a) => a.userId) } });
  const userJson = users.map((u) => u.toJSON());
  const taskJson = task.toJSON();

  const { engine, applicants } = await rankApplicants(taskJson.applicants, userJson, taskJson, mode);
  const byId = new Map(userJson.map((u) => [u.id, presentUser(u)]));
  res.json({ engine, mode, applicants: applicants.map((a) => ({ ...a, user: byId.get(String(a.userId)) || null })) });
}

export async function recommended(req, res) {
  const open = await Task.find({ status: 'open', creatorId: { $ne: req.user._id } }).sort({ createdAt: -1 }).limit(300);
  const ranked = recommendTasks(req.user.toJSON(), open.map((t) => t.toJSON())).slice(0, Number(req.query.limit) || 6);
  res.json(ranked.map(({ task, recommendScore, skillMatch }) => ({ ...taskService.presentTask(task, req.user), recommendScore, skillMatch })));
}
