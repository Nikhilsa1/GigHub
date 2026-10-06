import express from 'express';
import cors from 'cors';
import config from './config/env.js';
import routes from './routes/index.js';
import { securityHeaders, requestLogger, rateLimit, notFound, errorHandler } from './middleware/common.js';

/**
 * App factory — separated from the network listener so tests can mount the app
 * without opening a port.
 */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(securityHeaders);
  app.use(requestLogger);
  app.use(cors({
    origin(origin, cb) {
      // allow same-origin / curl (no Origin header) and configured front-ends
      if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', rateLimit({ windowMs: 60_000, max: 300 }));

  app.use('/api/v1', routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export default createApp;
