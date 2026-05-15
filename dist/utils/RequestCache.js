import { LRUCache } from 'lru-cache';
import { createHash } from 'crypto';
import { logDebug } from './Logger.js';
export class RequestCache {
    cache;
    hits = 0;
    misses = 0;
    constructor(options = {}) {
        const maxSize = options.maxSize || 100;
        const ttlMs = options.ttlMs || 3600000; // 1 hour default
        this.cache = new LRUCache({
            max: maxSize,
            ttl: ttlMs,
            updateAgeOnGet: true,
            updateAgeOnHas: false
        });
        logDebug(`RequestCache initialized: maxSize=${maxSize}, ttl=${ttlMs}ms`);
    }
    generateKey(platform, query, options) {
        const data = JSON.stringify({
            platform,
            query: query.toLowerCase().trim(),
            options: options || {}
        });
        return createHash('sha256').update(data).digest('hex');
    }
    get(key) {
        const value = this.cache.get(key);
        if (value !== undefined) {
            this.hits++;
            logDebug(`Cache hit: ${key.substring(0, 8)}...`);
            return value;
        }
        this.misses++;
        logDebug(`Cache miss: ${key.substring(0, 8)}...`);
        return undefined;
    }
    set(key, value) {
        this.cache.set(key, value);
        logDebug(`Cache set: ${key.substring(0, 8)}...`);
    }
    has(key) {
        return this.cache.has(key);
    }
    delete(key) {
        return this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
        logDebug('Cache cleared');
    }
    getStats() {
        const total = this.hits + this.misses;
        return {
            size: this.cache.size,
            maxSize: this.cache.max,
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? this.hits / total : 0
        };
    }
}
export default RequestCache;
//# sourceMappingURL=RequestCache.js.map