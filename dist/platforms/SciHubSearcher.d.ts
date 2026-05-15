/**
 * Sci-Hub 论文搜索和下载器
 * 支持多镜像站点轮询、自动健康检测和故障转移
 */
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
import { Paper } from '../models/Paper.js';
export declare class SciHubSearcher extends PaperSource {
    private mirrorSites;
    private currentMirrorIndex;
    private axiosInstance;
    private readonly maxRetries;
    private readonly mirrorTestTimeout;
    private lastHealthCheck;
    private readonly healthCheckInterval;
    constructor();
    getCapabilities(): PlatformCapabilities;
    /**
     * 检测所有镜像站点的健康状态
     */
    private checkMirrorHealth;
    /**
     * 获取当前可用的镜像站点
     */
    private getCurrentMirror;
    /**
     * 标记镜像站点失败并切换到下一个
     */
    private markMirrorFailed;
    /**
     * 通过 DOI 或 URL 搜索论文
     */
    search(query: string, options?: SearchOptions): Promise<Paper[]>;
    /**
     * 验证输入是否为有效的 DOI 或 URL
     */
    private isValidDOIOrURL;
    /**
     * 从 Sci-Hub 获取论文信息
     */
    private fetchPaperInfo;
    /**
     * 下载 PDF 文件
     */
    downloadPdf(paperId: string, options?: DownloadOptions): Promise<string>;
    /**
     * 读取论文内容（Sci-Hub 不提供文本提取）
     */
    readPaper(paperId: string, options?: DownloadOptions): Promise<string>;
    /**
     * 根据 DOI 获取论文
     */
    getPaperByDoi(doi: string): Promise<Paper | null>;
    /**
     * 获取镜像站点状态
     */
    getMirrorStatus(): {
        url: string;
        status: string;
        responseTime?: number;
    }[];
    /**
     * 手动触发健康检查
     */
    forceHealthCheck(): Promise<void>;
}
//# sourceMappingURL=SciHubSearcher.d.ts.map