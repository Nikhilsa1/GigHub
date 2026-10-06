/**
 * Frontend Integration Helper
 * Provides same API as JavaScript recommender but calls Python ML backend
 */
import {
    scoreApplicant as jsScoreApplicant,
    scoreAndRankApplicants as jsScoreAndRank,
    recommendTasksForUser as jsRecommend
} from './recommender.js';

import {
    computeTrustScore as jsComputeTrust,
    handleTaskFailure as jsHandleFailure
} from './trustEngine.js';

const BACKEND_URL = 'http://localhost:8000';

export async function scoreApplicant(user, task, bid, mode = 'quality') {
    try {
        const response = await fetch(`${BACKEND_URL}/api/recommender/score-applicant`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, task, bid, mode })
        });
        
        if (!response.ok) {
            throw new Error(`Backend error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.score;
    } catch (error) {
        console.warn('Error calling ML backend, using local fallback:', error.message);
        return jsScoreApplicant(user, task, bid, mode);
    }
}

export async function scoreAndRankApplicants(applicants, users, task, mode = 'quality') {
    try {
        const response = await fetch(`${BACKEND_URL}/api/recommender/rank-applicants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicants, users, task, mode })
        });
        
        if (!response.ok) {
            throw new Error(`Backend error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.applicants;
    } catch (error) {
        console.warn('Error calling ML backend, using local fallback:', error.message);
        return jsScoreAndRank(applicants, users, task, mode);
    }
}

export async function recommendTasksForUser(user, tasks) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/recommender/recommend-tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, tasks })
        });
        
        if (!response.ok) {
            throw new Error(`Backend error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.tasks;
    } catch (error) {
        console.warn('Error calling ML backend, using local fallback:', error.message);
        return jsRecommend(user, tasks);
    }
}

// Trust Engine Functions
export async function computeTrustScore(user) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/trust/compute-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user })
        });
        
        if (!response.ok) {
            throw new Error(`Backend error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.score;
    } catch (error) {
        console.warn('Error calling ML backend, using local fallback:', error.message);
        return jsComputeTrust(user);
    }
}

export async function handleTaskFailure(user) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/trust/handle-failure`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user })
        });
        
        if (!response.ok) {
            throw new Error(`Backend error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.user;
    } catch (error) {
        console.warn('Error calling ML backend, using local fallback:', error.message);
        return jsHandleFailure(user);
    }
}

export async function isUserBanned(user) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/trust/check-ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user })
        });
        
        if (!response.ok) {
            throw new Error(`Backend error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.isBanned;
    } catch (error) {
        return user.bannedUntil ? user.bannedUntil > Date.now() : false;
    }
}
