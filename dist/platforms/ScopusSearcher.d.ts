/**
 * Scopus (Elsevier) Searcher
 *
 * Documentation: https://dev.elsevier.com/documentation/SCOPUSSearchAPI.wadl
 * API Endpoints:
 * - Search API: https://api.elsevier.com/content/search/scopus
 * - Abstract API: https://api.elsevier.com/content/abstract/scopus_id/
 *
 * Required API Key: Yes (X-ELS-APIKey header or apikey parameter)
 * Get API key from: https://dev.elsevier.com/apikey/manage
 *
 * Scopus is the largest abstract and citation database of peer-reviewed literature
 */
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
import { Paper } from '../models/Paper.js';
export declare class ScopusSearcher extends PaperSource {
    private client;
    private rateLimiter;
    private quotaManager;
    private searchApiKey?;
    private elsevierApiKey?;
    constructor(apiKey?: string, searchApiKey?: string);
    search(query: string, options?: SearchOptions): Promise<Paper[]>;
    private parseEntry;
    getAbstract(scopusId: string): Promise<Paper | null>;
    getCapabilities(): PlatformCapabilities;
    downloadPdf(paperId: string, options?: DownloadOptions): Promise<string>;
    readPaper(paperId: string, options?: DownloadOptions): Promise<string>;
    /**
     * 获取参考文献的Scopus ID列表
     */
    getReferenceIds(scopusId: string): Promise<string[]>;
    /**
     * 获取引用文献的Scopus ID列表
     */
    getCitationIds(scopusId: string): Promise<string[]>;
    /**
     * 获取论文详情（包含references和citations ID列表）
     */
    getPaperWithCitations(paperId: string): Promise<Paper | null>;
}
//# sourceMappingURL=ScopusSearcher.d.ts.map