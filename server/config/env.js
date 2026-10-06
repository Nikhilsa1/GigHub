import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralised, validated configuration.
 * The server fails fast on boot if a required variable is missing in production,
 * instead of failing later at request time.
 */
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`[config] Missing required environment variable: ${name}`);
  }
  return value;
}

const JWT_SECRET = isProd ? required('JWT_SECRET') : (process.env.JWT_SECRET || 'dev_only_insecure_secret');

if (isProd && JWT_SECRET.length < 32) {
  throw new Error('[config] JWT_SECRET must be at least 32 characters in production');
}

export const config = Object.freeze({
  env: NODE_ENV,
  isProd,
  port: Number(process.env.PORT) || 5000,
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/gighub'),
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  // Optional Python ML microservice. If unset/unreachable the API falls back to the in-process engine.
  mlServiceUrl: process.env.ML_SERVICE_URL || '',
  mlTimeoutMs: Number(process.env.ML_TIMEOUT_MS) || 800,
  platformFeeRate: 0.10,
  starterWalletCredits: Number(process.env.STARTER_WALLET_CREDITS) || 5000,
});

export default config;
