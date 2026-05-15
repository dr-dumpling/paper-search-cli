/**
 * 请求速率限制器
 * 用于控制API请求频率，遵守各平台的使用限制
 */
import { logDebug } from './Logger.js';
export class RateLimiter {
    requestsPerSecond;
    intervalMs;
    burstCapacity;
    debug;
    tokens;
    lastRefill;
    intervalHandle;
    pendingRequests = [];
    constructor(options) {
        this.requestsPerSecond = options.requestsPerSecond;
        this.intervalMs = 1000 / this.requestsPerSecond;
        this.burstCapacity = options.burstCapacity || this.requestsPerSecond;
        this.debug = options.debug || false;
        this.tokens = this.burstCapacity;
        this.lastRefill = Date.now();
        // 定期处理等待中的请求
        this.intervalHandle = setInterval(() => this.processPendingRequests(), Math.min(this.intervalMs, 100));
        // Don't keep the process alive just because of the limiter interval.
        this.intervalHandle.unref?.();
    }
    /**
     * 等待直到可以发送请求
     */
    async waitForPermission() {
        this.refillTokens();
        if (this.tokens > 0) {
            this.tokens--;
            if (this.debug) {
                logDebug(`RateLimiter: Request allowed, ${this.tokens} tokens remaining`);
            }
            return Promise.resolve();
        }
        // 没有可用令牌，加入等待队列
        return new Promise((resolve) => {
            this.pendingRequests.push({
                resolve,
                timestamp: Date.now()
            });
            if (this.debug) {
                logDebug(`RateLimiter: Request queued, ${this.pendingRequests.length} waiting`);
            }
        });
    }
    /**
     * 补充令牌（令牌桶算法）
     */
    refillTokens() {
        const now = Date.now();
        const timePassed = now - this.lastRefill;
        if (timePassed >= this.intervalMs) {
            const tokensToAdd = Math.floor(timePassed / this.intervalMs);
            this.tokens = Math.min(this.burstCapacity, this.tokens + tokensToAdd);
            this.lastRefill = now;
            if (this.debug && tokensToAdd > 0) {
                logDebug(`RateLimiter: Added ${tokensToAdd} tokens, total: ${this.tokens}`);
            }
        }
    }
    /**
     * 处理等待中的请求
     */
    processPendingRequests() {
        this.refillTokens();
        while (this.tokens > 0 && this.pendingRequests.length > 0) {
            const request = this.pendingRequests.shift();
            if (request) {
                this.tokens--;
                request.resolve();
                if (this.debug) {
                    const waitTime = Date.now() - request.timestamp;
                    logDebug(`RateLimiter: Released waiting request (waited ${waitTime}ms), ${this.tokens} tokens remaining`);
                }
            }
        }
    }
    /**
     * 获取当前状态
     */
    getStatus() {
        this.refillTokens();
        return {
            availableTokens: this.tokens,
            maxTokens: this.burstCapacity,
            requestsPerSecond: this.requestsPerSecond,
            pendingRequests: this.pendingRequests.length
        };
    }
    /**
     * 清理过期的等待请求（超过30秒）
     */
    cleanup() {
        const now = Date.now();
        const timeoutMs = 30000; // 30秒超时
        let removedCount = 0;
        while (this.pendingRequests.length > 0) {
            const first = this.pendingRequests[0];
            if (now - first.timestamp > timeoutMs) {
                this.pendingRequests.shift();
                // 拒绝过期的请求
                first.resolve(); // 或者可以reject，但这里选择允许继续
                removedCount++;
            }
            else {
                break;
            }
        }
        if (this.debug && removedCount > 0) {
            logDebug(`RateLimiter: Cleaned up ${removedCount} expired requests`);
        }
    }
    dispose() {
        clearInterval(this.intervalHandle);
    }
}
//# sourceMappingURL=RateLimiter.js.map