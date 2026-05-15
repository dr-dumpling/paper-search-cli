import { Paper } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
export declare class UnpaywallSearcher extends PaperSource {
    private readonly client;
    private readonly email;
    constructor(email?: string);
    getCapabilities(): PlatformCapabilities;
    hasApiKey(): boolean;
    search(query: string, _options?: SearchOptions): Promise<Paper[]>;
    getPaperByDoi(doi: string): Promise<Paper | null>;
    resolveBestPdfUrl(doi: string): Promise<string>;
    downloadPdf(_paperId: string, _options?: DownloadOptions): Promise<string>;
    readPaper(_paperId: string, _options?: DownloadOptions): Promise<string>;
    private parseRecord;
    private firstLocationUrl;
    private extractDoi;
}
//# sourceMappingURL=UnpaywallSearcher.d.ts.map