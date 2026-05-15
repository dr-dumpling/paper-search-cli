/**
 * Crossref API Integration
 *
 * Crossref is a DOI registration agency providing free access to scholarly metadata.
 * No API key required, but providing email (mailto parameter) is recommended for polite pool access.
 *
 * Documentation: https://api.crossref.org/
 */
import { Paper } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
export declare class CrossrefSearcher extends PaperSource {
    private client;
    private mailto;
    private readonly rateLimiter;
    private readonly cache;
    constructor(mailto?: string);
    getCapabilities(): PlatformCapabilities;
    /**
     * Clean and validate DOI format
     * @param doi Raw DOI string (may include URL prefixes)
     * @returns Cleaned DOI or null if invalid
     */
    private cleanAndValidateDoi;
    search(query: string, options?: SearchOptions): Promise<Paper[]>;
    getPaperByDoi(doi: string): Promise<Paper | null>;
    getCitations(doi: string): Promise<Paper[]>;
    getReferences(doi: string): Promise<Paper[]>;
    downloadPdf(paperId: string, options?: DownloadOptions): Promise<string>;
    readPaper(paperId: string, options?: DownloadOptions): Promise<string>;
    private parseSearchResponse;
    private parsePaper;
    private extractReferenceDois;
}
//# sourceMappingURL=CrossrefSearcher.d.ts.map