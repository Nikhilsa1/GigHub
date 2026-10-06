/**
 * Minimal structured logger (JSON in production, readable in development).
 * Kept dependency-free on purpose; swap for pino/winston without touching callers.
 */
const isProd = process.env.NODE_ENV === 'production';

function log(level, msg, meta = {}) {
  if (isProd) {
    console[level === 'error' ? 'error' : 'log'](JSON.stringify({ ts: new Date().toISOString(), level, msg, ...meta }));
  } else {
    const extra = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    console[level === 'error' ? 'error' : 'log'](`[${level.toUpperCase()}] ${msg}${extra}`);
  }
}

export const logger = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};

export default logger;
