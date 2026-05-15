/**
 * arXiv API集成模块
 * 基于arXiv API v1.1实现论文搜索和下载功能
 */

import axios from 'axios';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as xml2js from 'xml2js';
import * as cheerio from 'cheerio';
import { Paper, PaperFactory } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';
import { logDebug } from '../utils/Logger.js';
import { RateLimiter } from '../utils/RateLimiter.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { RequestCache } from '../utils/RequestCache.js';

interface ArxivEntry {
  id: string[];
  title: string[];
  summary: string[];
  author: Array<{ name: string[] }> | { name: string[] };
  published: string[];
  updated: string[];
  'arxiv:primary_category': Array<{ $: { term: string } }>;
  category?: Array<{ $: { term: string } }>;
  link: Array<{
    $: {
      href: string;
      type?: string;
      title?: string;
    };
  }>;
  'arxiv:doi'?: string[];
}

interface ArxivResponse {
  feed: {
    entry?: ArxivEntry | ArxivEntry[];
    'opensearch:totalResults': string[];
  };
}

type ArxivSearchParams = {
  search_query: string;
  start: number;
  max_results: number;
  sortBy: string;
  sortOrder: string;
};

const ARXIV_MAX_RESULTS = 25;
const ARXIV_SEARCH_TIMEOUT_MS = 10000;
const ARXIV_EXPORT_API_INTERVAL_MS = 3000;
const ARXIV_EXPORT_API_COOLDOWN_MS = 30000;
const ARXIV_RATE_LIMIT_LOCK_STALE_MS = 10000;
const ARXIV_RATE_LIMIT_LOCK_POLL_MS = 100;

interface ArxivRateLimitState {
  lastRequestAt?: number;
  cooldownUntil?: number;
}

export class ArxivSearcher extends PaperSource {
  private readonly rateLimiter: RateLimiter;
  private readonly cache: RequestCache<Paper[]>;

  constructor() {
    super('arxiv', 'https://export.arxiv.org/api');
    // arXiv rate limit: 1 request per 3 seconds (0.33 req/s)
    this.rateLimiter = new RateLimiter({
      requestsPerSecond: 0.33,
      burstCapacity: 1
    });
    this.cache = new RequestCache<Paper[]>({
      maxSize: 100,
      ttlMs: 3600000 // 1 hour
    });
  }

  getCapabilities(): PlatformCapabilities {
    return {
      search: true,
      download: true,
      fullText: true,
      citations: false, // arXiv本身不提供被引统计
      requiresApiKey: false,
      supportedOptions: ['maxResults', 'year', 'author', 'category', 'sortBy', 'sortOrder']
    };
  }

