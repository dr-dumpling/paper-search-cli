/**
 * IACR ePrint Archive集成模块
 * 密码学和相关领域的学术论文搜索
 */
import { Paper } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
interface IACRSearchOptions extends SearchOptions {
    /** 是否获取详细信息 */
    fetchDetails?: boolean;
}
export declare class IACRSearcher extends PaperSource {
    private readonly searchUrl;
    private readonly userAgents;
    private readonly rateLimiter;
    constructor();
    getCapabilities(): PlatformCapabilities;
    /**
     * 搜索IACR ePrint Archive论文
     */
    search(query: string, options?: IACRSearchOptions): Promise<Paper[]>;
    /**
     * 获取论文详细信息
     */
    getPaperDetails(paperId: string): Promise<Paper | null>;
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
     * 解析IACR论文详细页面
     */
    private parseIACRPaperDetails;
    /**
     * 获取随机User-Agent
     */
    private getRandomUserAgent;
    /**
     * 延迟函数
     */
    private delay;
}
export {};
//# sourceMappingURL=IACRSearcher.d.ts.map