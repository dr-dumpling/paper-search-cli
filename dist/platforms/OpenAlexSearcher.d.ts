import { Paper } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
export declare class OpenAlexSearcher extends PaperSource {
    private readonly client;
    constructor();
    getCapabilities(): PlatformCapabilities;
    search(query: string, options?: SearchOptions): Promise<Paper[]>;
    downloadPdf(_paperId: string, _options?: DownloadOptions): Promise<string>;
    readPaper(_paperId: string, _options?: DownloadOptions): Promise<string>;
    getPaperByDoi(doi: string): Promise<Paper | null>;
    private parseWork;
    private reconstructAbstract;
}
//# sourceMappingURL=OpenAlexSearcher.d.ts.map