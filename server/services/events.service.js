import { EventEmitter } from 'node:events';

/**
 * In-process pub/sub used for real-time pushes over Server-Sent Events.
 * For multi-instance deployments, replace with Redis pub/sub — the publish/subscribe API stays the same.
 */
const bus = new EventEmitter();
bus.setMaxListeners(0);

export function publishToUser(userId, event, payload = {}) {
  if (!userId) return;
  bus.emit(`user:${userId}`, { event, payload });
}

export function broadcast(event, payload = {}) {
  bus.emit('broadcast', { event, payload });
}

export function subscribe(userId, handler) {
  const userChannel = `user:${userId}`;
  bus.on(userChannel, handler);
  bus.on('broadcast', handler);
  return () => {
    bus.off(userChannel, handler);
    bus.off('broadcast', handler);
  };
}
