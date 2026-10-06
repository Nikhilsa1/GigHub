import { Router } from 'express';
import { asyncHandler as h } from '../utils/http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate, validateIdParam } from '../middleware/validate.js';
import { rateLimit } from '../middleware/common.js';
import * as auth from '../controllers/authController.js';
import * as tasks from '../controllers/taskController.js';
import * as users from '../controllers/userController.js';
import * as platform from '../controllers/platformController.js';

const router = Router();
const id = validateIdParam('id');

// ─── Validation schemas (single source of truth for input contracts) ─────────
const S = {
  register: {
    name: { type: 'string', required: true, minLength: 2, maxLength: 80 },
    email: { type: 'email', required: true },
    password: { type: 'string', required: true, minLength: 6, maxLength: 128, trim: false },
    university: { type: 'string', maxLength: 120, default: '' },
    bio: { type: 'string', maxLength: 600, default: '' },
    skills: { type: 'array', max: 20, default: [] },
  },
  login: {
    email: { type: 'email', required: true },
    password: { type: 'string', required: true, trim: false },
  },
  updateMe: {
    name: { type: 'string', minLength: 2, maxLength: 80 },
    university: { type: 'string', maxLength: 120 },
    bio: { type: 'string', maxLength: 600 },
    links: { type: 'array', max: 10 },
    skills: { type: 'array', max: 20 },
  },
  createTask: {
    title: { type: 'string', required: true, minLength: 10, maxLength: 140 },
    description: { type: 'string', required: true, minLength: 30, maxLength: 5000 },
    category: { type: 'string', required: true, enum: ['coding', 'design', 'notes', 'tutoring', 'copywriting', 'video', 'media'] },
    subfield: { type: 'string', maxLength: 60, default: '' },
    budget: { type: 'number', required: true, min: 50, max: 1_000_000 },
    deadline: { type: 'date', required: true, future: true },
    experienceLevel: { type: 'string', enum: ['beginner', 'intermediate', 'expert'], default: 'beginner' },
    teamSize: { type: 'number', min: 1, max: 10, default: 1 },
    urgent: { type: 'boolean', default: false },
  },
  apply: {
    bid: { type: 'number', required: true, min: 1, max: 1_000_000 },
    commitment: { type: 'string', enum: ['full', 'partial', 'uncertain'], default: 'full' },
    message: { type: 'string', maxLength: 1000, default: '' },
  },
  select: { applicantId: { type: 'objectId', required: true } },
  update: { message: { type: 'string', required: true, minLength: 1, maxLength: 2000 }, images: { type: 'array', max: 5, default: [] } },
  reason: { reason: { type: 'string', maxLength: 1000, default: '' } },
  rejectReason: { reason: { type: 'string', required: true, minLength: 3, maxLength: 1000 } },
  rate: { rating: { type: 'number', required: true, min: 1, max: 5 }, feedback: { type: 'string', maxLength: 1000, default: '' } },
  listTasks: {
    status: { type: 'string', enum: ['open', 'in_progress', 'completed', 'cancelled'] },
    category: { type: 'string' },
    q: { type: 'string', maxLength: 100 },
    mine: { type: 'boolean' },
    page: { type: 'number', min: 1, default: 1 },
    limit: { type: 'number', min: 1, max: 500, default: 200 },
  },
  topUp: { amount: { type: 'number', required: true, min: 1, max: 10_000 } },
  resolve: { workerSharePct: { type: 'number', required: true, min: 0, max: 100 } },
};

// ─── Public ──────────────────────────────────────────────────────────────────
router.get('/health', h(platform.health));
router.get('/stats', h(platform.platformStats));
router.get('/events', h(platform.eventStream));

// Stricter limit on credential endpoints to slow brute-force attempts
const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 30, keyPrefix: 'auth' });
router.post('/auth/register', authLimiter, validate(S.register), h(auth.register));
router.post('/auth/login', authLimiter, validate(S.login), h(auth.login));

// ─── Authenticated ───────────────────────────────────────────────────────────
router.use(requireAuth);

router.get('/auth/me', h(auth.me));

router.get('/users', h(users.list));
router.patch('/users/me', validate(S.updateMe), h(users.updateMe));
router.get('/users/:id', id, h(users.getOne));
router.get('/users/:id/reviews', id, h(users.reviewsFor));

router.get('/tasks', validate(S.listTasks, 'query'), h(tasks.list));
router.get('/tasks/recommended', h(tasks.recommended));
router.post('/tasks', validate(S.createTask), h(tasks.create));
router.get('/tasks/:id', id, h(tasks.getOne));
router.get('/tasks/:id/applicants/ranked', id, h(tasks.ranked));
router.post('/tasks/:id/apply', id, validate(S.apply), h(tasks.apply));
router.post('/tasks/:id/select', id, validate(S.select), h(tasks.select));
router.post('/tasks/:id/updates', id, validate(S.update), h(tasks.postUpdate));
router.post('/tasks/:id/approve', id, h(tasks.approve));
router.post('/tasks/:id/reject', id, validate(S.rejectReason), h(tasks.reject));
router.post('/tasks/:id/cancel', id, validate(S.reason), h(tasks.cancel));
router.post('/tasks/:id/rate', id, validate(S.rate), h(tasks.rate));

router.get('/notifications', h(platform.listNotifications));
router.patch('/notifications/read-all', h(platform.markAllRead));
router.patch('/notifications/:id/read', id, h(platform.markRead));
router.delete('/notifications', h(platform.clearNotifications));

router.get('/wallet', h(platform.getWallet));
router.post('/wallet/topup', validate(S.topUp), h(platform.topUpWallet));

// ─── Admin (RBAC) ────────────────────────────────────────────────────────────
router.get('/admin/overview', requireRole('admin'), h(platform.adminOverview));
router.post('/admin/tasks/:id/resolve', requireRole('admin'), id, validate(S.resolve), h(platform.adminResolve));
router.post('/admin/users/:id/unban', requireRole('admin'), id, h(platform.adminUnban));

export default router;
