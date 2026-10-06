/**
 * Real-Time & Simulated Live Negotiation Chat Store for GigHub.
 * Handles persistent message threads, counter-offers, and dynamic AI demo auto-replies.
 */

const STORAGE_PREFIX = 'gighub_chat_';

export function getThreadKey(taskId, participantId) {
    return `${STORAGE_PREFIX}${taskId}_${participantId}`;
}

export function getMessages(taskId, participantId, taskContext = null, currentUser = null, otherUser = null) {
    const key = getThreadKey(taskId, participantId);
    const stored = localStorage.getItem(key);
    
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing stored chat:', e);
        }
    }

    // Default seeded conversation if none exists
    const initialMessages = [];
    
    if (taskContext && otherUser) {
        const applicant = taskContext.applicants?.find(a => a.userId === participantId || a.userId === otherUser.id);
        const isCreator = currentUser && taskContext.creatorId === currentUser.id;

        // Message 1: Initial applicant pitch if available
        if (applicant && applicant.message) {
            initialMessages.push({
                id: 'msg_seed_1',
                senderId: applicant.userId,
                senderName: otherUser.name || 'Applicant',
                text: applicant.message,
                type: 'text',
                timestamp: applicant.appliedAt || Date.now() - 1000 * 60 * 30,
                bid: applicant.bid,
            });
        } else {
            initialMessages.push({
                id: 'msg_seed_init',
                senderId: otherUser.id,
                senderName: otherUser.name,
                text: `Hi! I saw your gig "${taskContext.title}" and would love to work on it with you. Let me know if you'd like to negotiate terms or have any questions!`,
                type: 'text',
                timestamp: Date.now() - 1000 * 60 * 15,
            });
        }
    }

    localStorage.setItem(key, JSON.stringify(initialMessages));
    return initialMessages;
}

export function saveMessage(taskId, participantId, message) {
    const key = getThreadKey(taskId, participantId);
    const current = getMessages(taskId, participantId);
    const updated = [...current, message];
    localStorage.setItem(key, JSON.stringify(updated));
    
    // Dispatch local event for same-window reactive updates
    window.dispatchEvent(new CustomEvent('gighub:chat_update', { 
        detail: { taskId, participantId, message } 
    }));
    
    return updated;
}

export function updateMessage(taskId, participantId, messageId, updates) {
    const key = getThreadKey(taskId, participantId);
    const current = getMessages(taskId, participantId);
    const updated = current.map(m => m.id === messageId ? { ...m, ...updates } : m);
    localStorage.setItem(key, JSON.stringify(updated));
    
    window.dispatchEvent(new CustomEvent('gighub:chat_update', { 
        detail: { taskId, participantId } 
    }));
    
    return updated;
}

/**
 * Generate intelligent, contextual student responses for live expo presentations.
 */
export function generateSmartAutoReply(userMessage, taskContext, currentBid, otherUser, isCounterOffer = false) {
    const text = userMessage.toLowerCase();
    const otherName = otherUser?.name?.split(' ')[0] || 'Peer';

    if (isCounterOffer) {
        return {
            text: `Thanks for the counter-offer! ₹${userMessage.amount} sounds fair for this scope. I can get started immediately and deliver ahead of schedule! 🚀`,
            type: 'counter_response',
            accepted: true,
            amount: userMessage.amount
        };
    }

    // Keyword detection
    if (text.includes('price') || text.includes('budget') || text.includes('₹') || text.includes('discount') || text.includes('cheaper') || text.includes('cost')) {
        return {
            text: `I'm flexible on the budget! If we can keep the scope focused, I'd be happy to do it for ₹${Math.max(50, Math.round((currentBid || 500) * 0.9))}. Let me know if you want me to send a counter-offer!`,
            type: 'text'
        };
    }

    if (text.includes('deadline') || text.includes('time') || text.includes('urgent') || text.includes('today') || text.includes('tomorrow') || text.includes('when')) {
        return {
            text: `I have open bandwidth today! I can deliver the first draft in about 3-4 hours and iterate with your feedback right away.`,
            type: 'text'
        };
    }

    if (text.includes('portfolio') || text.includes('sample') || text.includes('github') || text.includes('experience') || text.includes('previous')) {
        return {
            text: `You can check out my verified badges and portfolio on my profile! I recently completed 2 similar tasks on campus with 5.0 ⭐ ratings.`,
            type: 'text'
        };
    }

    if (text.includes('deal') || text.includes('select') || text.includes('hire') || text.includes('ready') || text.includes('start')) {
        return {
            text: `Awesome! Once you confirm the selection, the escrow will lock safely and I'll jump straight into it. Looking forward to building this! 🎉`,
            type: 'text'
        };
    }

    // Default polite and proactive responses
    const defaultReplies = [
        `Sounds great! I understand the requirements clearly and I'm ready to kick off as soon as you confirm.`,
        `Got it! I can definitely handle that. Feel free to propose a counter-offer or select my bid whenever you're ready.`,
        `Understood! I'll make sure the deliverable is clean, thoroughly tested, and well-documented.`,
        `Perfect! Let me know if you need any clarification on the approach or deliverables.`
    ];

    const randomReply = defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
    return {
        text: randomReply,
        type: 'text'
    };
}
