/**
 * Springer Nature Searcher
 *
 * Documentation: https://dev.springernature.com/
 * API Endpoints:
 * - Metadata API v2: https://api.springernature.com/meta/v2/json
 * - OpenAccess API: https://api.springernature.com/openaccess/json (if available with your key)
 *
 * Required API Key: Yes (api_key parameter)
 * Get API key from: https://dev.springernature.com/signup
 *
 * Note: Meta API v2 is the primary API. OpenAccess API may require special access.
 */
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
import { Paper } from '../models/Paper.js';
export declare class SpringerSearcher extends PaperSource {
    private metadataClient;
    private openAccessClient;
    private rateLimiter;
    private quotaManager;
    private hasOpenAccessAPI;
    private openAccessApiKey?;
    private testingPromise;
    constructor(apiKey?: string, openAccessApiKey?: string);
    search(query: string, options?: SearchOptions): Promise<Paper[]>;
    private parseResult;
    downloadPdf(doi: string, options?: {
        savePath?: string;
    }): Promise<string>;
    getCapabilities(): PlatformCapabilities;
    /**
     * 获取引用此论文的文献列表(通过Crossref/OpenCitations)
     */
    getCitations(doi: string): Promise<Paper[]>;
    /**
     * 获取论文的参考文献列表(通过Crossref)
     */
    getReferences(doi: string): Promise<Paper[]>;
    /**
     * 清理和转义查询参数中的特殊字符
     */
    private sanitizeQueryValue;
    /**
     * Test if OpenAccess API is available for this API key
     * Uses promise caching to prevent race conditions with concurrent requests
     */
    private testOpenAccessAPI;
    /**
     * Perform the actual OpenAccess API test
     */
    private performOpenAccessTest;
    readPaper(paperId: string, options?: DownloadOptions): Promise<string>;
}
//# sourceMappingURL=SpringerSearcher.d.ts.map