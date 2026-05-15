import type { Searchers } from '../core/searchers.js';
import { Paper } from '../models/Paper.js';
import { SearchOptions } from '../platforms/PaperSource.js';
export interface MultiSourceSearchResult {
    query: string;
    sources_requested: string;
    sources_used: string[];
    source_results: Record<string, number>;
    errors: Record<string, string>;
    failed_sources: string[];
    warnings: string[];
    total: number;
    raw_total: number;
    papers: Record<string, unknown>[];
}
export declare function parseSourceList(sources: string | undefined, searchers: Searchers): string[];
export declare function searchMultipleSources(searchers: Searchers, query: string, sources: string, options: SearchOptions, sourceTimeoutMs?: number): Promise<MultiSourceSearchResult>;
export declare function dedupePapers(papers: Paper[]): Paper[];
//# sourceMappingURL=MultiSourceSearchService.d.ts.map