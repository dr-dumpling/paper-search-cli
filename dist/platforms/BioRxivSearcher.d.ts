/**
 * bioRxiv API集成模块
 * 支持bioRxiv和medRxiv预印本论文搜索
 */
import { Paper } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
interface BioRxivSearchOptions extends SearchOptions {
    /** 搜索天数范围 */
    days?: number;
    /** 服务器类型 */
    server?: 'biorxiv' | 'medrxiv';
}
export declare class BioRxivSearcher extends PaperSource {
    private readonly serverType;
    private readonly rateLimiter;
    constructor(serverType?: 'biorxiv' | 'medrxiv');
    getCapabilities(): PlatformCapabilities;
    /**
     * 搜索bioRxiv/medRxiv论文
     */
    search(query: string, options?: BioRxivSearchOptions): Promise<Paper[]>;
    /**
     * 下载PDF文件
     */
    downloadPdf(paperId: string, options?: DownloadOptions): Promise<string>;
    /**
     * 读取论文全文内容
     */
    readPaper(paperId: string, options?: DownloadOptions): Promise<string>;
    /**
     * 解析搜索响应
     */
    private parseSearchResponse;
    /**
     * 解析单个bioRxiv论文
     */
    private parseBioRxivPaper;
}
/**
 * medRxiv搜索器 - 继承自BioRxivSearcher
 */
export declare class MedRxivSearcher extends BioRxivSearcher {
    constructor();
}
export {};
//# sourceMappingURL=BioRxivSearcher.d.ts.map