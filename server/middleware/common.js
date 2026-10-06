import crypto from 'node:crypto';
import mongoose from 'mongoose';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/http.js';

/** Basic hardening headers (subset of what helmet sets). */
export function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.removeHeader('X-Powered-By');
  next();
}

/** Attaches a request id and logs method/path/status/latency. */
export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  res.on('finish', () => {
    if (req.path.endsWith('/events')) return; // don't log long-lived SSE connections
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`, { reqId: req.id });
  });
  next();
}

/**
 * Fixed-window in-memory rate limiter. Good enough for a single instance;
 * swap the Map for Redis when horizontally scaling.
 */
export function rateLimit({ windowMs = 60_000, max = 120, keyPrefix = 'global' } = {}) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }, windowMs).unref();

  return (req, res, next) => {
    const key = `${keyPrefix}:${req.ip}`;
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.reset <= now) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', Math.max(0, max - entry.count));
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.reset - now) / 1000));
      return next(new ApiError(429, 'Too many requests, please slow down.'));
    }
    next();
  };
}

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/** Single place where every error becomes a consistent JSON response. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = details[0]?.message || 'Validation failed';
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = `Duplicate value for ${Object.keys(err.keyValue || {}).join(', ') || 'field'}`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  }

  if (status >= 500) logger.error(err.stack || message, { reqId: req.id });

  res.status(status).json({
    error: {
      status,
      message: status >= 500 && config.isProd ? 'Internal server error' : message,
      ...(details ? { details } : {}),
      requestId: req.id,
    },
    message: status >= 500 && config.isProd ? 'Internal server error' : message, // backwards-compatible field
  });
}
