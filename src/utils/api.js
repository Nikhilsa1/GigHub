// API client for GigHub REST & Real-time Backend
const API_BASE = 'http://localhost:5000/api/v1';

function getToken() {
    return localStorage.getItem('gig_auth_token');
}

function setToken(token) {
    localStorage.setItem('gig_auth_token', token);
}

function removeToken() {
    localStorage.removeItem('gig_auth_token');
}

async function apiCall(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 204) {
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
        const errorMsg = data.error?.message || data.message || 'API request failed';
        const err = new Error(errorMsg);
        err.status = response.status;
        err.details = data.error?.details;
        throw err;
    }

    return data;
}

export const api = {
    // Auth
    register: (userData) => apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    }),
    
    login: (credentials) => apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    }),
    
    getMe: () => apiCall('/auth/me'),
    
    // Users
    getUsers: () => apiCall('/users'),
    getUser: (userId) => apiCall(`/users/${userId}`),
    updateMe: (updates) => apiCall('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(updates),
    }),
    getUserReviews: (userId) => apiCall(`/users/${userId}/reviews`),
    
    // Tasks
    getTasks: (params = {}) => {
        const query = new URLSearchParams();
        if (params.status) query.set('status', params.status);
        if (params.category) query.set('category', params.category);
        if (params.q) query.set('q', params.q);
        if (params.mine) query.set('mine', 'true');
        const qs = query.toString() ? `?${query.toString()}` : '';
        return apiCall(`/tasks${qs}`);
    },
    
    getRecommendedTasks: () => apiCall('/tasks/recommended'),
    
    createTask: (taskData) => apiCall('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
    }),
    
    getTask: (taskId) => apiCall(`/tasks/${taskId}`),
    
    getRankedApplicants: (taskId, mode = 'quality') => apiCall(`/tasks/${taskId}/applicants/ranked?mode=${mode}`),
    
    applyToTask: (taskId, { bid, commitment, message }) => apiCall(`/tasks/${taskId}/apply`, {
        method: 'POST',
        body: JSON.stringify({ bid, commitment, message }),
    }),
    
    selectCandidate: (taskId, applicantId) => apiCall(`/tasks/${taskId}/select`, {
        method: 'POST',
        body: JSON.stringify({ applicantId }),
    }),
    
    submitUpdate: (taskId, { message, images = [] }) => apiCall(`/tasks/${taskId}/updates`, {
        method: 'POST',
        body: JSON.stringify({ message, images }),
    }),
    
    approveTask: (taskId) => apiCall(`/tasks/${taskId}/approve`, {
        method: 'POST',
    }),
    
    rejectWork: (taskId, reason) => apiCall(`/tasks/${taskId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    }),
    
    cancelTask: (taskId, reason = '') => apiCall(`/tasks/${taskId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    }),
    
    rateUser: (taskId, { rating, feedback }) => apiCall(`/tasks/${taskId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating, feedback }),
    }),
    
    // Notifications
    getNotifications: () => apiCall('/notifications'),
    markAllNotificationsRead: () => apiCall('/notifications/read-all', { method: 'PATCH' }),
    markNotificationRead: (id) => apiCall(`/notifications/${id}/read`, { method: 'PATCH' }),
    clearAllNotifications: () => apiCall('/notifications', { method: 'DELETE' }),
    
    // Wallet
    getWallet: () => apiCall('/wallet'),
    topUpWallet: (amount) => apiCall('/wallet/topup', {
        method: 'POST',
        body: JSON.stringify({ amount }),
    }),
    
    // Admin
    getAdminOverview: () => apiCall('/admin/overview'),
    resolveDispute: (taskId, workerSharePct) => apiCall(`/admin/tasks/${taskId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ workerSharePct }),
    }),
    unbanUser: (userId) => apiCall(`/admin/users/${userId}/unban`, {
        method: 'POST',
    }),
    
    // Platform stats
    getPlatformStats: () => apiCall('/stats'),
    
    // Realtime SSE stream connection
    subscribeToEvents: (onMessage) => {
        const token = getToken();
        if (!token) return () => {};
        
        try {
            const eventSource = new EventSource(`${API_BASE}/events?token=${encodeURIComponent(token)}`);
            
            eventSource.addEventListener('notification', (e) => {
                try { onMessage({ type: 'notification', data: JSON.parse(e.data) }); } catch {}
            });
            
            eventSource.addEventListener('task:changed', (e) => {
                try { onMessage({ type: 'task:changed', data: JSON.parse(e.data) }); } catch {}
            });
            
            eventSource.addEventListener('me:changed', (e) => {
                try { onMessage({ type: 'me:changed', data: JSON.parse(e.data) }); } catch {}
            });
            
            return () => {
                eventSource.close();
            };
        } catch (err) {
            console.warn('SSE stream error:', err);
            return () => {};
        }
    },
};

export { getToken, setToken, removeToken };
