export interface CitationData {
    paperId: string;
    title: string;
    citationCount: number;
    referenceCount: number;
    influentialCitationCount?: number;
    year?: number;
    authors?: Array<{
        name: string;
        authorId?: string;
    }>;
    venue?: string;
    doi?: string;
    url?: string;
}
export interface BatchCitationRequest {
    paperId?: string;
    doi?: string;
    arxivId?: string;
    title?: string;
}
export declare class CitationService {
    private client;
    private cache;
    private rateLimiter;
    private apiKey?;
    constructor(apiKey?: string);
    /**
     * Get citation data for a single paper by ID
     */
    getCitationData(paperId: string, forceRefresh?: boolean): Promise<CitationData | null>;
    /**
     * Get citation data by DOI
     */
    getCitationDataByDoi(doi: string, forceRefresh?: boolean): Promise<CitationData | null>;
    /**
     * Get citation data by arXiv ID
     */
    getCitationDataByArxiv(arxivId: string, forceRefresh?: boolean): Promise<CitationData | null>;
    /**
     * Batch lookup citations for multiple papers
     */
    batchLookup(requests: BatchCitationRequest[]): Promise<Map<string, CitationData | null>>;
    /**
     * Get references for a paper
     */
    getReferences(paperId: string, limit?: number): Promise<CitationData[]>;
    /**
     * Get citations for a paper
     */
    getCitations(paperId: string, limit?: number): Promise<CitationData[]>;
    /**
     * Parse Semantic Scholar response to CitationData
     */
    private parseCitationData;
    /**
     * Get cache statistics
     */
    getCacheStats(): import("../utils/RequestCache.js").CacheStats;
    /**
     * Clear cache
     */
    clearCache(): void;
}
export default CitationService;
//# sourceMappingURL=CitationService.d.ts.map