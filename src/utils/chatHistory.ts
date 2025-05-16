interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatSession {
  messages: ChatMessage[];
  lastUpdated: number;
}

class ChatHistoryManager {
  private sessions: Map<string, ChatSession>;
  private readonly maxHistoryLength: number;
  private readonly sessionTimeout: number;

  constructor(maxHistoryLength = 10, sessionTimeout = 3600000) { // 1 hour timeout
    this.sessions = new Map();
    this.maxHistoryLength = maxHistoryLength;
    this.sessionTimeout = sessionTimeout;
  }

  private getSessionKey(userId: string, channelId: string): string {
    return `${userId}-${channelId}`;
  }

  private cleanupOldSessions(): void {
    const now = Date.now();
    for (const [key, session] of this.sessions.entries()) {
      if (now - session.lastUpdated > this.sessionTimeout) {
        this.sessions.delete(key);
      }
    }
  }

  addMessage(userId: string, channelId: string, role: 'user' | 'assistant', content: string): void {
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

  getContext(userId: string, channelId: string): ChatMessage[] {
    const sessionKey = this.getSessionKey(userId, channelId);
    const session = this.sessions.get(sessionKey);
    
    if (!session) {
      return [];
    }

    // Clean up old messages
    const now = Date.now();
    const validMessages = session.messages.filter(
      msg => now - msg.timestamp <= this.sessionTimeout
    );

    if (validMessages.length !== session.messages.length) {
      session.messages = validMessages;
      this.sessions.set(sessionKey, session);
    }

    return validMessages;
  }

  clearHistory(userId: string, channelId: string): void {
    const sessionKey = this.getSessionKey(userId, channelId);
    this.sessions.delete(sessionKey);
  }
}

export const chatHistory = new ChatHistoryManager(); 