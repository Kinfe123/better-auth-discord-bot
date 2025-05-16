"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatHistory = void 0;
class ChatHistoryManager {
    constructor(maxHistoryLength = 10, sessionTimeout = 3600000) {
        this.sessions = new Map();
        this.maxHistoryLength = maxHistoryLength;
        this.sessionTimeout = sessionTimeout;
    }
    getSessionKey(userId, channelId) {
        return `${userId}-${channelId}`;
    }
    cleanupOldSessions() {
        const now = Date.now();
        for (const [key, session] of this.sessions.entries()) {
            if (now - session.lastUpdated > this.sessionTimeout) {
                this.sessions.delete(key);
            }
        }
    }
    addMessage(userId, channelId, role, content) {
        this.cleanupOldSessions();
        const sessionKey = this.getSessionKey(userId, channelId);
        const session = this.sessions.get(sessionKey) || { messages: [], lastUpdated: Date.now() };
        session.messages.push({
            role,
            content,
            timestamp: Date.now()
        });
        // Keep only the last N messages
        if (session.messages.length > this.maxHistoryLength) {
            session.messages = session.messages.slice(-this.maxHistoryLength);
        }
        session.lastUpdated = Date.now();
        this.sessions.set(sessionKey, session);
    }
    getContext(userId, channelId) {
        const sessionKey = this.getSessionKey(userId, channelId);
        const session = this.sessions.get(sessionKey);
        if (!session) {
            return [];
        }
        // Clean up old messages
        const now = Date.now();
        const validMessages = session.messages.filter(msg => now - msg.timestamp <= this.sessionTimeout);
        if (validMessages.length !== session.messages.length) {
            session.messages = validMessages;
            this.sessions.set(sessionKey, session);
        }
        return validMessages;
    }
    clearHistory(userId, channelId) {
        const sessionKey = this.getSessionKey(userId, channelId);
        this.sessions.delete(sessionKey);
    }
}
exports.chatHistory = new ChatHistoryManager();
