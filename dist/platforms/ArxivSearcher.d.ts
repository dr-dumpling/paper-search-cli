/**
 * arXiv API集成模块
 * 基于arXiv API v1.1实现论文搜索和下载功能
 */
import { Paper } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
export declare class ArxivSearcher extends PaperSource {
    private readonly rateLimiter;
    private readonly cache;
    constructor();
    getCapabilities(): PlatformCapabilities;
    /**
     * 搜索arXiv论文
     */
    search(query: string, options?: SearchOptions): Promise<Paper[]>;
    private searchViaExportApi;
    private fetchSearchPage;
    private normalizeMaxResults;
    private isTimeoutError;
    private shouldUseWebFallback;
    private isRateLimitError;
    private waitForGlobalExportApiSlot;
    private markGlobalExportApiCooldown;
    private withArxivRateLimitLock;
    private acquireArxivRateLimitLock;
    private removeStaleArxivRateLimitLock;
    private getArxivRateLimitPaths;
    private readArxivRateLimitState;
    private writeArxivRateLimitState;
    private createArxivCooldownError;
    private sleep;
    private searchViaWebFallback;
    private parseWebSearchResponse;
    /**
     * 下载PDF文件
     */
    downloadPdf(paperId: string, options?: DownloadOptions): Promise<string>;
    /**
     * 读取论文全文内容（从PDF中提取）
     */
    readPaper(paperId: string, options?: DownloadOptions): Promise<string>;
    /**
     * 构建搜索查询
     */
    private buildSearchQuery;
    private normalizeSearchQuery;
    private hasArxivQuerySyntax;
    private escapeArxivTerm;
    private webFallbackPageSize;
    private mapWebSortOrder;
    /**
     * 映射排序字段
     */
    private mapSortField;
    /**
     * 解析搜索响应
     */
    private parseSearchResponse;
    /**
     * 解析单个arXiv条目
     */
    private parseArxivEntry;
}
//# sourceMappingURL=ArxivSearcher.d.ts.map