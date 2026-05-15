import { logDebug, logWarn } from './Logger.js';
export class QuotaExhaustedError extends Error {
    platform;
    limit;
    resetAt;
    constructor(platform, limit, resetAt) {
        super(`${platform} daily quota exhausted (${limit}/day). Resets at ${resetAt}`);
        this.platform = platform;
        this.limit = limit;
        this.resetAt = resetAt;
        this.name = 'QuotaExhaustedError';
    }
}
export class QuotaManager {
    static instance;
    quotas = new Map();
    constructor() { }
    static getInstance() {
        if (!QuotaManager.instance) {
            QuotaManager.instance = new QuotaManager();
        }
        return QuotaManager.instance;
    }
    registerPlatform(platform, config) {
        const envVar = config.envPrefix ? `${config.envPrefix}_DAILY_LIMIT` : undefined;
        const limitFromEnv = envVar ? Number(process.env[envVar]) : NaN;
        const limit = Number.isFinite(limitFromEnv) && limitFromEnv > 0 ? limitFromEnv : config.dailyLimit;
        this.quotas.set(platform, {
            limit,
            used: 0,
            dayKey: this.getDayKey()
        });
        logDebug(`QuotaManager: Registered ${platform} with daily limit ${limit}`);
    }
    checkQuota(platform) {
        const quota = this.quotas.get(platform);
        if (!quota) {
            logWarn(`QuotaManager: Platform ${platform} not registered`);
            return;
        }
        this.resetIfNeeded(platform, quota);
        if (quota.limit <= 0) {
            return;
        }
        if (quota.used >= quota.limit) {
            const resetAt = this.getNextResetTime();
            throw new QuotaExhaustedError(platform, quota.limit, resetAt);
        }
    }
    incrementUsage(platform) {
        const quota = this.quotas.get(platform);
        if (!quota) {
            logWarn(`QuotaManager: Platform ${platform} not registered`);
            return;
        }
        this.resetIfNeeded(platform, quota);
        if (quota.limit > 0) {
            quota.used++;
            logDebug(`QuotaManager: ${platform} usage: ${quota.used}/${quota.limit}`);
        }
    }
    getStatus(platform) {
        const quota = this.quotas.get(platform);
        if (!quota) {
            return null;
        }
        this.resetIfNeeded(platform, quota);
        return {
            platform,
            used: quota.used,
            limit: quota.limit,
            remaining: Math.max(0, quota.limit - quota.used),
            resetAt: this.getNextResetTime()
        };
    }
    resetIfNeeded(platform, quota) {
        const currentKey = this.getDayKey();
        if (currentKey !== quota.dayKey) {
            quota.dayKey = currentKey;
            quota.used = 0;
            logDebug(`QuotaManager: Reset ${platform} quota for new day ${currentKey}`);
        }
    }
    getDayKey(date = new Date()) {
        return date.toISOString().split('T')[0];
    }
    getNextResetTime() {
        const tomorrow = new Date();
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);
        return tomorrow.toISOString();
    }
}
export default QuotaManager;
//# sourceMappingURL=QuotaManager.js.map