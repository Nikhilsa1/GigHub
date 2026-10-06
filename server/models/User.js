import mongoose from 'mongoose';
import toClientJSON from './plugins/toClientJSON.js';

const skillSchema = new mongoose.Schema(
  { name: { type: String, required: true, trim: true, maxlength: 60 }, rating: { type: Number, default: 3, min: 0, max: 5 } },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    university: { type: String, default: '', maxlength: 120 },
    bio: { type: String, default: '', maxlength: 600 },
    avatar: { type: String, default: '' },
    avatarColor: { type: String, default: '#ff6b35' },
    skills: { type: [skillSchema], default: [] },
    links: { type: [String], default: [] },

    // Reputation
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    failedTasks: { type: Number, default: 0 },
    trustScore: { type: Number, default: 70, min: 0, max: 100 },
    penalties: { type: Number, default: 0 },
    redMarks: { type: Number, default: 0 },
    bannedUntil: { type: Date, default: null },

    // Wallet (simulated escrow ledger; see Transaction model)
    walletBalance: { type: Number, default: 0, min: 0 },
    escrowLocked: { type: Number, default: 0, min: 0 },
    totalEarned: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },

    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    verifiedStudent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.index({ trustScore: -1 });
userSchema.index({ 'skills.name': 1 });

userSchema.methods.isBanned = function isBanned() {
  return Boolean(this.bannedUntil && this.bannedUntil.getTime() > Date.now());
};

userSchema.plugin(toClientJSON);

export default mongoose.model('User', userSchema);
