import mongoose from 'mongoose';
import toClientJSON from './plugins/toClientJSON.js';

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true },
);

// One review per reviewer per task — enforced by the database, not just the UI.
reviewSchema.index({ taskId: 1, fromUserId: 1 }, { unique: true });
reviewSchema.plugin(toClientJSON);

export default mongoose.model('Review', reviewSchema);
