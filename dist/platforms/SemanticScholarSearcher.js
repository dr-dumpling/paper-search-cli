/**
 * Semantic Scholar API集成模块
 * 支持免费API和付费API密钥
 */
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { PaperFactory } from '../models/Paper.js';
import { PaperSource } from './PaperSource.js';
import { RateLimiter } from '../utils/RateLimiter.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { RequestCache } from '../utils/RequestCache.js';
import { sanitizeDoi } from '../utils/SecurityUtils.js';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';
import { logDebug } from '../utils/Logger.js';
export class SemanticScholarSearcher extends PaperSource {
    rateLimiter;
    cache;
    baseApiUrl;
    constructor(apiKey) {
        super('semantic', 'https://api.semanticscholar.org/graph/v1', apiKey);
        this.baseApiUrl = this.baseUrl;
        // Semantic Scholar免费API限制：100 requests per 5 minutes
        // 付费API: 1000 requests per 5 minutes
        // 更保守的速率限制以避免被封
        const requestsPerMinute = apiKey ? 180 : 18; // 有API密钥时更宽松
        this.rateLimiter = new RateLimiter({
            requestsPerSecond: requestsPerMinute / 60,
            burstCapacity: Math.max(3, Math.floor(requestsPerMinute / 20)), // 降低突发容量
            debug: process.env.NODE_ENV === 'development'
        });
        this.cache = new RequestCache({
            maxSize: 100,
            ttlMs: 3600000 // 1 hour
        });
    }
    getCapabilities() {
        return {
            search: true,
            download: true, // 部分论文有开放获取PDF
            fullText: false, // 只有部分PDF
            citations: true, // 提供引用统计
            requiresApiKey: false, // 免费API可用，但有限制
            supportedOptions: ['maxResults', 'year', 'fieldsOfStudy', 'sortBy']
        };
    }
    /**
     * 搜索Semantic Scholar论文
     */
    async search(query, options = {}) {
        const customOptions = options;
        const forceRefresh = customOptions.forceRefresh === true;
        // Check cache first
        if (!forceRefresh) {
            const cacheKey = this.cache.generateKey('semantic', query, options);
            const cached = this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }
        await this.rateLimiter.waitForPermission();
        try {
            const params = {
                query: query,
                limit: Math.min(options.maxResults || 10, 100), // API限制最大100
                fields: [
                    'paperId', 'title', 'abstract', 'venue', 'year',
                    'referenceCount', 'citationCount', 'influentialCitationCount',
                    'isOpenAccess', 'openAccessPdf', 'fieldsOfStudy', 's2FieldsOfStudy',
                    'publicationTypes', 'publicationDate', 'journal', 'authors',
                    'externalIds', 'url'
                ].join(',')
            };
            // 添加年份过滤
            if (options.year) {
                params.year = options.year;
            }
            // 添加研究领域过滤
            if (options.fieldsOfStudy && options.fieldsOfStudy.length > 0) {
                params.fieldsOfStudy = options.fieldsOfStudy.join(',');
            }
            const url = `${this.baseApiUrl}/paper/search`;
            const headers = {
                'User-Agent': USER_AGENT,
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9'
            };
            // 添加API密钥（如果有）- 根据官方文档推荐的方式
            if (this.apiKey) {
                headers['x-api-key'] = this.apiKey;
            }
            logDebug(`Semantic Scholar API Request: GET ${url}`);
            logDebug('Semantic Scholar Request params:', params);
            const response = await ErrorHandler.retryWithBackoff(() => axios.get(url, {
                params,
                headers,
                timeout: TIMEOUTS.DEFAULT,
                maxRedirects: 5,
                validateStatus: (status) => status < 500
            }), { context: 'Semantic Scholar search' });
            logDebug(`Semantic Scholar API Response: ${response.status} ${response.statusText}`);
            // 处理可能的错误响应
            if (response.status >= 400) {
                // Convert non-throwing 4xx response to unified error handling
                this.handleHttpError({ response, config: response.config }, 'search');
            }
            const papers = this.parseSearchResponse(response.data);
            logDebug(`Semantic Scholar Parsed ${papers.length} papers`);
            // Cache results
            const cacheKey = this.cache.generateKey('semantic', query, options);
            this.cache.set(cacheKey, papers);
            return papers;
        }
        catch (error) {
            logDebug('Semantic Scholar Search Error:', error.message);
            // 处理速率限制错误
            if (error.response?.status === 429) {
                const retryAfter = error.response.headers['retry-after'];
                logDebug(`Rate limited by Semantic Scholar API. ${retryAfter ? `Retry after ${retryAfter} seconds.` : 'Please wait before making more requests.'}`);
            }
            // 处理API限制错误
            if (error.response?.status === 403) {
                logDebug('Access denied. Please check your API key or ensure you are within the free tier limits.');
            }
            this.handleHttpError(error, 'search');
        }
    }
    /**
     * 获取论文详细信息
     */
    async getPaperDetails(paperId) {
        await this.rateLimiter.waitForPermission();
        try {
            const params = {
                fields: [
                    'paperId', 'title', 'abstract', 'venue', 'year',
                    'referenceCount', 'citationCount', 'influentialCitationCount',
                    'isOpenAccess', 'openAccessPdf', 'fieldsOfStudy', 's2FieldsOfStudy',
                    'publicationTypes', 'publicationDate', 'journal', 'authors',
                    'externalIds', 'url'
                ].join(',')
            };
            const url = `${this.baseApiUrl}/paper/${paperId}`;
            const headers = {
                'User-Agent': USER_AGENT,
                'Accept': 'application/json'
            };
            if (this.apiKey) {
                headers['x-api-key'] = this.apiKey;
            }
            const response = await ErrorHandler.retryWithBackoff(() => axios.get(url, {
                params,
                headers,
                timeout: TIMEOUTS.DEFAULT,
                maxRedirects: 5,
                validateStatus: (status) => status < 500
            }), { context: 'Semantic Scholar paper details' });
            return this.parseSemanticPaper(response.data);
        }
        catch (error) {
            logDebug('Error getting paper details from Semantic Scholar:', error.message);
            return null;
        }
    }
    async searchSnippets(options) {
        if (!this.apiKey) {
            throw new Error('search_semantic_snippets requires SEMANTIC_SCHOLAR_API_KEY.');
        }
        await this.rateLimiter.waitForPermission();
        try {
            const params = {
                query: options.query,
                limit: Math.min(options.limit || 5, 1000)
            };
            const paperIds = this.listParam(options.paperIds);
            const authors = this.listParam(options.authors);
            const venue = this.listParam(options.venue);
            const fieldsOfStudy = this.listParam(options.fieldsOfStudy);
            const fields = this.listParam(options.fields);
            if (paperIds.length > 0)
                params.paperIds = paperIds.join(',');
            if (authors.length > 0)
                params.authors = authors.join(',');
            if (venue.length > 0)
                params.venue = venue.join(',');
            if (fieldsOfStudy.length > 0)
                params.fieldsOfStudy = fieldsOfStudy.join(',');
            if (fields.length > 0)
                params.fields = fields.join(',');
            if (options.year)
                params.year = options.year;
            if (options.minCitationCount)
                params.minCitationCount = options.minCitationCount;
            if (options.publicationDateOrYear)
                params.publicationDateOrYear = options.publicationDateOrYear;
            const url = `${this.baseApiUrl}/snippet/search`;
            const response = await ErrorHandler.retryWithBackoff(() => axios.get(url, {
                params,
                headers: {
                    'User-Agent': USER_AGENT,
                    Accept: 'application/json',
                    'x-api-key': this.apiKey
                },
                timeout: TIMEOUTS.DEFAULT,
                maxRedirects: 5,
                validateStatus: status => status < 500
            }), { context: 'Semantic Scholar snippet search' });
            if (response.status >= 400) {
                this.handleHttpError({ response, config: response.config }, 'snippet search');
            }
            const data = Array.isArray(response.data?.data) ? response.data.data : [];
            return data.map(item => this.parseSnippet(item));
        }
        catch (error) {
            this.handleHttpError(error, 'snippet search');
        }
    }
    /**
     * 下载PDF文件
     */
    async downloadPdf(paperId, options = {}) {
        try {
            // 首先获取论文详细信息以获取PDF URL
            const paper = await this.getPaperDetails(paperId);
            if (!paper?.pdfUrl) {
                throw new Error(`No PDF URL available for paper ${paperId}`);
            }
            const savePath = options.savePath || './downloads';
            // 确保保存目录存在
            if (!fs.existsSync(savePath)) {
                fs.mkdirSync(savePath, { recursive: true });
            }
            const filename = `semantic_${paperId.replace(/[/\\:*?"<>|]/g, '_')}.pdf`;
            const filePath = path.join(savePath, filename);
            // 检查文件是否已存在
            if (fs.existsSync(filePath) && !options.overwrite) {
                return filePath;
            }
            const response = await ErrorHandler.retryWithBackoff(() => axios.get(paper.pdfUrl, {
                responseType: 'stream',
                timeout: TIMEOUTS.DOWNLOAD,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            }), { context: 'Semantic Scholar download' });
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(filePath));
                writer.on('error', reject);
            });
        }
        catch (error) {
            this.handleHttpError(error, 'download PDF');
        }
    }
    /**
     * 读取论文全文内容
     */
    async readPaper(paperId, options = {}) {
        try {
            const savePath = options.savePath || './downloads';
            const filename = `semantic_${paperId.replace(/[/\\:*?"<>|]/g, '_')}.pdf`;
            const filePath = path.join(savePath, filename);
            // 如果PDF不存在，先下载
            if (!fs.existsSync(filePath)) {
                await this.downloadPdf(paperId, options);
            }
            return `PDF file downloaded at: ${filePath}. Full text extraction requires additional PDF parsing implementation.`;
        }
        catch (error) {
            this.handleHttpError(error, 'read paper');
        }
    }
    /**
     * 根据DOI获取论文信息
     */
    async getPaperByDoi(doi) {
        // Clean and validate DOI
        const doiResult = sanitizeDoi(doi);
        if (!doiResult.valid) {
            logDebug('Invalid DOI format:', doiResult.error);
            return null;
        }
        try {
            return await this.getPaperDetails(`DOI:${doiResult.sanitized}`);
        }
        catch (error) {
            logDebug('Error getting paper by DOI from Semantic Scholar:', error);
            return null;
        }
    }
    /**
     * 解析搜索响应
     */
    parseSearchResponse(data) {
        if (!data.data || !Array.isArray(data.data)) {
            return [];
        }
        return data.data.map(item => this.parseSemanticPaper(item))
            .filter(paper => paper !== null);
    }
    /**
     * 解析单个Semantic Scholar论文
     */
    parseSemanticPaper(item) {
        try {
            // 提取作者
            const authors = item.authors?.map(author => author.name) || [];
            // 提取发表日期
            const publishedDate = item.publicationDate ?
                this.parseDate(item.publicationDate) :
                (item.year ? new Date(item.year, 0, 1) : null);
            // 提取PDF URL
            let pdfUrl = '';
            if (item.openAccessPdf?.url) {
                pdfUrl = item.openAccessPdf.url;
            }
            else if (item.openAccessPdf?.disclaimer) {
                // 尝试从disclaimer中提取URL
                const urlMatch = item.openAccessPdf.disclaimer.match(/https?:\/\/[^\s,)]+/);
                if (urlMatch) {
                    pdfUrl = urlMatch[0];
                }
            }
            // 提取DOI
            const doi = item.externalIds?.DOI || '';
            // 提取分类
            const fieldsOfStudy = item.fieldsOfStudy || [];
            const s2Fields = item.s2FieldsOfStudy?.map(field => field.category) || [];
            const categories = [...fieldsOfStudy, ...s2Fields];
            // 构建URL
            const url = item.url || `https://www.semanticscholar.org/paper/${item.paperId}`;
            return PaperFactory.create({
                paperId: item.paperId,
                title: this.cleanText(item.title),
                authors: authors,
                abstract: this.cleanText(item.abstract || ''),
                doi: doi,
                publishedDate: publishedDate,
                pdfUrl: pdfUrl,
                url: url,
                source: 'semantic',
                categories: [...new Set(categories)], // 去重
                keywords: [],
                citationCount: item.citationCount || 0,
                journal: item.venue || item.journal?.name || '',
                volume: item.journal?.volume || undefined,
                pages: item.journal?.pages || undefined,
                year: item.year,
                extra: {
                    semanticScholarId: item.paperId,
                    referenceCount: item.referenceCount || 0,
                    influentialCitationCount: item.influentialCitationCount || 0,
                    isOpenAccess: item.isOpenAccess || false,
                    publicationTypes: item.publicationTypes || [],
                    externalIds: item.externalIds || {}
                }
            });
        }
        catch (error) {
            logDebug('Error parsing Semantic Scholar paper:', error);
            return null;
        }
    }
    parseSnippet(item) {
        const paper = item?.paper || {};
        const snippet = item?.snippet || {};
        const corpusId = paper.corpusId ?? paper.corpus_id ?? '';
        return {
            score: typeof item?.score === 'number' ? item.score : null,
            paper: {
                corpusId: corpusId ? String(corpusId) : '',
                title: this.cleanText(paper.title || ''),
                authors: this.listParam(paper.authors),
                openAccessInfo: paper.openAccessInfo || {},
                url: corpusId ? `https://www.semanticscholar.org/paper/CorpusId:${corpusId}` : ''
            },
            snippet: {
                text: this.cleanText(snippet.text || item?.text || ''),
                snippetKind: snippet.snippetKind || snippet.kind || '',
                section: snippet.section || '',
                snippetOffset: snippet.snippetOffset || {},
                annotations: snippet.annotations || {}
            },
            text: this.cleanText(snippet.text || item?.text || '')
        };
    }
    listParam(value) {
        if (!value)
            return [];
        if (Array.isArray(value))
            return value.map(item => String(item).trim()).filter(Boolean);
        return String(value)
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
    }
    /**
     * 获取速率限制器状态
     */
    getRateLimiterStatus() {
        return this.rateLimiter.getStatus();
    }
    /**
     * 验证API密钥（如果提供）
     */
    async validateApiKey() {
        if (!this.apiKey) {
            return true; // 无API密钥时使用免费限制
        }
        try {
            await this.search('test', { maxResults: 1 });
            return true;
        }
        catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                return false;
            }
            return true; // 其他错误可能是网络问题
        }
    }
}
//# sourceMappingURL=SemanticScholarSearcher.js.map