  /**
   * 搜索arXiv论文
   */
  async search(query: string, options: SearchOptions = {}): Promise<Paper[]> {
    try {
      const customOptions = options as any;
      const forceRefresh = customOptions.forceRefresh === true;

      // Check cache first
      if (!forceRefresh) {
        const cacheKey = this.cache.generateKey('arxiv', query, options);
        const cached = this.cache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const searchQuery = this.buildSearchQuery(query, options);
      const url = `${this.baseUrl}/query`;

      // Map sortOrder: arXiv API requires 'ascending' or 'descending'
      const sortOrderMap: Record<string, string> = {
        'asc': 'ascending',
        'desc': 'descending',
        'ascending': 'ascending',
        'descending': 'descending'
      };

      const maxResults = this.normalizeMaxResults(options.maxResults);
      const params: ArxivSearchParams = {
        search_query: searchQuery,
        start: 0,
        max_results: maxResults,
        sortBy: this.mapSortField(options.sortBy || 'relevance'),
        sortOrder: sortOrderMap[options.sortOrder || 'desc'] || 'descending'
      };

      logDebug(`arXiv API Request: GET ${url}`);
      logDebug('arXiv Request params:', params);

      const papers = await this.searchViaExportApi(url, params, query, options);
      const limitedPapers = papers.slice(0, maxResults);
      logDebug(`arXiv Parsed ${limitedPapers.length} papers`);

      // Cache results
      const cacheKey = this.cache.generateKey('arxiv', query, options);
      this.cache.set(cacheKey, limitedPapers);

      return limitedPapers;
    } catch (error: any) {
      logDebug('arXiv Search Error:', error.message);
      this.handleHttpError(error, 'search');
    }
  }

  private async searchViaExportApi(
    url: string,
    params: ArxivSearchParams,
    originalQuery: string,
    options: SearchOptions
  ): Promise<Paper[]> {
    try {
      await this.rateLimiter.waitForPermission();
      await this.waitForGlobalExportApiSlot();

      const response = await this.fetchSearchPage(url, params);
      logDebug(`arXiv API Response: ${response.status} ${response.statusText}, Data length: ${response.data?.length || 0}`);

      return await this.parseSearchResponse(response.data);
    } catch (apiError: any) {
      if (this.isRateLimitError(apiError)) {
        await this.markGlobalExportApiCooldown();
      }

      if (!this.shouldUseWebFallback(apiError)) {
        throw apiError;
      }

      logDebug(`arXiv Export API failed (${apiError.message}); trying web search fallback`);
      try {
        return await this.searchViaWebFallback(originalQuery, options, params.max_results);
      } catch (fallbackError: any) {
        logDebug(`arXiv web fallback failed: ${fallbackError.message}`);
        throw apiError;
      }
    }
  }

  private async fetchSearchPage(url: string, params: ArxivSearchParams) {
    try {
      return await ErrorHandler.retryWithBackoff(
        () =>
          axios.get(url, {
            params,
            timeout: ARXIV_SEARCH_TIMEOUT_MS,
            headers: { 'User-Agent': USER_AGENT }
          }),
        {
          context: 'arXiv search',
          maxRetries: 0
        }
      );
    } catch (error: any) {
      if (this.isTimeoutError(error)) {
        throw new Error(
          `arXiv search timed out after ${ARXIV_SEARCH_TIMEOUT_MS}ms. Try a narrower query or smaller maxResults if this persists.`
        );
      }
      throw error;
    }
  }

  private normalizeMaxResults(maxResults?: number): number {
    if (!Number.isFinite(maxResults)) {
      return 10;
    }
    return Math.max(1, Math.min(ARXIV_MAX_RESULTS, Math.floor(maxResults as number)));
  }

  private isTimeoutError(error: any): boolean {
    return (
      error?.code === 'ECONNABORTED' ||
      error?.code === 'ETIMEDOUT' ||
      /timeout|timed out/i.test(error?.message || '')
    );
  }

  private shouldUseWebFallback(error: any): boolean {
    const status = error?.response?.status || error?.status;
    return this.isTimeoutError(error) || [429, 500, 502, 503, 504].includes(status);
  }

  private isRateLimitError(error: any): boolean {
    return (error?.response?.status || error?.status) === 429;
  }

  private async waitForGlobalExportApiSlot(): Promise<void> {
    await this.withArxivRateLimitLock(async () => {
      const paths = this.getArxivRateLimitPaths();
      const state = this.readArxivRateLimitState(paths.statePath);
      const now = Date.now();

      if (state.cooldownUntil && state.cooldownUntil > now) {
        throw this.createArxivCooldownError(state.cooldownUntil - now);
      }

      const waitMs = Math.max(0, (state.lastRequestAt || 0) + ARXIV_EXPORT_API_INTERVAL_MS - now);
      if (waitMs > 0) {
        await this.sleep(waitMs);
      }

      const lastRequestAt = Date.now();
      const nextState: ArxivRateLimitState = { ...state, lastRequestAt };
      if (nextState.cooldownUntil && nextState.cooldownUntil <= lastRequestAt) {
        delete nextState.cooldownUntil;
      }
      this.writeArxivRateLimitState(paths.statePath, nextState);
    });
  }

  private async markGlobalExportApiCooldown(): Promise<void> {
    await this.withArxivRateLimitLock(async () => {
      const paths = this.getArxivRateLimitPaths();
      const state = this.readArxivRateLimitState(paths.statePath);
      this.writeArxivRateLimitState(paths.statePath, {
        ...state,
        cooldownUntil: Date.now() + ARXIV_EXPORT_API_COOLDOWN_MS
      });
    });
  }

  private async withArxivRateLimitLock<T>(operation: () => Promise<T>): Promise<T> {
    const paths = this.getArxivRateLimitPaths();
    fs.mkdirSync(paths.dir, { recursive: true });
    const fd = await this.acquireArxivRateLimitLock(paths.lockPath);

    try {
      return await operation();
    } finally {
      fs.closeSync(fd);
      fs.rmSync(paths.lockPath, { force: true });
    }
  }

  private async acquireArxivRateLimitLock(lockPath: string): Promise<number> {
    while (true) {
      try {
        return fs.openSync(lockPath, 'wx');
      } catch (error: any) {
        if (error?.code !== 'EEXIST') {
          throw error;
        }

        this.removeStaleArxivRateLimitLock(lockPath);
        await this.sleep(ARXIV_RATE_LIMIT_LOCK_POLL_MS);
      }
    }
  }

  private removeStaleArxivRateLimitLock(lockPath: string): void {
    try {
      const stats = fs.statSync(lockPath);
      if (Date.now() - stats.mtimeMs > ARXIV_RATE_LIMIT_LOCK_STALE_MS) {
        fs.rmSync(lockPath, { force: true });
      }
    } catch {
      // Another process may have released the lock between stat and remove.
    }
  }

  private getArxivRateLimitPaths(): { dir: string; statePath: string; lockPath: string } {
    const dir = process.env.PAPER_SEARCH_CACHE_DIR || path.join(os.homedir(), '.cache', 'paper-search');
    return {
      dir,
      statePath: path.join(dir, 'arxiv-rate-limit.json'),
      lockPath: path.join(dir, 'arxiv-rate-limit.lock')
    };
  }

  private readArxivRateLimitState(statePath: string): ArxivRateLimitState {
    try {
      if (!fs.existsSync(statePath)) {
        return {};
      }
      const parsed = JSON.parse(fs.readFileSync(statePath, 'utf8')) as ArxivRateLimitState;
      return {
        lastRequestAt: typeof parsed.lastRequestAt === 'number' ? parsed.lastRequestAt : undefined,
        cooldownUntil: typeof parsed.cooldownUntil === 'number' ? parsed.cooldownUntil : undefined
      };
    } catch {
      return {};
    }
  }

  private writeArxivRateLimitState(statePath: string, state: ArxivRateLimitState): void {
    fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
  }

  private createArxivCooldownError(waitMs: number): Error {
    const error = new Error(`arXiv Export API is cooling down for ${Math.ceil(waitMs / 1000)}s after a rate-limit response.`);
    (error as any).status = 429;
    return error;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async searchViaWebFallback(query: string, options: SearchOptions, maxResults: number): Promise<Paper[]> {
    const params: Record<string, string | number> = {
      query,
      searchtype: 'all',
      abstracts: 'show',
      size: this.webFallbackPageSize(maxResults)
    };
    const order = this.mapWebSortOrder(options);
    if (order) {
      params.order = order;
    }

    const response = await ErrorHandler.retryWithBackoff(
      () =>
        axios.get('https://arxiv.org/search/', {
          params,
          timeout: TIMEOUTS.DEFAULT,
          headers: { 'User-Agent': USER_AGENT }
        }),
      {
        context: 'arXiv web fallback',
        maxRetries: 1,
        initialDelayMs: 5000,
        maxDelayMs: 15000
      }
    );

    return this.parseWebSearchResponse(response.data).slice(0, maxResults);
  }

  private parseWebSearchResponse(htmlData: string): Paper[] {
    const $ = cheerio.load(htmlData);
    const papers: Paper[] = [];

    $('li.arxiv-result').each((_, element) => {
      const item = $(element);
      const absHref = item.find('p.list-title a[href*="/abs/"]').first().attr('href') || '';
      const paperId = absHref.split('/abs/').pop()?.trim();
      if (!paperId) {
        return;
      }

      const title = this.cleanText(item.find('p.title').first().text());
      const authors = item
        .find('p.authors a')
        .map((_, author) => this.cleanText($(author).text()))
        .get()
        .filter(Boolean);

      const abstractNode = item.find('.abstract-full').first().clone();
      abstractNode.find('a').remove();
      const shortAbstractNode = item.find('.abstract-short').first().clone();
      shortAbstractNode.find('a').remove();
      const abstract = this.cleanText(abstractNode.text() || shortAbstractNode.text()).replace(/\s*(Less|More)$/i, '');

      const categories = item
        .find('.tags .tag')
        .map((_, tag) => this.cleanText($(tag).text()))
        .get()
        .filter(Boolean);

      const submittedText = item.find('p.is-size-7').first().text().match(/Submitted\s+([^;]+);?/i)?.[1]?.trim();
      const publishedDate = submittedText ? new Date(submittedText) : null;
      const year = publishedDate && !Number.isNaN(publishedDate.getTime()) ? publishedDate.getFullYear() : undefined;

      papers.push(
        PaperFactory.create({
          paperId,
          title,
          authors,
          abstract,
          publishedDate: publishedDate && !Number.isNaN(publishedDate.getTime()) ? publishedDate : null,
          pdfUrl: `https://arxiv.org/pdf/${paperId}`,
          url: `https://arxiv.org/abs/${paperId}`,
          source: 'arxiv',
          categories,
          year,
          extra: {
            arxivId: paperId,
            fallback: 'arxiv_web_search'
          }
        })
      );
    });

    return papers;
  }

  /**
   * 下载PDF文件
   */
  async downloadPdf(paperId: string, options: DownloadOptions = {}): Promise<string> {
    try {
      const savePath = options.savePath || './downloads';
      const pdfUrl = `https://arxiv.org/pdf/${paperId}.pdf`;
      
      // 确保保存目录存在
      if (!fs.existsSync(savePath)) {
        fs.mkdirSync(savePath, { recursive: true });
      }

      const filename = `${paperId}.pdf`;
      const filePath = path.join(savePath, filename);

      // 检查文件是否已存在
      if (fs.existsSync(filePath) && !options.overwrite) {
        return filePath;
      }

      await this.rateLimiter.waitForPermission();

      const response = await ErrorHandler.retryWithBackoff(
        () => axios.get(pdfUrl, {
          responseType: 'stream',
          timeout: TIMEOUTS.DOWNLOAD
        }),
        { context: 'arXiv download' }
      );

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
      });
    } catch (error) {
      this.handleHttpError(error, 'download PDF');
    }
  }

