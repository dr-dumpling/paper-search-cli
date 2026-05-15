import { Paper } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
export declare class CORESearcher extends PaperSource {
    private readonly client;
    constructor(apiKey?: string);
    getCapabilities(): PlatformCapabilities;
    search(query: string, options?: SearchOptions): Promise<Paper[]>;
    downloadPdf(paperId: string, options?: DownloadOptions): Promise<string>;
    readPaper(paperId: string, options?: DownloadOptions): Promise<string>;
    private getDetails;
    private requestWithRetry;
    private parseWork;
    private findPdfUrl;
    private nameList;
}
//# sourceMappingURL=CORESearcher.d.ts.map