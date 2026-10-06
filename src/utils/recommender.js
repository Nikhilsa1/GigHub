/**
 * Recommendation Engine
 * Scores applicants for a task based on skill match, rating, success rate,
 * cost efficiency, and new-user fairness bonus.
 */

export function scoreApplicant(user, task, bid, mode = 'quality') {
    const skillMatch = computeSkillMatch(user, task);
    const ratingScore = user.rating / 5;
    const successRate = user.totalTasks > 0 ? user.completedTasks / user.totalTasks : 0;
    const budgetRatio = task.budget > 0 ? bid / task.budget : 1;
    const costScore = 1 - Math.min(budgetRatio, 1); // lower bid = better cost score
    const newUserBonus = user.totalTasks < 3 ? 1.0 : 0.0;
    const trustScore = user.trustScore / 100;
    const penaltyFactor = user.redMarks > 0 ? Math.max(0, 1 - user.redMarks * 0.2) : 1;

    let weights;
    if (mode === 'quality') {
        weights = {
            skillMatch: 0.30,
            rating: 0.25,
            successRate: 0.20,
            cost: 0.05,
            newUser: 0.10,
            trust: 0.10,
        };
    } else {
        // cost priority
        weights = {
            skillMatch: 0.20,
            rating: 0.15,
            successRate: 0.15,
            cost: 0.30,
            newUser: 0.10,
            trust: 0.10,
        };
    }

    const rawScore =
        skillMatch * weights.skillMatch +
        ratingScore * weights.rating +
        successRate * weights.successRate +
        costScore * weights.cost +
        newUserBonus * weights.newUser +
        trustScore * weights.trust;

    return Math.round(rawScore * penaltyFactor * 100);
}

function computeSkillMatch(user, task) {
    if (!user.skills || user.skills.length === 0) return 0;
    const taskSkills = [task.subfield, task.category].map(s => s?.toLowerCase());
    const userSkills = user.skills.map(s => s.name?.toLowerCase());
    let matches = 0;
    for (const ts of taskSkills) {
        if (userSkills.some(us => us.includes(ts) || ts.includes(us))) {
            matches++;
        }
    }
    return Math.min(matches / taskSkills.length, 1);
}

/**
 * Recommend tasks to a user based on skill match, task status, and urgency
 */
export function recommendTasksForUser(user, tasks) {
    const openTasks = tasks.filter(t => t.status === 'open' && t.creatorId !== user.id);

    return openTasks
        .map(task => {
            const skillMatch = computeSkillMatch(user, task);
            const urgencyBonus = task.urgent ? 0.15 : 0;
            const deadlineFactor = computeDeadlineFactor(task.deadline);
            const score = skillMatch * 0.6 + urgencyBonus + deadlineFactor * 0.1;
            return { ...task, recommendScore: Math.round(score * 100) };
        })
        .sort((a, b) => b.recommendScore - a.recommendScore);
}

function computeDeadlineFactor(deadline) {
    const remaining = deadline - Date.now();
    const days = remaining / 86400000;
    if (days < 1) return 1.0;
    if (days < 3) return 0.8;
    if (days < 7) return 0.5;
    return 0.2;
}

export function scoreAndRankApplicants(applicants, users, task, mode = 'quality') {
    return applicants
        .map(applicant => {
            const user = users.find(u => u.id === applicant.userId);
            if (!user) {
                // User data not found - give basic score based on bid
                const budgetRatio = task.budget > 0 ? applicant.bid / task.budget : 1;
                const costScore = 1 - Math.min(budgetRatio, 1);
                const score = Math.round(costScore * 50); // Base 50% score
                return { ...applicant, score };
            }
            const score = scoreApplicant(user, task, applicant.bid, mode);
            return { ...applicant, score };
        })
        .sort((a, b) => b.score - a.score);
}