  /**
   * 读取论文全文内容（从PDF中提取）
   */
  async readPaper(paperId: string, options: DownloadOptions = {}): Promise<string> {
    try {
      const savePath = options.savePath || './downloads';
      const filePath = path.join(savePath, `${paperId}.pdf`);

      // 如果PDF不存在，先下载
      if (!fs.existsSync(filePath)) {
        await this.downloadPdf(paperId, options);
      }

      // 这里需要PDF解析库，暂时返回提示信息
      return `PDF file downloaded at: ${filePath}. Full text extraction requires additional PDF parsing implementation.`;
    } catch (error) {
      this.handleHttpError(error, 'read paper');
    }
  }

  /**
   * 构建搜索查询
   */
  private buildSearchQuery(query: string, options: SearchOptions): string {
    let searchQuery = this.normalizeSearchQuery(query);

    // 添加作者过滤
    if (options.author) {
      searchQuery += ` AND au:"${options.author}"`;
    }

    // 添加分类过滤
    if (options.category) {
      searchQuery += ` AND cat:${options.category}`;
    }

    // 添加年份过滤（arXiv使用日期范围）
    if (options.year) {
      const year = options.year;
      if (year.includes('-')) {
        // 年份范围
        const [startYear, endYear] = year.split('-');
        if (startYear) {
          searchQuery += ` AND submittedDate:[${startYear}0101 TO `;
          searchQuery += endYear ? `${endYear}1231]` : '*]';
        }
      } else {
        // 单一年份
        searchQuery += ` AND submittedDate:[${year}0101 TO ${year}1231]`;
      }
    }

    return searchQuery;
  }

