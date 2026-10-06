import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getToken } from '../utils/api';
import { scoreAndRankApplicants } from '../utils/recommender';
import { handleTaskFailure, computeNewRating } from '../utils/trustEngine';

const DataContext = createContext(null);

function getLocalTasks() { return JSON.parse(localStorage.getItem('gig_tasks') || '[]'); }
function saveLocalTasks(tasks) { localStorage.setItem('gig_tasks', JSON.stringify(tasks)); }
function getLocalUsers() { return JSON.parse(localStorage.getItem('gig_users') || '[]'); }
function saveLocalUsers(users) { localStorage.setItem('gig_users', JSON.stringify(users)); }
function getLocalReviews() { return JSON.parse(localStorage.getItem('gig_reviews') || '[]'); }
function saveLocalReviews(reviews) { localStorage.setItem('gig_reviews', JSON.stringify(reviews)); }

export function DataProvider({ children }) {
    const [tasksTick, setTasksTick] = useState(0);
    const [tasks, setTasks] = useState(getLocalTasks);
    const [users, setUsers] = useState(getLocalUsers);
    const [reviews, setReviews] = useState(getLocalReviews);
    const [wallet, setWallet] = useState({ walletBalance: 5000, escrowLocked: 0, totalEarned: 0, totalSpent: 0, transactions: [] });

    const refresh = useCallback(() => setTasksTick(t => t + 1), []);

    // Sync all data from live MongoDB backend on mount & on auth token change
    const fetchData = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        try {
            const [tasksRes, usersRes, walletRes] = await Promise.allSettled([
                api.getTasks(),
                api.getUsers(),
                api.getWallet(),
            ]);

            if (tasksRes.status === 'fulfilled' && tasksRes.value?.items) {
                const liveTasks = tasksRes.value.items;
                const currentLocal = getLocalTasks();

                // Merge strategy: index by ID and preserve local applicants & offline applications
                const mergedMap = new Map();
                liveTasks.forEach(t => {
                    const id = t.id || t._id;
                    mergedMap.set(id, t);
                });

                currentLocal.forEach(localT => {
                    const id = localT.id || localT._id;
                    if (mergedMap.has(id)) {
                        const serverTask = mergedMap.get(id);
                        const serverApps = [...(serverTask.applicants || [])];
                        const localApps = localT.applicants || [];

                        localApps.forEach(la => {
                            const laId = String(la.userId || la.id || la.userSnapshot?.id);
                            const existingIdx = serverApps.findIndex(sa => String(sa.userId || sa.id) === laId);
                            if (existingIdx >= 0) {
                                serverApps[existingIdx] = { ...la, ...serverApps[existingIdx] };
                            } else {
                                serverApps.push(la);
                            }
                        });

                        mergedMap.set(id, { ...localT, ...serverTask, applicants: serverApps });
                    } else {
                        mergedMap.set(id, localT);
                    }
                });

                const merged = Array.from(mergedMap.values());
                setTasks(merged);
                saveLocalTasks(merged);
            }

            if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
                const liveUsers = usersRes.value;
                setUsers(liveUsers);
                saveLocalUsers(liveUsers);
            }

            if (walletRes.status === 'fulfilled' && walletRes.value) {
                setWallet(walletRes.value);
            }

            refresh();
        } catch (err) {
            console.warn('Backend sync failed, using local cache:', err.message);
        }
    }, [refresh]);

    useEffect(() => {
        fetchData();
    }, [fetchData, tasksTick]);

    // Connect to real-time Server-Sent Events stream
    useEffect(() => {
        const token = getToken();
        if (!token) return;

        const unsubscribe = api.subscribeToEvents((event) => {
            if (event.type === 'task:changed' || event.type === 'me:changed' || event.type === 'notification') {
                fetchData();
            }
        });

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [fetchData]);

    function getTasks() {
        return tasks.length ? tasks : getLocalTasks();
    }

    function getUsers() {
        return users.length ? users : getLocalUsers();
    }

    function getReviews() {
        return reviews.length ? reviews : getLocalReviews();
    }

    async function createTask(taskData, creatorId) {
        try {
            const serverTask = await api.createTask(taskData);
            setTasks(prev => [serverTask, ...prev]);
            saveLocalTasks([serverTask, ...getTasks()]);
            refresh();
            return serverTask;
        } catch (err) {
            console.warn('API task creation failed, creating locally:', err.message);
            const current = getLocalTasks();
            const newTask = {
                id: 't' + Date.now(),
                ...taskData,
                creatorId,
                selectedApplicantId: null,
                applicants: [],
                updates: [],
                createdAt: Date.now(),
                completedAt: null,
                approved: false,
                cancelled: false,
                status: 'open',
            };
            current.unshift(newTask);
            saveLocalTasks(current);
            setTasks(current);
            refresh();
            return newTask;
        }
    }

    async function applyToTask(taskId, applicantData) {
        const uList = getUsers();
        const u = uList.find(user => String(user.id || user._id) === String(applicantData.userId));
        const application = {
            ...applicantData,
            userId: String(applicantData.userId),
            score: applicantData.score || 0,
            appliedAt: Date.now(),
            userSnapshot: u ? {
                id: u.id || u._id,
                name: u.name,
                avatar: u.avatar,
                avatarColor: u.avatarColor,
                university: u.university,
                rating: u.rating,
                completedTasks: u.completedTasks,
                trustScore: u.trustScore,
            } : null,
        };

        // 1. Optimistically update local tasks immediately so it is never lost on navigation
        const currentTasks = getLocalTasks();
        const idx = currentTasks.findIndex(t => (t.id === taskId || t._id === taskId));
        if (idx !== -1) {
            const task = currentTasks[idx];
            if (!task.applicants) task.applicants = [];
            const existingIdx = task.applicants.findIndex(a => String(a.userId) === String(applicantData.userId));
            if (existingIdx >= 0) {
                task.applicants[existingIdx] = { ...task.applicants[existingIdx], ...application };
            } else {
                task.applicants.push(application);
            }
            currentTasks[idx] = task;
            saveLocalTasks(currentTasks);
            setTasks([...currentTasks]);
            refresh();
        }

        // 2. Sync with MongoDB API backend
        try {
            const updatedTask = await api.applyToTask(taskId, {
                bid: applicantData.bid,
                commitment: applicantData.commitment,
                message: applicantData.message,
            });
            if (updatedTask) {
                const refreshed = getLocalTasks().map(t => (t.id === taskId || t._id === taskId) ? {
                    ...t,
                    ...updatedTask,
                    applicants: updatedTask.applicants?.map(a => String(a.userId) === String(applicantData.userId) ? { ...application, ...a } : a) || t.applicants
                } : t);
                saveLocalTasks(refreshed);
                setTasks(refreshed);
                refresh();
                return updatedTask;
            }
        } catch (err) {
            console.warn('API apply failed, application preserved in local state:', err.message);
        }
    }

    async function selectCandidate(taskId, applicantId) {
        try {
            const updatedTask = await api.selectCandidate(taskId, applicantId);
            setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
            saveLocalTasks(getTasks().map(t => t.id === taskId ? updatedTask : t));
            refresh();
            fetchData();
            return updatedTask;
        } catch (err) {
            console.warn('API select failed, selecting locally:', err.message);
            const currentTasks = getLocalTasks();
            const idx = currentTasks.findIndex(t => t.id === taskId);
            if (idx === -1) return;
            currentTasks[idx].selectedApplicantId = applicantId;
            currentTasks[idx].status = applicantId ? 'in_progress' : 'open';
            saveLocalTasks(currentTasks);
            setTasks(currentTasks);
            refresh();
        }
    }

    function updateApplicantBid(taskId, applicantId, newBid) {
        const currentTasks = getLocalTasks();
        const idx = currentTasks.findIndex(t => t.id === taskId);
        if (idx !== -1) {
            const appIdx = currentTasks[idx].applicants?.findIndex(a => a.userId === applicantId);
            if (appIdx !== -1 && appIdx !== undefined) {
                currentTasks[idx].applicants[appIdx].bid = Number(newBid);
                saveLocalTasks(currentTasks);
                setTasks([...currentTasks]);
                refresh();
            }
        }
    }

    async function submitUpdate(taskId, userId, message, images = []) {
        try {
            const updatedTask = await api.submitUpdate(taskId, { message, images });
            setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
            saveLocalTasks(getTasks().map(t => t.id === taskId ? updatedTask : t));
            refresh();
            return updatedTask;
        } catch (err) {
            console.warn('API update failed, updating locally:', err.message);
            const currentTasks = getLocalTasks();
            const idx = currentTasks.findIndex(t => t.id === taskId);
            if (idx === -1) return;
            currentTasks[idx].updates.push({ userId, message, images, createdAt: Date.now() });
            saveLocalTasks(currentTasks);
            setTasks(currentTasks);
            refresh();
        }
    }

    async function approveTask(taskId) {
        try {
            const res = await api.approveTask(taskId);
            const updatedTask = res.task || res;
            setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
            saveLocalTasks(getTasks().map(t => t.id === taskId ? updatedTask : t));
            refresh();
            fetchData();
            return res;
        } catch (err) {
            console.warn('API approve failed, approving locally:', err.message);
            const currentTasks = getLocalTasks();
            const idx = currentTasks.findIndex(t => t.id === taskId);
            if (idx === -1) return;
            currentTasks[idx].completedAt = Date.now();
            currentTasks[idx].approved = true;
            currentTasks[idx].status = 'completed';
            saveLocalTasks(currentTasks);
            setTasks(currentTasks);
            refresh();
        }
    }

    async function rejectWork(taskId, reason) {
        try {
            const updatedTask = await api.rejectWork(taskId, reason);
            setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
            saveLocalTasks(getTasks().map(t => t.id === taskId ? updatedTask : t));
            refresh();
            fetchData();
            return updatedTask;
        } catch (err) {
            console.warn('API reject failed, rejecting locally:', err.message);
            const currentTasks = getLocalTasks();
            const idx = currentTasks.findIndex(t => t.id === taskId);
            if (idx === -1) return;
            currentTasks[idx].selectedApplicantId = null;
            currentTasks[idx].status = 'open';
            currentTasks[idx].updates.push({ userId: 'creator', message: `❌ Work Rejected: ${reason}`, createdAt: Date.now() });
            saveLocalTasks(currentTasks);
            setTasks(currentTasks);
            refresh();
        }
    }

    async function cancelTask(taskId, cancelledBy, reason = '') {
        try {
            const updatedTask = await api.cancelTask(taskId, reason);
            setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
            saveLocalTasks(getTasks().map(t => t.id === taskId ? updatedTask : t));
            refresh();
            fetchData();
            return updatedTask;
        } catch (err) {
            console.warn('API cancel failed, cancelling locally:', err.message);
            const currentTasks = getLocalTasks();
            const idx = currentTasks.findIndex(t => t.id === taskId);
            if (idx === -1) return;
            currentTasks[idx].cancelled = true;
            currentTasks[idx].status = 'cancelled';
            currentTasks[idx].cancellationReason = reason;
            currentTasks[idx].cancelledBy = cancelledBy;
            saveLocalTasks(currentTasks);
            setTasks(currentTasks);
            refresh();
        }
    }

    async function submitRating(taskId, fromUserId, toUserId, rating, feedback) {
        try {
            const review = await api.rateUser(taskId, { rating, feedback });
            setReviews(prev => [review, ...prev]);
            refresh();
            fetchData();
            return review;
        } catch (err) {
            console.warn('API rate failed, rating locally:', err.message);
            const localReviews = getLocalReviews();
            const newRev = {
                id: 'r' + Date.now(),
                taskId, fromUserId, toUserId, rating, feedback,
                createdAt: Date.now(),
            };
            localReviews.push(newRev);
            saveLocalReviews(localReviews);
            setReviews(localReviews);
            refresh();
        }
    }

    function getRankedApplicants(taskId, mode = 'quality') {
        const all = getTasks();
        const task = all.find(t => t.id === taskId);
        if (!task) return [];
        const uList = getUsers();
        return scoreAndRankApplicants(task.applicants, uList, task, mode);
    }

    function getUserTasks(userId) {
        const all = getTasks();
        const uid = String(userId || '');
        if (!uid) return { created: [], applied: [], inProgress: [], completed: [] };

        return {
            created: all.filter(t => String(t.creatorId) === uid),
            applied: all.filter(t => t.applicants?.some(a => String(a.userId || a.userSnapshot?.id || a.id) === uid) && String(t.creatorId) !== uid),
            inProgress: all.filter(t => String(t.selectedApplicantId) === uid && !t.approved && !t.cancelled),
            completed: all.filter(t => String(t.selectedApplicantId) === uid && t.approved),
        };
    }

    function getUserReviews(userId) {
        return getReviews().filter(r => r.toUserId === userId);
    }

    async function topUpUserWallet(amount) {
        try {
            const res = await api.topUpWallet(amount);
            setWallet(prev => ({ ...prev, walletBalance: res.walletBalance }));
            return res;
        } catch (err) {
            console.warn('Topup failed:', err);
        }
    }

    return (
        <DataContext.Provider value={{
            tasksTick,
            getTasks,
            getUsers,
            getReviews,
            wallet,
            topUpUserWallet,
            createTask,
            applyToTask,
            updateApplicantBid,
            selectCandidate,
            submitUpdate,
            approveTask,
            rejectWork,
            submitRating,
            cancelTask,
            getRankedApplicants,
            getUserTasks,
            getUserReviews,
            refresh,
            fetchData,
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    return useContext(DataContext);
}
