/**
 * Trust & Penalty Engine
 * Manages trust scores, failed task tracking, red marks, and bans
 */

const BAN_DURATIONS = [2, 4, 8, 16, 32]; // days

export function computeTrustScore(user) {
    const baseScore = 70;
    const successBonus = user.totalTasks > 0
        ? (user.completedTasks / user.totalTasks) * 25
        : 0;
    const penaltyDeduction = (user.penalties || 0) * 5;
    const redMarkDeduction = (user.redMarks || 0) * 10;
    const ratingBonus = user.rating > 0 ? ((user.rating - 3) / 2) * 10 : 0;

    const score = baseScore + successBonus - penaltyDeduction - redMarkDeduction + ratingBonus;
    return Math.max(0, Math.min(100, Math.round(score)));
}

export function handleTaskFailure(user) {
    const updatedUser = { ...user };
    updatedUser.failedTasks = (updatedUser.failedTasks || 0) + 1;
    updatedUser.penalties = (updatedUser.penalties || 0) + 1;

    // Red mark after 3 failed committed tasks (tracked by penalties)
    if (updatedUser.penalties % 3 === 0) {
        updatedUser.redMarks = (updatedUser.redMarks || 0) + 1;
        const banIndex = Math.min(updatedUser.redMarks - 1, BAN_DURATIONS.length - 1);
        const banDays = BAN_DURATIONS[banIndex];
        updatedUser.bannedUntil = Date.now() + banDays * 86400000;
    }

    updatedUser.trustScore = computeTrustScore(updatedUser);
    return updatedUser;
}

export function isUserBanned(user) {
    if (!user.bannedUntil) return false;
    return user.bannedUntil > Date.now();
}

export function getBanTimeRemaining(user) {
    if (!user.bannedUntil || user.bannedUntil <= Date.now()) return null;
    const ms = user.bannedUntil - Date.now();
    const hours = Math.floor(ms / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`;
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
}

export function getTrustLabel(score) {
    if (score >= 90) return { label: 'Excellent', color: '#10b981' };
    if (score >= 75) return { label: 'Good', color: '#ff8c61' };
    if (score >= 60) return { label: 'Fair', color: '#f59e0b' };
    if (score >= 40) return { label: 'Poor', color: '#f97316' };
    return { label: 'Critical', color: '#ef4444' };
}

export function getCancellationPolicy(task, cancelledBy) {
    const now = Date.now();
    const isCompleted = task.completedAt && task.approved;

    if (cancelledBy === 'client' && isCompleted) {
        return {
            workerGets: Math.round(task.budget * 0.45), // 50% minus 10% platform fee
            clientRefund: 0,
            message: 'Worker receives 50% payment as task was already completed.',
        };
    }

    if (cancelledBy === 'worker') {
        return {
            workerGets: 0,
            clientRefund: Math.round(task.budget * 0.9),
            message: 'Worker forfeits payment. Client refunded 90% (10% platform fee retained).',
        };
    }

    // Midway cancellation — admin decides
    return {
        workerGets: null,
        clientRefund: null,
        message: 'Midway cancellation — admin will review contribution and decide on payment split.',
        requiresAdminReview: true,
    };
}

export function computeNewRating(currentRating, currentTotal, newRating) {
    if (currentTotal === 0) return newRating;
    return Math.round(((currentRating * currentTotal + newRating) / (currentTotal + 1)) * 10) / 10;
}
