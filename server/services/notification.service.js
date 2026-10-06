import Notification from '../models/Notification.js';
import { publishToUser } from './events.service.js';
import logger from '../utils/logger.js';

/** Persists a notification and pushes it live to the recipient. Never throws (side-effect only). */
export async function notify(userId, { type = 'default', message, taskId = null }) {
  try {
    const n = await Notification.create({ userId, type, message, taskId });
    publishToUser(String(userId), 'notification', n.toJSON());
    return n;
  } catch (err) {
    logger.error(`notify failed: ${err.message}`);
    return null;
  }
}
