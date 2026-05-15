export interface QuotaConfig {
    dailyLimit: number;
    envPrefix?: string;
}
export interface QuotaStatus {
    platform: string;
    used: number;
    limit: number;
    remaining: number;
    resetAt: string;
}
export declare class QuotaExhaustedError extends Error {
    readonly platform: string;
    readonly limit: number;
    readonly resetAt: string;
    constructor(platform: string, limit: number, resetAt: string);
}
export declare class QuotaManager {
    private static instance;
    private quotas;
    private constructor();
    static getInstance(): QuotaManager;
    registerPlatform(platform: string, config: QuotaConfig): void;
    checkQuota(platform: string): void;
    incrementUsage(platform: string): void;
    getStatus(platform: string): QuotaStatus | null;
    private resetIfNeeded;
    private getDayKey;
    private getNextResetTime;
}
export default QuotaManager;
//# sourceMappingURL=QuotaManager.d.ts.map