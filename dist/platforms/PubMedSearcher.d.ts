/**
 * PubMed E-utilities API集成模块
 * 支持无API密钥的免费使用（3 req/s）和有API密钥的增强使用（10 req/s）
 */
import { Paper } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
interface PubMedSearchOptions extends SearchOptions {
    /** 搜索字段 */
    field?: string;
    /** 出版状态 */
    pubStatus?: string;
    /** 文献类型 */
    publicationType?: string[];
}
export declare class PubMedSearcher extends PaperSource {
    private readonly baseApiUrl;
    private readonly rateLimiter;
    private readonly retMax;
    constructor(apiKey?: string);
    getCapabilities(): PlatformCapabilities;
    /**
     * 搜索PubMed文献
     */
    search(query: string, options?: PubMedSearchOptions): Promise<Paper[]>;
    /**
     * 搜索获取PMID列表
     */
    private searchPMIDs;
    /**
     * 获取论文详细信息
     */
    private fetchPaperDetails;
    /**
     * 构建搜索查询
     */
    private buildSearchQuery;
    /**
     * 映射排序字段
     */
    private mapSortField;
    /**
     * 解析XML响应
     */
    private parseXmlResponse;
    /**
     * 解析PubMed文章列表
     */
    private parsePubMedArticles;
    /**
     * 解析单个PubMed文章
     */
    private parsePubMedArticle;
    /**
     * 提取作者信息
     */
    private extractAuthors;
    /**
     * 提取摘要
     */
    private extractAbstract;
    /**
     * 提取发布日期
     */
    private extractPublishedDate;
    /**
     * 解析月份（支持英文和数字）
     */
    private parseMonth;
    /**
     * 提取文章ID（DOI、PMC等）
     */
    private extractArticleIds;
    /**
     * PubMed通常不支持直接PDF下载
     */
    downloadPdf(paperId: string, options?: DownloadOptions): Promise<string>;
    /**
     * PubMed不提供全文内容
     */
    readPaper(paperId: string, options?: DownloadOptions): Promise<string>;
    /**
     * 根据PMID获取论文信息
     */
    getPaperByPmid(pmid: string): Promise<Paper | null>;
    /**
     * 根据DOI获取论文信息
     */
    getPaperByDoi(doi: string): Promise<Paper | null>;
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
//# sourceMappingURL=PubMedSearcher.d.ts.map