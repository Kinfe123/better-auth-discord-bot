"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
class RateLimiter {
    constructor(minInterval = 2000, cacheDuration = 3600000) {
        this.cache = new Map();
        this.lastCallTime = 0;
        this.minInterval = minInterval;
        this.cacheDuration = cacheDuration;
    }
    getCacheKey(query, docs) {
        return `${query}-${JSON.stringify(docs)}`;
    }
    isCacheValid(entry) {
        return Date.now() - entry.timestamp < this.cacheDuration;
    }
    async waitForNextCall() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastCallTime;
        if (timeSinceLastCall < this.minInterval) {
            await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastCall));
        }
        this.lastCallTime = Date.now();
    }
    getCachedResponse(query, docs) {
        const key = this.getCacheKey(query, docs);
        const entry = this.cache.get(key);
        if (entry && this.isCacheValid(entry)) {
            return entry.response;
        }
        return null;
    }
    setCachedResponse(query, docs, response) {
        const key = this.getCacheKey(query, docs);
        this.cache.set(key, {
            response,
            timestamp: Date.now()
        });
    }
    clearCache() {
        this.cache.clear();
    }
}
exports.rateLimiter = new RateLimiter();
