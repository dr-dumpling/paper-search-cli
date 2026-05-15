import type { Searchers } from '../core/searchers.js';
export interface DownloadWithFallbackOptions {
    source: string;
    paperId: string;
    doi?: string;
    title?: string;
    savePath?: string;
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
export declare function downloadWithFallback(searchers: Searchers, options: DownloadWithFallbackOptions): Promise<DownloadWithFallbackResult>;
//# sourceMappingURL=OpenAccessFallbackService.d.ts.map