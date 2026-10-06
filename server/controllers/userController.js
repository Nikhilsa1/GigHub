import User from '../models/User.js';
import Review from '../models/Review.js';
import { ApiError } from '../utils/http.js';

const PUBLIC_FIELDS = [
  'id', 'name', 'university', 'bio', 'avatar', 'avatarColor', 'skills', 'links', 'rating', 'ratingCount',
  'totalTasks', 'completedTasks', 'failedTasks', 'trustScore', 'redMarks', 'penalties', 'bannedUntil',
  'verifiedStudent', 'createdAt', 'role',
];

/** Public profile: no email, wallet or other private data. */
export function presentUser(user) {
  const json = typeof user.toJSON === 'function' ? user.toJSON() : user;
  const out = {};
  for (const k of PUBLIC_FIELDS) if (json[k] !== undefined) out[k] = json[k];
  return out;
}

export async function list(req, res) {
  const users = await User.find().sort({ trustScore: -1 }).limit(500);
  const admin = req.user?.role === 'admin';
  res.json(users.map((u) => (admin ? u.toJSON() : presentUser(u))));
}

export async function getOne(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  res.json(presentUser(user));
}

export async function updateMe(req, res) {
  // req.body is already whitelisted by the validator: users can't edit trustScore, wallet, role, etc.
  const updates = { ...req.body };
  if (updates.name) updates.avatar = updates.name.split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  if (updates.links) updates.links = updates.links.map((l) => String(l).trim()).filter(Boolean).slice(0, 10);
  if (updates.skills) updates.skills = updates.skills.slice(0, 20).map((s) => ({ name: String(s.name || s).slice(0, 60), rating: Number(s.rating) || 3 }));

  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
  res.json(user.toJSON());
}

export async function reviewsFor(req, res) {
  const reviews = await Review.find({ toUserId: req.params.id }).sort({ createdAt: -1 }).limit(100);
  res.json(reviews.map((r) => r.toJSON()));
}
