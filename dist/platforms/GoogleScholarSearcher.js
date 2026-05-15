/**
 * Google Scholar搜索器 - 网页抓取实现
 * 基于HTML解析，包含反检测机制
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PaperFactory } from '../models/Paper.js';
import { PaperSource } from './PaperSource.js';
import { TIMEOUTS } from '../config/constants.js';
import { logDebug } from '../utils/Logger.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
export class GoogleScholarSearcher extends PaperSource {
    scholarUrl = 'https://scholar.google.com/scholar';
    userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ];
    constructor() {
        super('google_scholar', 'https://scholar.google.com');
    }
    getCapabilities() {
        return {
            search: true,
            download: false, // Google Scholar不提供直接下载
            fullText: false, // 只有元数据和摘要
            citations: true, // 可以获取引用次数
            requiresApiKey: false, // 不需要API密钥，但可能被限制
            supportedOptions: ['maxResults', 'year', 'author']
        };
    }
    /**
     * 搜索Google Scholar论文
     */
    async search(query, options = {}) {
        logDebug(`Google Scholar Search: query="${query}"`);
        try {
            const papers = [];
            let start = 0;
            const resultsPerPage = 10;
            const maxResults = options.maxResults || 10;
            while (papers.length < maxResults) {
                // 添加随机延迟避免检测
                await this.randomDelay();
                const params = this.buildSearchParams(query, start, options);
                const response = await this.makeScholarRequest(params);
                if (response.status !== 200) {
                    logDebug(`Google Scholar HTTP Error: ${response.status}`);
                    break;
                }
                const $ = cheerio.load(response.data);
                const results = $('.gs_ri'); // 搜索结果容器
                if (results.length === 0) {
                    logDebug('Google Scholar: No more results found');
                    break;
                }
                logDebug(`Google Scholar: Found ${results.length} results on page`);
                // 解析每个结果
                results.each((index, element) => {
                    if (papers.length >= maxResults)
                        return false; // 停止遍历
                    const paper = this.parseScholarResult($, $(element));
                    if (paper) {
                        papers.push(paper);
                    }
                });
                start += resultsPerPage;
            }
            logDebug(`Google Scholar Results: Found ${papers.length} papers`);
            return papers;
        }
        catch (error) {
            this.handleHttpError(error, 'search');
        }
    }
    /**
     * Google Scholar不支持直接PDF下载
     */
    async downloadPdf(paperId, options) {
        throw new Error('Google Scholar does not support direct PDF download. Please use the paper URL to access the publisher.');
    }
    /**
     * Google Scholar不提供全文内容
     */
    async readPaper(paperId, options) {
        throw new Error('Google Scholar does not provide full-text content. Please use the paper URL to access the full text.');
    }
    /**
     * 构建搜索参数
     */
    buildSearchParams(query, start, options) {
        const params = {
            q: query,
            start: start,
            hl: options.language || 'en',
            as_sdt: '0,5', // 包括文章和引用
            as_vis: '1' // 排除引用，只显示学术论文
        };
        // 添加年份过滤
        if (options.yearLow || options.yearHigh) {
            params.as_ylo = options.yearLow || '';
            params.as_yhi = options.yearHigh || '';
        }
        // 添加作者过滤
        if (options.author) {
            params.as_sauthors = options.author;
        }
        return params;
    }
    /**
     * 发起Scholar请求
     */
    async makeScholarRequest(params) {
        const userAgent = this.getRandomUserAgent();
        const config = {
            params,
            headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: TIMEOUTS.DEFAULT
        };
        logDebug(`Google Scholar Request: GET ${this.scholarUrl}`);
        logDebug('Scholar params:', params);
        return await ErrorHandler.retryWithBackoff(() => axios.get(this.scholarUrl, config), { context: 'Google Scholar search' });
    }
    /**
     * 解析单个Scholar搜索结果
     */
    parseScholarResult($, element) {
        try {
            // 提取标题和链接
            const titleElement = element.find('h3.gs_rt');
            const titleLink = titleElement.find('a');
            const title = titleElement.text().replace(/^\[PDF\]|\[HTML\]|\[BOOK\]|\[B\]/, '').trim();
            const url = titleLink.attr('href') || '';
            if (!title) {
                return null;
            }
            // 过滤掉书籍结果，优先学术论文
            const titleText = titleElement.text();
            if (titleText.includes('[BOOK]') || titleText.includes('[B]') ||
                url.includes('books.google.com')) {
                return null; // 跳过书籍结果
            }
            // 提取作者和出版信息
            const infoElement = element.find('div.gs_a');
            const infoText = infoElement.text();
            const authors = this.extractAuthors(infoText);
            const year = this.extractYear(infoText);
            // 提取摘要
            const abstractElement = element.find('div.gs_rs');
            const abstract = abstractElement.text() || '';
            // 提取引用次数
            const citationElement = element.find('div.gs_fl a').filter((i, el) => {
                return $(el).text().includes('Cited by');
            });
            const citationText = citationElement.text();
            const citationCount = this.extractCitationCount(citationText);
            // 生成论文ID
            const paperId = this.generatePaperId(title, authors);
            return PaperFactory.create({
                paperId,
                title: this.cleanText(title),
                authors,
                abstract: this.cleanText(abstract),
                doi: '', // Google Scholar通常不直接提供DOI
                publishedDate: year ? new Date(year, 0, 1) : null,
                pdfUrl: '', // 需要额外处理PDF链接
                url,
                source: 'googlescholar',
                categories: [],
                keywords: [],
                citationCount,
                journal: this.extractJournal(infoText),
                year,
                extra: {
                    scholarId: paperId,
                    infoText
                }
            });
        }
        catch (error) {
            logDebug('Error parsing Google Scholar result:', error);
            return null;
        }
    }
    /**
     * 提取作者信息
     */
    extractAuthors(infoText) {
        const parts = infoText.split(' - ');
        if (parts.length > 0) {
            const authorPart = parts[0];
            return authorPart.split(',').map(author => author.trim()).filter(a => a.length > 0);
        }
        return [];
    }
    /**
     * 提取年份
     */
    extractYear(text) {
        const yearMatch = text.match(/\b(19|20)\d{2}\b/);
        return yearMatch ? parseInt(yearMatch[0], 10) : undefined;
    }
    /**
     * 提取期刊信息
     */
    extractJournal(infoText) {
        const parts = infoText.split(' - ');
        if (parts.length > 1) {
            // 通常期刊在第二部分
            return parts[1].split(',')[0].trim();
        }
        return '';
    }
    /**
     * 提取引用次数
     */
    extractCitationCount(citationText) {
        const match = citationText.match(/Cited by (\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }
    /**
     * 生成论文ID
     */
    generatePaperId(title, authors) {
        const titleHash = this.simpleHash(title);
        const authorHash = this.simpleHash(authors.join(''));
        return `gs_${titleHash}_${authorHash}`;
    }
    /**
     * 简单哈希函数
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash).toString(36);
    }
    /**
     * 获取随机User-Agent
     */
    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }
    /**
     * 随机延迟
     */
    async randomDelay() {
        const delay = Math.random() * 2000 + 1000; // 1-3秒随机延迟
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}
//# sourceMappingURL=GoogleScholarSearcher.js.map