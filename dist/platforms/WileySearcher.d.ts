/**
 * Wiley TDM (Text and Data Mining) API - PDF Download Only
 *
 * Documentation: https://onlinelibrary.wiley.com/library-info/resources/text-and-datamining
 * GitHub Client: https://github.com/WileyLabs/tdm-client
 *
 * IMPORTANT: Wiley TDM API does NOT support keyword search.
 * It only supports downloading PDFs by DOI.
 * For searching Wiley content, use Crossref API with publisher filter.
 *
 * API Endpoint: https://api.wiley.com/onlinelibrary/tdm/v1/articles/{DOI}
 * Header: Wiley-TDM-Client-Token: <token>
 *
 * Rate limits:
 * - Up to 3 articles per second
 * - Up to 60 requests per 10 minutes (build in 10 second delay between requests)
 */
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
import { Paper } from '../models/Paper.js';
export declare class WileySearcher extends PaperSource {
    private client;
    private rateLimiter;
    constructor(tdmToken?: string);
    /**
     * Search is NOT supported by Wiley TDM API.
     * Use Crossref API to search for Wiley articles, then use download() to get PDFs.
     */
    search(query: string, options?: SearchOptions): Promise<Paper[]>;
    /**
     * Download PDF by DOI using Wiley TDM API
     * @param doi - The DOI of the article (e.g., "10.1111/jtsb.12390")
     * @param options - Download options including savePath
     */
    downloadPdf(doi: string, options?: {
        savePath?: string;
    }): Promise<string>;
    /**
     * Get article metadata and download link (without downloading)
     */
    getArticleInfo(doi: string): Promise<Paper>;
    getCapabilities(): PlatformCapabilities;
    readPaper(paperId: string, options?: DownloadOptions): Promise<string>;
}
//# sourceMappingURL=WileySearcher.d.ts.map