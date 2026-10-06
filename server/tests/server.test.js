/**
 * Automated test suite for GigHub Architecture & State Machine.
 * Run with: node --test server/tests/server.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTrustScore, applyTaskFailure, applyTaskSuccess, applyNewRating, isBanned } from '../services/trust.service.js';
import { computeSkillMatch, scoreApplicant } from '../services/recommender.service.js';
import { splitPayout } from '../services/wallet.service.js';

test('Trust Engine: Base score calculations', () => {
    const newUser = { totalTasks: 0, completedTasks: 0, penalties: 0, redMarks: 0, rating: 0 };
    assert.equal(computeTrustScore(newUser), 70, 'New user starting trust should be 70');

    const topUser = { totalTasks: 20, completedTasks: 20, penalties: 0, redMarks: 0, rating: 5.0 };
    assert.equal(computeTrustScore(topUser), 100, 'Perfect user trust score should cap at 100');
});

test('Trust Engine: Penalty & Red Mark progression', () => {
    let user = { totalTasks: 5, completedTasks: 5, failedTasks: 0, penalties: 0, redMarks: 0, bannedUntil: null };
    
    // First failure
    user = { ...user, ...applyTaskFailure(user) };
    assert.equal(user.penalties, 1);
    assert.equal(user.redMarks, 0);
    assert.equal(user.bannedUntil, null);

    // Second failure
    user = { ...user, ...applyTaskFailure(user) };
    assert.equal(user.penalties, 2);
    assert.equal(user.redMarks, 0);

    // Third failure -> triggers Red Mark & 2-day suspension
    const beforeBan = Date.now();
    user = { ...user, ...applyTaskFailure(user, beforeBan) };
    assert.equal(user.penalties, 3);
    assert.equal(user.redMarks, 1);
    assert.ok(user.bannedUntil instanceof Date);
    assert.ok(isBanned(user, beforeBan), 'User should be suspended');
});

test('Trust Engine: Incremental Rating Average', () => {
    let user = { rating: 0, ratingCount: 0, trustScore: 70 };
    user = { ...user, ...applyNewRating(user, 5) };
    assert.equal(user.rating, 5);
    assert.equal(user.ratingCount, 1);

    user = { ...user, ...applyNewRating(user, 3) };
    assert.equal(user.rating, 4);
    assert.equal(user.ratingCount, 2);
});

test('Recommender: Multi-factor skill matching & scoring', () => {
    const user = {
        skills: [{ name: 'Python', rating: 4.5 }, { name: 'Web Dev', rating: 4.0 }],
        rating: 4.8,
        totalTasks: 10,
        completedTasks: 10,
        trustScore: 95,
        redMarks: 0,
    };

    const task = { category: 'coding', subfield: 'Python', budget: 1000 };
    const applicant = { bid: 900, commitment: 'full' };

    const skillScore = computeSkillMatch(user, task);
    assert.ok(skillScore > 0.8, 'Skill match should be high for matching Python skills');

    const result = scoreApplicant(user, task, applicant, 'quality');
    assert.ok(result.score >= 80, 'Score should be high for qualified candidate');
    assert.ok(result.breakdown.skillMatch, 'Breakdown must include skillMatch factor');
    assert.ok(result.breakdown.rating, 'Breakdown must include rating factor');
});

test('Escrow Wallet: Commission fee split', () => {
    const { fee, net } = splitPayout(1000, 0.10);
    assert.equal(fee, 100, 'Platform fee should be 10% (₹100)');
    assert.equal(net, 900, 'Net worker payout should be 90% (₹900)');
});
