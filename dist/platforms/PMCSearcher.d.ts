import { Paper } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
export declare class PMCSearcher extends PaperSource {
    private readonly client;
    private readonly tool;
    private readonly email;
    constructor();
    getCapabilities(): PlatformCapabilities;
    search(query: string, options?: SearchOptions): Promise<Paper[]>;
    downloadPdf(paperId: string, options?: DownloadOptions): Promise<string>;
    readPaper(paperId: string, options?: DownloadOptions): Promise<string>;
    private parseSummary;
    private findArticleId;
    private normalizePmcId;
}
//# sourceMappingURL=PMCSearcher.d.ts.map