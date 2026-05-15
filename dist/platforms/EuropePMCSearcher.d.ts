import { Paper } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
export declare class EuropePMCSearcher extends PaperSource {
    private readonly client;
    constructor();
    getCapabilities(): PlatformCapabilities;
    search(query: string, options?: SearchOptions): Promise<Paper[]>;
    downloadPdf(paperId: string, options?: DownloadOptions): Promise<string>;
    readPaper(paperId: string, options?: DownloadOptions): Promise<string>;
    private parseItem;
    private getDetails;
    private normalizeId;
    private parseAuthors;
    private parsePublicationDate;
    private findPdfUrl;
    private findPdfUrls;
    private isEuropePmcRenderUrl;
    private findLandingUrl;
}
//# sourceMappingURL=EuropePMCSearcher.d.ts.map