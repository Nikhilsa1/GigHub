import mongoose from 'mongoose';
import toClientJSON from './plugins/toClientJSON.js';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, default: 'default' },
    message: { type: String, required: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
// Auto-expire old notifications after 60 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 3600 });
notificationSchema.plugin(toClientJSON);

export default mongoose.model('Notification', notificationSchema);