  private normalizeSearchQuery(query: string): string {
    const trimmed = query.trim();
    if (!trimmed || this.hasArxivQuerySyntax(trimmed)) {
      return trimmed;
    }

    return trimmed
      .split(/\s+/)
      .filter(Boolean)
      .map(term => `all:${this.escapeArxivTerm(term)}`)
      .join(' AND ');
  }

  private hasArxivQuerySyntax(query: string): boolean {
    return /\b(all|ti|au|abs|co|jr|cat|rn|id):/i.test(query) || /\b(AND|OR|ANDNOT)\b/i.test(query);
  }

  private escapeArxivTerm(term: string): string {
    const escaped = term.replace(/"/g, '\\"');
    return /[\s()]/.test(escaped) ? `"${escaped}"` : escaped;
  }

  private webFallbackPageSize(maxResults: number): 25 | 50 | 100 {
    if (maxResults <= 25) return 25;
    if (maxResults <= 50) return 50;
    return 100;
  }

  private mapWebSortOrder(options: SearchOptions): string | undefined {
    if (options.sortBy === 'date') {
      return options.sortOrder === 'asc' ? 'announced_date_first' : '-announced_date_first';
    }
    return undefined;
  }

  /**
   * 映射排序字段
   */
  private mapSortField(sortBy: string): string {
    const fieldMap: Record<string, string> = {
      'relevance': 'relevance',
      'date': 'submittedDate',
      'citations': 'submittedDate' // arXiv没有被引排序，使用日期代替
    };
    return fieldMap[sortBy] || 'relevance';
  }

  /**
   * 解析搜索响应
   */
  private async parseSearchResponse(xmlData: string): Promise<Paper[]> {
    try {
      const parser = new xml2js.Parser();
      const result: ArxivResponse = await parser.parseStringPromise(xmlData);

      if (!result.feed.entry) {
        return [];
      }

      const entries = Array.isArray(result.feed.entry) 
        ? result.feed.entry 
        : [result.feed.entry];

      return entries.map(entry => this.parseArxivEntry(entry))
        .filter(paper => paper !== null) as Paper[];
    } catch (error) {
      logDebug('Error parsing arXiv response:', error);
      return [];
    }
  }

  /**
   * 解析单个arXiv条目
   */
  private parseArxivEntry(entry: ArxivEntry): Paper | null {
    try {
      // 提取论文ID
      const arxivUrl = entry.id[0];
      const paperId = arxivUrl.split('/').pop()?.replace('abs/', '') || '';

      // 提取标题
      const title = entry.title[0];

      // 提取作者
      const authorData = entry.author;
      const authors = Array.isArray(authorData) 
        ? authorData.map(a => a.name[0])
        : [authorData.name[0]];

      // 提取摘要
      const abstract = entry.summary[0];

      // 提取日期
      const publishedDate = this.parseDate(entry.published[0]);
      const updatedDate = this.parseDate(entry.updated[0]);

      // 提取DOI
      const doi = entry['arxiv:doi']?.[0] || '';

      // 提取分类
      const primaryCategory = entry['arxiv:primary_category']?.[0]?.$?.term || '';
      const categories = entry.category?.map(cat => cat.$.term) || [primaryCategory];

      // 提取链接
      const pdfLink = entry.link.find(link => link.$.type === 'application/pdf');
      const pdfUrl = pdfLink?.$.href || `https://arxiv.org/pdf/${paperId}.pdf`;

      // 提取年份
      const year = publishedDate?.getFullYear();

      return PaperFactory.create({
        paperId: paperId,
        title: this.cleanText(title),
        authors: authors,
        abstract: this.cleanText(abstract),
        doi: doi,
        publishedDate: publishedDate,
        pdfUrl: pdfUrl,
        url: `https://arxiv.org/abs/${paperId}`,
        source: 'arxiv',
        updatedDate: updatedDate || undefined,
        categories: categories,
        keywords: [], // arXiv通常不提供关键词
        citationCount: 0, // arXiv本身不提供被引统计
        year: year,
        extra: {
          primaryCategory: primaryCategory,
          arxivId: paperId
        }
      });
    } catch (error) {
      logDebug('Error parsing arXiv entry:', error);
      return null;
    }
  }
}
