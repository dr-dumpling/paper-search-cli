/**
 * 学术论文搜索平台的抽象基类
 * 定义了所有平台搜索器必须实现的核心接口
 */
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { logDebug } from '../utils/Logger.js';
/**
 * 抽象基类：论文搜索平台
 */
export class PaperSource {
    baseUrl;
    apiKey;
    platformName;
    errorHandler;
    constructor(platformName, baseUrl, apiKey) {
        this.platformName = platformName;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.errorHandler = new ErrorHandler(platformName, process.env.NODE_ENV === 'development');
    }
    /**
     * 根据DOI获取论文信息
     * @param doi DOI标识符
     * @returns Promise<Paper | null> 论文信息或null
     */
    async getPaperByDoi(doi) {
        try {
            const results = await this.search(doi, { maxResults: 1 });
            return results.length > 0 ? results[0] : null;
        }
        catch (error) {
            logDebug(`Error getting paper by DOI from ${this.platformName}:`, error);
            return null;
        }
    }
    /**
     * 验证API密钥是否有效
     * @returns Promise<boolean> 是否有效
     */
    async validateApiKey() {
        if (!this.getCapabilities().requiresApiKey) {
            return true;
        }
        if (!this.apiKey) {
            return false;
        }
        try {
            // 尝试一个简单的搜索来验证密钥
            await this.search('test', { maxResults: 1 });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * 获取平台名称
     */
    getPlatformName() {
        return this.platformName;
    }
    /**
     * 获取基础URL
     */
    getBaseUrl() {
        return this.baseUrl;
    }
    /**
     * 是否配置了API密钥
     */
    hasApiKey() {
        return !!this.apiKey;
    }
    /**
     * 通用的HTTP请求错误处理 - 使用统一ErrorHandler
     */
    handleHttpError(error, operation) {
        // Delegate to ErrorHandler for unified error handling
        this.errorHandler.handleHttpError(error, operation);
    }
    /**
     * 检查错误是否可重试
     */
    isRetryableError(error) {
        return ErrorHandler.isRetryable(error);
    }
    /**
     * 获取建议的重试延迟
     */
    getRetryDelay(error, attempt = 1) {
        return ErrorHandler.getRetryDelay(error, attempt);
    }
    /**
     * 通用的日期解析
     */
    parseDate(dateString) {
        if (!dateString)
            return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    }
    /**
     * 清理和规范化文本
     */
    cleanText(text) {
        if (!text)
            return '';
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ' ')
            .trim();
    }
    /**
     * 从URL中提取文件名
     */
    extractFilename(url, paperId, extension = 'pdf') {
        const urlParts = url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        if (lastPart && lastPart.includes('.')) {
            return lastPart;
        }
        return `${paperId}.${extension}`;
    }
}
//# sourceMappingURL=PaperSource.js.map