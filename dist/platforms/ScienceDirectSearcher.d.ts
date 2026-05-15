/**
 * ScienceDirect (Elsevier) Searcher
 *
 * Documentation: https://dev.elsevier.com/
 * API Endpoints:
 * - Search API: https://api.elsevier.com/content/search/sciencedirect
 * - Article API: https://api.elsevier.com/content/article/doi/
 *
 * Required API Key: Yes (X-ELS-APIKey header)
 * Get API key from: https://dev.elsevier.com/apikey/manage
 */
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
import { Paper } from '../models/Paper.js';
export declare class ScienceDirectSearcher extends PaperSource {
    private client;
    private rateLimiter;
    private quotaManager;
    constructor(apiKey?: string);
    search(query: string, options?: SearchOptions): Promise<Paper[]>;
    /**
     * Parse result from new PUT API format
     */
    private parseNewApiResult;
    /**
     * Enrich papers with abstracts using Article Retrieval API
     */
    private enrichPapersWithAbstracts;
    private parseEntry;
    getArticleDetails(doi: string): Promise<Paper | null>;
    getCapabilities(): PlatformCapabilities;
    downloadPdf(paperId: string, options?: DownloadOptions): Promise<string>;
    readPaper(paperId: string, options?: DownloadOptions): Promise<string>;
    /**
     * 获取引用此论文的文献列表(通过Crossref/OpenCitations)
     */
    getCitations(paperId: string): Promise<Paper[]>;
    /**
     * 获取论文的参考文献列表(通过Crossref)
     */
    getReferences(paperId: string): Promise<Paper[]>;
}
//# sourceMappingURL=ScienceDirectSearcher.d.ts.map