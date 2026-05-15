export interface CacheOptions {
    maxSize?: number;
    ttlMs?: number;
}
export interface CacheStats {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: number;
}
export declare class RequestCache<T = any> {
    private cache;
    private hits;
    private misses;
    constructor(options?: CacheOptions);
    generateKey(platform: string, query: string, options?: Record<string, any>): string;
    get(key: string): T | undefined;
    set(key: string, value: T): void;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    getStats(): CacheStats;
}
export default RequestCache;
//# sourceMappingURL=RequestCache.d.ts.map