/**
 * 请求速率限制器
 * 用于控制API请求频率，遵守各平台的使用限制
 */
export interface RateLimiterOptions {
    /** 每秒最大请求数 */
    requestsPerSecond: number;
    /** 突发请求容量 */
    burstCapacity?: number;
    /** 是否启用调试日志 */
    debug?: boolean;
}
export declare class RateLimiter {
    private readonly requestsPerSecond;
    private readonly intervalMs;
    private readonly burstCapacity;
    private readonly debug;
    private tokens;
    private lastRefill;
    private intervalHandle;
    private readonly pendingRequests;
    constructor(options: RateLimiterOptions);
    /**
     * 等待直到可以发送请求
     */
    waitForPermission(): Promise<void>;
    /**
     * 补充令牌（令牌桶算法）
     */
    private refillTokens;
    /**
     * 处理等待中的请求
     */
    private processPendingRequests;
    /**
     * 获取当前状态
     */
    getStatus(): {
        availableTokens: number;
        maxTokens: number;
        requestsPerSecond: number;
        pendingRequests: number;
    };
    /**
     * 清理过期的等待请求（超过30秒）
     */
    cleanup(): void;
    dispose(): void;
}
//# sourceMappingURL=RateLimiter.d.ts.map