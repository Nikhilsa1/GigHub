import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import config from '../config/env.js';
import { signToken } from '../middleware/auth.js';
import { ApiError } from '../utils/http.js';
import { topUp } from '../services/wallet.service.js';

const AVATAR_COLORS = ['#ff6b35', '#dc2626', '#ff8c61', '#ef4444', '#ff5722', '#b91c1c', '#ff9470'];
const ACADEMIC_DOMAIN = /\.(edu|ac\.[a-z]{2}|edu\.[a-z]{2})$/i;

function initials(name) {
  return name.split(/\s+/).filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export async function register(req, res) {
  const { name, email, password, university, bio, skills } = req.body;

  if (await User.exists({ email })) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 12),
    university,
    bio,
    skills: (skills || []).slice(0, 20).map((s) => ({ name: String(s.name || s).slice(0, 60), rating: Number(s.rating) || 3 })),
    avatar: initials(name),
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    verifiedStudent: ACADEMIC_DOMAIN.test(email.split('@')[1] || ''),
  });

  // Every new account gets demo credits so the escrow flow can be tried end-to-end.
  await topUp(user._id, config.starterWalletCredits, 'Welcome credits');
  const fresh = await User.findById(user._id);

  res.status(201).json({ user: fresh.toJSON(), token: signToken(user._id) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  // Same message for unknown email and wrong password — prevents account enumeration.
  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) throw ApiError.unauthorized('Invalid email or password');

  res.json({ user: user.toJSON(), token: signToken(user._id) });
}

export async function me(req, res) {
  res.json(req.user.toJSON());
}
