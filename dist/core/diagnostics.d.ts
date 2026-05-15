export interface ApiRequirement {
    id: string;
    platform: string;
    capability: string;
    tools: string[];
    keyGroups: string[][];
    optionalKeyGroups?: string[][];
    productAccess?: string;
    commonFailures: string[];
    actions: string[];
}
export interface RequirementStatus extends ApiRequirement {
    configured: boolean;
    configuredGroups: string[][];
    missingGroups: string[][];
}
export interface Diagnostic {
    severity: 'info' | 'warning' | 'error';
    category: 'missing_config' | 'invalid_key' | 'permission' | 'query_or_filter' | 'rate_limit' | 'timeout' | 'zero_results' | 'partial_failure' | 'unsupported';
    platform?: string;
    tool?: string;
    summary: string;
    likelyCauses: string[];
    actions: string[];
    relatedConfigKeys: string[];
}
interface DiagnosticContext {
    tool?: string;
    platform?: string;
    sources?: string;
}
interface ToolResultContext extends DiagnosticContext {
    args?: Record<string, unknown>;
    data?: unknown;
    message?: string;
}
export declare const API_REQUIREMENTS: ApiRequirement[];
export declare function getRequirementStatus(): RequirementStatus[];
export declare function diagnoseToolResult(context: ToolResultContext): Diagnostic | undefined;
export declare function diagnoseError(error: any, context?: DiagnosticContext): Diagnostic | undefined;
export declare function diagnosticContextFromCli(command: string, positionals: string[], flags: Record<string, unknown>): DiagnosticContext;
export {};
//# sourceMappingURL=diagnostics.d.ts.map