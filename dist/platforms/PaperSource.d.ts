/**
 * 学术论文搜索平台的抽象基类
 * 定义了所有平台搜索器必须实现的核心接口
 */
import { Paper } from '../models/Paper.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
export interface SearchOptions {
    /** 最大结果数量 */
    maxResults?: number;
    /** 年份过滤 */
    year?: string;
    /** 作者过滤 */
    author?: string;
    /** 期刊过滤 */
    journal?: string;
    /** 学科分类过滤 */
    category?: string;
    /** 排序方式 */
    sortBy?: 'relevance' | 'date' | 'citations';
    /** 排序顺序 */
    sortOrder?: 'asc' | 'desc';
    /** 搜索天数范围 (bioRxiv/medRxiv) */
    days?: number;
    /** 是否获取详细信息 (IACR) */
    fetchDetails?: boolean;
    /** 研究领域过滤 (Semantic Scholar) */
    fieldsOfStudy?: string[];
    /** 开放获取过滤 (Springer/ScienceDirect/Scopus) */
    openAccess?: boolean;
    /** 主题过滤 (Springer/Scopus) */
    subject?: string;
    /** 出版物类型过滤 (Springer) */
    type?: 'Journal' | 'Book' | 'Chapter';
    /** 机构过滤 (Scopus) */
    affiliation?: string;
    /** 文档类型过滤 (Scopus) */
    documentType?: 'ar' | 'cp' | 're' | 'bk' | 'ch';
    /** 出版物类型 (PubMed) */
    publicationType?: string[];
}
export interface DownloadOptions {
    /** 保存路径 */
    savePath?: string;
    /** 是否覆盖现有文件 */
    overwrite?: boolean;
}
export interface PlatformCapabilities {
    /** 是否支持搜索 */
    search: boolean;
    /** 是否支持PDF下载 */
    download: boolean;
    /** 是否支持全文提取 */
    fullText: boolean;
    /** 是否支持被引统计 */
    citations: boolean;
    /** 是否需要API密钥 */
    requiresApiKey: boolean;
    /** 支持的搜索选项 */
    supportedOptions: (keyof SearchOptions)[];
}
/**
 * 抽象基类：论文搜索平台
 */
export declare abstract class PaperSource {
    protected readonly baseUrl: string;
    protected readonly apiKey?: string;
    protected readonly platformName: string;
    protected readonly errorHandler: ErrorHandler;
    constructor(platformName: string, baseUrl: string, apiKey?: string);
    /**
     * 获取平台能力描述
     */
    abstract getCapabilities(): PlatformCapabilities;
    /**
     * 搜索论文
     * @param query 搜索查询字符串
     * @param options 搜索选项
     * @returns Promise<Paper[]> 论文列表
     */
    abstract search(query: string, options?: SearchOptions): Promise<Paper[]>;
    /**
     * 下载PDF文件
     * @param paperId 论文ID
     * @param options 下载选项
     * @returns Promise<string> 下载文件的路径
     */
    abstract downloadPdf(paperId: string, options?: DownloadOptions): Promise<string>;
    /**
     * 读取论文全文内容
     * @param paperId 论文ID
     * @param options 下载选项（如果需要先下载）
     * @returns Promise<string> 论文全文内容
     */
    abstract readPaper(paperId: string, options?: DownloadOptions): Promise<string>;
    /**
     * 根据DOI获取论文信息
     * @param doi DOI标识符
     * @returns Promise<Paper | null> 论文信息或null
     */
    getPaperByDoi(doi: string): Promise<Paper | null>;
    /**
     * 验证API密钥是否有效
     * @returns Promise<boolean> 是否有效
     */
    validateApiKey(): Promise<boolean>;
    /**
     * 获取平台名称
     */
    getPlatformName(): string;
    /**
     * 获取基础URL
     */
    getBaseUrl(): string;
    /**
     * 是否配置了API密钥
     */
    hasApiKey(): boolean;
    /**
     * 通用的HTTP请求错误处理 - 使用统一ErrorHandler
     */
    protected handleHttpError(error: any, operation: string): never;
    /**
     * 检查错误是否可重试
     */
    protected isRetryableError(error: any): boolean;
    /**
     * 获取建议的重试延迟
     */
    protected getRetryDelay(error: any, attempt?: number): number;
    /**
     * 通用的日期解析
     */
    protected parseDate(dateString: string): Date | null;
    /**
     * 清理和规范化文本
     */
    protected cleanText(text: string): string;
    /**
     * 从URL中提取文件名
     */
    protected extractFilename(url: string, paperId: string, extension?: string): string;
}
//# sourceMappingURL=PaperSource.d.ts.map