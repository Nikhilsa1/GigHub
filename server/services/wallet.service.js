import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import config from '../config/env.js';
import { ApiError } from '../utils/http.js';

/**
 * Escrow wallet.
 *
 * Uses conditional atomic updates ($inc guarded by a balance filter) so two concurrent requests
 * can never overdraw a wallet — this works on a standalone MongoDB without multi-document transactions.
 */
export const round2 = (n) => Math.round(n * 100) / 100;

export function splitPayout(amount, feeRate = config.platformFeeRate) {
  const fee = round2(amount * feeRate);
  return { fee, net: round2(amount - fee) };
}

export async function topUp(userId, amount, note = 'Demo credits') {
  await User.updateOne({ _id: userId }, { $inc: { walletBalance: amount } });
  await Transaction.create({ userId, type: 'topup', amount, note });
}

/** Locks `amount` from the client's available balance into escrow for `taskId`. */
export async function holdEscrow(clientId, taskId, amount) {
  const res = await User.updateOne(
    { _id: clientId, walletBalance: { $gte: amount } },
    { $inc: { walletBalance: -amount, escrowLocked: amount } },
  );
  if (res.modifiedCount !== 1) {
    throw new ApiError(402, `Insufficient wallet balance. ₹${amount} is required to fund escrow for this task.`);
  }
  await Transaction.create({ userId: clientId, taskId, type: 'escrow_hold', amount, note: 'Funds locked in escrow' });
}

/** Returns escrowed funds to the client. */
export async function refundEscrow(clientId, taskId, amount, note = 'Escrow refunded') {
  if (!amount) return;
  await User.updateOne({ _id: clientId }, { $inc: { walletBalance: amount, escrowLocked: -amount } });
  await Transaction.create({ userId: clientId, taskId, type: 'escrow_refund', amount, note });
}

/**
 * Releases `payAmount` of the escrow to the worker (minus platform fee) and refunds the rest to the client.
 * Used for full approval (payAmount === escrow) and admin-mediated partial splits.
 */
export async function releaseEscrow({ clientId, workerId, taskId, escrowAmount, payAmount }) {
  const pay = round2(Math.min(payAmount, escrowAmount));
  const refund = round2(escrowAmount - pay);
  const { fee, net } = splitPayout(pay);

  await User.updateOne({ _id: clientId }, { $inc: { escrowLocked: -escrowAmount, walletBalance: refund, totalSpent: pay } });
  if (pay > 0) {
    await User.updateOne({ _id: workerId }, { $inc: { walletBalance: net, totalEarned: net } });
  }

  const entries = [];
  if (pay > 0) {
    entries.push({ userId: workerId, taskId, type: 'escrow_release', amount: net, note: `Payout (₹${pay} − ${config.platformFeeRate * 100}% fee)` });
    entries.push({ userId: null, taskId, type: 'platform_fee', amount: fee, note: 'GigHub commission' });
  }
  if (refund > 0) entries.push({ userId: clientId, taskId, type: 'escrow_refund', amount: refund, note: 'Unused escrow returned' });
  if (entries.length) await Transaction.insertMany(entries);

  return { paid: pay, net, fee, refunded: refund };
}
