/**
 * Unified Error Handler for API requests
 * Provides consistent error handling across all platforms
 */
/**
 * API Error codes and their meanings
 */
export declare const HTTP_ERROR_CODES: {
    readonly 400: "Bad Request - Invalid parameters or syntax";
    readonly 401: "Unauthorized - Invalid or missing API key";
    readonly 403: "Forbidden - Access denied or rate limit exceeded";
    readonly 404: "Not Found - Resource does not exist";
    readonly 405: "Method Not Allowed - HTTP method not supported";
    readonly 408: "Request Timeout - Server took too long to respond";
    readonly 429: "Too Many Requests - Rate limit exceeded";
    readonly 500: "Internal Server Error - Server error";
    readonly 502: "Bad Gateway - Server communication error";
    readonly 503: "Service Unavailable - Server temporarily unavailable";
    readonly 504: "Gateway Timeout - Server timeout";
};
/**
 * Custom API Error class with detailed information
 */
export declare class ApiError extends Error {
    readonly status?: number;
    readonly platform: string;
    readonly operation: string;
    readonly timestamp: string;
    readonly retryable: boolean;
    readonly details?: any;
    constructor(options: {
        message: string;
        status?: number;
        platform: string;
        operation: string;
        details?: any;
    });
    private isRetryable;
    toJSON(): {
        name: string;
        message: string;
        status: number | undefined;
        platform: string;
        operation: string;
        timestamp: string;
        retryable: boolean;
    };
}
/**
 * Error Handler class for unified error processing
 */
export declare class ErrorHandler {
    private platform;
    private verbose;
    constructor(platform: string, verbose?: boolean);
    /**
     * Handle HTTP errors from axios or similar libraries
     */
    handleHttpError(error: any, operation: string): never;
    /**
     * Handle generic errors
     */
    handleError(error: any, operation: string): never;
    /**
     * Extract error message from various error formats
     */
    private extractErrorMessage;
    /**
     * Create user-friendly error message
     */
    private createUserMessage;
    /**
     * Sanitize URL for logging
     */
    private sanitizeUrl;
    /**
     * Log error with consistent format
     */
    private logError;
    /**
     * Check if an error is retryable
     */
    static isRetryable(error: any): boolean;
    /**
     * Get suggested retry delay based on error
     */
    static getRetryDelay(error: any, attempt?: number): number;
    /**
     * Retry a function with exponential backoff and full jitter
     */
    static retryWithBackoff<T>(fn: () => Promise<T>, options?: {
        maxRetries?: number;
        initialDelayMs?: number;
        maxDelayMs?: number;
        context?: string;
    }): Promise<T>;
}
export default ErrorHandler;
//# sourceMappingURL=ErrorHandler.d.ts.map