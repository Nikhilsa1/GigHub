import config from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import createApp from './app.js';
import logger from './utils/logger.js';

async function main() {
  try {
    await connectDB();
  } catch (err) {
    logger.error(`Could not connect to MongoDB at ${config.mongoUri}: ${err.message}`);
    logger.error('Start MongoDB (e.g. `mongod --dbpath .mongodb/data`) and retry.');
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`GigHub API listening on http://localhost:${config.port}/api/v1 (${config.env})`);
    if (config.mlServiceUrl) logger.info(`ML service: ${config.mlServiceUrl}`);
  });

  // Graceful shutdown: stop accepting connections, finish in-flight requests, close DB.
  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => logger.error(`Unhandled rejection: ${reason?.stack || reason}`));
}

main();
