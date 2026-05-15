/**
 * Semantic Scholar API集成模块
 * 支持免费API和付费API密钥
 */
import { Paper } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
interface SemanticSearchOptions extends SearchOptions {
    /** 发表年份范围 */
    year?: string;
    /** 研究领域过滤 */
    fieldsOfStudy?: string[];
}
interface SemanticSnippetSearchOptions {
    query: string;
    limit?: number;
    year?: string;
    fieldsOfStudy?: string[] | string;
    paperIds?: string[] | string;
    authors?: string[] | string;
    venue?: string[] | string;
    minCitationCount?: number;
    publicationDateOrYear?: string;
    fields?: string[] | string;
}
export interface SemanticSnippetResult {
    score: number | null;
    paper: {
        corpusId: string;
        title: string;
        authors: string[];
        openAccessInfo: Record<string, unknown>;
        url: string;
    };
    snippet: {
        text: string;
        snippetKind: string;
        section: string;
        snippetOffset: Record<string, unknown>;
        annotations: Record<string, unknown>;
    };
    text: string;
}
export declare class SemanticScholarSearcher extends PaperSource {
    private readonly rateLimiter;
    private readonly cache;
    private readonly baseApiUrl;
    constructor(apiKey?: string);
    getCapabilities(): PlatformCapabilities;
    /**
     * 搜索Semantic Scholar论文
     */
    search(query: string, options?: SemanticSearchOptions): Promise<Paper[]>;
    /**
     * 获取论文详细信息
     */
    getPaperDetails(paperId: string): Promise<Paper | null>;
    searchSnippets(options: SemanticSnippetSearchOptions): Promise<SemanticSnippetResult[]>;
    /**
     * 下载PDF文件
     */
    downloadPdf(paperId: string, options?: DownloadOptions): Promise<string>;
    /**
     * 读取论文全文内容
     */
    readPaper(paperId: string, options?: DownloadOptions): Promise<string>;
    /**
     * 根据DOI获取论文信息
     */
    getPaperByDoi(doi: string): Promise<Paper | null>;
    /**
     * 解析搜索响应
     */
    private parseSearchResponse;
    /**
     * 解析单个Semantic Scholar论文
     */
    private parseSemanticPaper;
    private normalizePdfUrl;
    private parseSnippet;
    private listParam;
    /**
     * 获取速率限制器状态
     */
    getRateLimiterStatus(): {
        availableTokens: number;
        maxTokens: number;
        requestsPerSecond: number;
        pendingRequests: number;
    };
    /**
     * 验证API密钥（如果提供）
     */
    validateApiKey(): Promise<boolean>;
}
export {};
//# sourceMappingURL=SemanticScholarSearcher.d.ts.map