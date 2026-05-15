/**
 * Security utilities for sanitizing and validating data
 * Provides comprehensive protection against security vulnerabilities
 */
/**
 * Comprehensive request sanitization to remove sensitive data
 * @param config - Axios request configuration
 * @returns Sanitized configuration copy
 */
export declare function sanitizeRequest(config: any): any;
/**
 * Sanitize headers to remove sensitive information
 */
export declare function sanitizeHeaders(headers: Record<string, any>): Record<string, any>;
/**
 * Sanitize URL parameters
 */
export declare function sanitizeParams(params: Record<string, any>): Record<string, any>;
/**
 * Sanitize request body
 */
export declare function sanitizeBody(body: any): any;
/**
 * Sanitize URL to remove sensitive query parameters
 */
export declare function sanitizeUrl(url: string): string;
/**
 * Validate and sanitize a DOI string
 */
export declare function sanitizeDoi(doi: string): {
    valid: boolean;
    sanitized: string;
    error?: string;
};
/**
 * Escape query value for different contexts
 */
export declare function escapeQueryValue(value: string, context?: 'springer' | 'wos' | 'general'): string;
/**
 * Validate query complexity to prevent DoS
 */
export declare function validateQueryComplexity(query: string, options?: {
    maxLength?: number;
    maxBooleanOperators?: number;
}): {
    valid: boolean;
    error?: string;
};
/**
 * Create a timeout wrapper for promises
 */
export declare function withTimeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T>;
/**
 * Generate a correlation ID for request tracking
 */
export declare function generateCorrelationId(): string;
/**
 * Mask sensitive data in strings
 */
export declare function maskSensitiveData(str: string): string;
/**
 * Check if a string looks like an API key or token
 */
export declare function looksLikeToken(str: string): boolean;
declare const _default: {
    sanitizeRequest: typeof sanitizeRequest;
    sanitizeHeaders: typeof sanitizeHeaders;
    sanitizeParams: typeof sanitizeParams;
    sanitizeBody: typeof sanitizeBody;
    sanitizeUrl: typeof sanitizeUrl;
    sanitizeDoi: typeof sanitizeDoi;
    escapeQueryValue: typeof escapeQueryValue;
    validateQueryComplexity: typeof validateQueryComplexity;
    withTimeout: typeof withTimeout;
    generateCorrelationId: typeof generateCorrelationId;
    maskSensitiveData: typeof maskSensitiveData;
    looksLikeToken: typeof looksLikeToken;
};
export default _default;
//# sourceMappingURL=SecurityUtils.d.ts.map