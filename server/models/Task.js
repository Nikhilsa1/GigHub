import mongoose from 'mongoose';
import toClientJSON from './plugins/toClientJSON.js';

const { Schema } = mongoose;

export const TASK_STATUS = Object.freeze({
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

const applicantSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bid: { type: Number, required: true, min: 1 },
    commitment: { type: String, enum: ['full', 'partial', 'uncertain'], default: 'full' },
    message: { type: String, default: '', maxlength: 1000 },
    appliedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const updateSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, maxlength: 2000 },
    images: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 10, maxlength: 140 },
    description: { type: String, required: true, minlength: 30, maxlength: 5000 },
    category: { type: String, required: true },
    subfield: { type: String, default: '' },
    budget: { type: Number, required: true, min: 50 },
    deadline: { type: Date, required: true },
    experienceLevel: { type: String, enum: ['beginner', 'intermediate', 'expert'], default: 'beginner' },
    teamSize: { type: Number, default: 1, min: 1, max: 10 },
    urgent: { type: Boolean, default: false },

    status: { type: String, enum: Object.values(TASK_STATUS), default: TASK_STATUS.OPEN, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    selectedApplicantId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    applicants: { type: [applicantSchema], default: [] },
    updates: { type: [updateSchema], default: [] },

    // Escrow: amount held from the client's wallet once a worker is selected
    escrowAmount: { type: Number, default: 0 },
    approved: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    cancelled: { type: Boolean, default: false },
    cancelledBy: { type: String, enum: ['client', 'worker', 'admin', null], default: null },
    cancellationReason: { type: String, default: '' },
    disputeResolved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Feed queries: open tasks by recency / deadline
taskSchema.index({ status: 1, createdAt: -1 });
taskSchema.index({ status: 1, deadline: 1 });
taskSchema.index({ 'applicants.userId': 1 });
taskSchema.index({ title: 'text', description: 'text', subfield: 'text' });

taskSchema.plugin(toClientJSON);

export default mongoose.model('Task', taskSchema);
