import type { Searchers } from '../core/searchers.js';
export interface DownloadWithFallbackOptions {
    source: string;
    paperId: string;
    doi?: string;
    title?: string;
    savePath?: string;
    /** When false, suppress the final Sci-Hub fallback. Default is true. */
    useSciHub?: boolean;
}
export interface DownloadWithFallbackResult {
    status: 'ok' | 'error';
    path?: string;
    attempts: Array<{
        stage: string;
        status: 'ok' | 'error' | 'skipped';
        message: string;
    }>;
}
export interface DownloadTier {
    id: string;
    stage: string;
    run(context: DownloadTierContext): Promise<DownloadTierResult>;
}
export interface DownloadTierContext {
    searchers: Searchers;
    source: string;
    paperId: string;
    doi?: string;
    title?: string;
    savePath: string;
    useSciHub: boolean;
}
export interface DownloadTierResult {
    status: 'ok' | 'error' | 'skipped';
    path?: string;
    message: string;
}
export declare const INSTITUTIONAL_ACCESS_TIER_ID = "institutional_access";
export declare function createDefaultDownloadTiers(): DownloadTier[];
export declare function insertDownloadTierBefore(tiers: DownloadTier[], beforeStage: string, tier: DownloadTier): DownloadTier[];
export declare function downloadWithFallback(searchers: Searchers, options: DownloadWithFallbackOptions, tiers?: DownloadTier[]): Promise<DownloadWithFallbackResult>;
//# sourceMappingURL=OpenAccessFallbackService.d.ts.map