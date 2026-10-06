import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import User from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/http.js';

export function signToken(userId) {
  return jwt.sign({ sub: userId.toString() }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function verifyToken(token) {
  const decoded = jwt.verify(token, config.jwtSecret);
  return decoded.sub || decoded.userId; // `userId` supports tokens issued by the old implementation
}

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/**
 * Verifies the JWT and loads the user so downstream code always works with fresh data
 * (e.g. a ban applied a minute ago takes effect immediately).
 */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized();

  let userId;
  try {
    userId = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Session expired or invalid. Please sign in again.');
  }

  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized('Account no longer exists');

  req.user = user;
  req.userId = user._id.toString();
  next();
});

/** Role-based access control. Usage: router.get('/x', requireAuth, requireRole('admin'), handler) */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(ApiError.forbidden('Admin access required'));
  next();
};

export default requireAuth;
