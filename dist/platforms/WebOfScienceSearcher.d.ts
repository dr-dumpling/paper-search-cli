/**
 * Web of Science API集成模块
 * 支持 Web of Science Starter API 和 Web of Science Researcher API
 */
import { Paper } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
interface WoSSearchOptions extends SearchOptions {
    /** 数据库选择 */
    databases?: string[];
    /** 文档类型过滤 (Article, Review, etc.) */
    documentTypes?: string[];
    /** 语言过滤 */
    languages?: string[];
    /** ISSN/ISBN过滤 */
    issn?: string;
    /** 卷号过滤 */
    volume?: string;
    /** 页码过滤 */
    page?: string;
    /** 期号过滤 */
    issue?: string;
    /** PubMed ID过滤 */
    pmid?: string;
    /** DOI过滤 */
    doi?: string;
}
export declare class WebOfScienceSearcher extends PaperSource {
    private apiUrl;
    private apiVersion;
    private fallbackAttempted;
    private readonly preferredVersion;
    private readonly rateLimiter;
    private readonly quotaManager;
    constructor(apiKey?: string, apiVersion?: string);
    /**
     * Switch to fallback API version (v2 -> v1 or v1 -> v2)
     */
    private switchToFallbackVersion;
    /**
     * Reset fallback state (call after successful request)
     * This allows the next request to try the preferred version first
     */
    private resetFallbackState;
    getCapabilities(): PlatformCapabilities;
    /**
     * 获取论文的参考文献ID列表
     */
    getReferenceIds(uid: string): Promise<string[]>;
    /**
     * 获取引用此论文的文献ID列表
     */
    getCitationIds(uid: string): Promise<string[]>;
    /**
     * 获取论文详情（包含references和citations ID列表）
     */
    getPaperWithCitations(uid: string): Promise<Paper | null>;
    /**
     * 搜索Web of Science论文
     */
    search(query: string, options?: WoSSearchOptions): Promise<Paper[]>;
    /**
     * Web of Science 通常不支持直接PDF下载
     */
    downloadPdf(paperId: string, options?: DownloadOptions): Promise<string>;
    /**
     * Web of Science 通常不提供全文内容
     */
    readPaper(paperId: string, options?: DownloadOptions): Promise<string>;
    /**
     * 根据DOI获取论文详细信息
     */
    getPaperByDoi(doi: string): Promise<Paper | null>;
    /**
     * 获取论文被引统计
     */
    getCitationCount(paperId: string): Promise<number>;
    /**
     * 构建搜索查询参数
     */
    private buildSearchQuery;
    /**
     * 构建WOS格式的查询字符串
     */
    private buildWosQuery;
    /**
     * 转义WOS查询中的特殊字符
     */
    private escapeWosQuery;
    /**
     * 映射排序字段到WOS API格式
     */
    private mapSortField;
    /**
     * 解析搜索响应
     */
    private parseSearchResponse;
    /**
     * 解析单个WoS记录
     */
    private parseWoSRecord;
    /**
     * 发起API请求 - 支持自动版本降级
     */
    private makeApiRequest;
    /**
     * 验证API密钥
     */
    validateApiKey(): Promise<boolean>;
}
export {};
//# sourceMappingURL=WebOfScienceSearcher.d.ts.map