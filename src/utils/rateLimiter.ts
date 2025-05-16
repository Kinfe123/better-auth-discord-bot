interface CacheEntry {
  response: string;
  timestamp: number;
}

class RateLimiter {
  private cache: Map<string, CacheEntry>;
  private lastCallTime: number;
  private readonly minInterval: number; 
  private readonly cacheDuration: number; 

  constructor(minInterval = 2000, cacheDuration = 3600000) {
    this.cache = new Map();
    this.lastCallTime = 0;
    this.minInterval = minInterval;
    this.cacheDuration = cacheDuration;
  }

  private getCacheKey(query: string, docs: any[]): string {
    return `${query}-${JSON.stringify(docs)}`;
  }

  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.cacheDuration;
  }

  async waitForNextCall(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastCall)
      );
    }
    
    this.lastCallTime = Date.now();
  }

  getCachedResponse(query: string, docs: any[]): string | null {
    const key = this.getCacheKey(query, docs);
    const entry = this.cache.get(key);
    
    if (entry && this.isCacheValid(entry)) {
      return entry.response;
    }
    
    return null;
  }

  setCachedResponse(query: string, docs: any[], response: string): void {
    const key = this.getCacheKey(query, docs);
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const rateLimiter = new RateLimiter(); 