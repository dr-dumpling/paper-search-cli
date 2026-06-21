import { type AxiosRequestConfig } from 'axios';
export interface HttpPolicy {
    rateLimit?: {
        rps: number;
        burst?: number;
    };
    cache?: {
        ttlMs: number;
        maxSize?: number;
    };
    timeoutMs?: number;
    retry?: {
        maxRetries: number;
    };
    userAgent?: string;
    validateStatus?: (status: number) => boolean;
}
export interface HttpRequestConfig extends AxiosRequestConfig {
    cacheKey?: string;
}
export declare class HttpClient {
    private readonly policy;
    constructor(policy?: HttpPolicy);
    request<T>(config: HttpRequestConfig): Promise<T>;
}
/**
 * Initializes global HTTP/HTTPS and SOCKS proxy agents for Axios
 * based on standard proxy environment variables.
 */
export declare function setupGlobalProxy(): void;
//# sourceMappingURL=HttpClient.d.ts.map