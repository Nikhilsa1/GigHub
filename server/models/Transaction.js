import mongoose from 'mongoose';
import toClientJSON from './plugins/toClientJSON.js';

const { Schema } = mongoose;

/**
 * Append-only financial ledger. Balances on User are a cache; this collection is the audit trail.
 * Types:
 *  - topup           : credits added to a wallet
 *  - escrow_hold     : client funds locked when a worker is selected
 *  - escrow_release  : worker paid (bid - platform fee) on approval
 *  - platform_fee    : GigHub commission on approval
 *  - escrow_refund   : funds returned to client on cancellation / rejection
 */
const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true }, // null => platform account
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', default: null, index: true },
    type: {
      type: String,
      enum: ['topup', 'escrow_hold', 'escrow_release', 'platform_fee', 'escrow_refund'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, default: '' },
  },
  { timestamps: true },
);

transactionSchema.plugin(toClientJSON);

export default mongoose.model('Transaction', transactionSchema);
