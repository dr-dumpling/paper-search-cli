import { Paper } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
export declare class OpenAIRESearcher extends PaperSource {
    private readonly client;
    constructor(apiKey?: string);
    getCapabilities(): PlatformCapabilities;
    search(query: string, options?: SearchOptions): Promise<Paper[]>;
    downloadPdf(_paperId: string, _options?: DownloadOptions): Promise<string>;
    readPaper(_paperId: string, _options?: DownloadOptions): Promise<string>;
    private searchXml;
    private parseResult;
    private collectNodes;
    private flattenStrings;
    private first;
    private textsForKeys;
    private firstTextForKeys;
    private nodeText;
    private collectLikelyAbstract;
    private extractDoi;
    private hash;
}
//# sourceMappingURL=OpenAIRESearcher.d.ts.map