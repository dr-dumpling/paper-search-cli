/**
 * bioRxiv API集成模块
 * 支持bioRxiv和medRxiv预印本论文搜索
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { Paper, PaperFactory } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';
import { logDebug } from '../utils/Logger.js';
import { RateLimiter } from '../infrastructure/rate-limit/RateLimiter.js';
import { ErrorHandler } from '../infrastructure/http/ErrorHandler.js';
import { downloadPdfFromUrl, safeFilename } from '../infrastructure/pdf/PdfDownload.js';

interface BioRxivSearchOptions extends SearchOptions {
  /** 搜索天数范围 */
  days?: number;
  /** 服务器类型 */
  server?: 'biorxiv' | 'medrxiv';
}

interface BioRxivResponse {
  messages: Array<{
    status: string;
    count: number;
    total?: string;
  }>;
  collection: BioRxivPaper[];
}

interface BioRxivPaper {
  doi: string;
  title: string;
  authors: string;
  author_corresponding: string;
  author_corresponding_institution: string;
  date: string;
  version: string;
  type: string;
  license: string;
  category: string;
  jatsxml: string;
  abstract: string;
  published?: string;
  server: string;
}

export class BioRxivSearcher extends PaperSource {
  private readonly serverType: 'biorxiv' | 'medrxiv';
  private readonly rateLimiter: RateLimiter;

  constructor(serverType: 'biorxiv' | 'medrxiv' = 'biorxiv') {
    super(serverType, `https://api.biorxiv.org/details/${serverType}`);
    this.serverType = serverType;
    // bioRxiv rate limit: 1 req/s, burst=2
    this.rateLimiter = new RateLimiter({
      requestsPerSecond: 1,
      burstCapacity: 2
    });
  }

  getCapabilities(): PlatformCapabilities {
    return {
      search: true,
      download: true,
      fullText: true,
      citations: false,
      requiresApiKey: false,
      supportedOptions: ['maxResults', 'days', 'category']
    };
  }

  /**
   * 搜索bioRxiv/medRxiv论文
   */
  async search(query: string, options: BioRxivSearchOptions = {}): Promise<Paper[]> {
    try {
      // 计算日期范围
      const days = options.days || 30;
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const maxResults = options.maxResults || 10;
      const maxPages = Math.max(1, Math.min(25, Math.ceil(maxResults / 30) + 10));
      const papers: Paper[] = [];
      const seen = new Set<string>();
      let cursor = 0;
      let total: number | undefined;
      let pages = 0;

      while (papers.length < maxResults && pages < maxPages && (total === undefined || cursor < total)) {
        const searchUrl = `${this.baseUrl}/${startDate}/${endDate}/${cursor}`;

        logDebug(`${this.serverType} API Request: GET ${searchUrl}`);

        await this.rateLimiter.waitForPermission();

        const response = await ErrorHandler.retryWithBackoff(
          () => axios.get(searchUrl, {
            timeout: TIMEOUTS.DEFAULT,
            headers: { 'User-Agent': USER_AGENT }
          }),
          { context: `${this.serverType} search` }
        );

        logDebug(`${this.serverType} API Response: ${response.status} ${response.statusText}`);

        const collection = Array.isArray(response.data?.collection) ? response.data.collection : [];
        const message = Array.isArray(response.data?.messages) ? response.data.messages[0] : undefined;
        const parsedTotal = Number(message?.total);
        if (Number.isFinite(parsedTotal)) total = parsedTotal;

        const pagePapers = this.parseSearchResponse(response.data, query, options);
        for (const paper of pagePapers) {
          const key = paper.doi || paper.paperId || paper.title;
          if (!seen.has(key)) {
            seen.add(key);
            papers.push(paper);
            if (papers.length >= maxResults) break;
          }
        }

        if (collection.length === 0) break;
        cursor += collection.length;
        pages += 1;
      }

      logDebug(`${this.serverType} Parsed ${papers.length} papers`);

      return papers.slice(0, maxResults);
    } catch (error: any) {
      logDebug(`${this.serverType} Search Error:`, error.message);
      this.handleHttpError(error, 'search');
    }
  }

  /**
   * 下载PDF文件
   */
  async downloadPdf(paperId: string, options: DownloadOptions = {}): Promise<string> {
    const savePath = options.savePath || './downloads';
    const candidates = this.pdfUrlCandidates(paperId);
    let lastError: any;

    await this.rateLimiter.waitForPermission();

    for (const pdfUrl of candidates) {
      try {
        return await downloadPdfFromUrl(
          pdfUrl,
          savePath,
          `${this.serverType}_${safeFilename(paperId)}`,
          {
            headers: {
              Referer: `https://www.${this.serverType}.org/`,
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
          }
        );
      } catch (error: any) {
        lastError = error;
        logDebug(`${this.serverType} PDF candidate failed: ${pdfUrl}`, error?.message || error);
      }
    }

    throw new Error(
      `${this.serverType} PDF download failed for ${paperId}. ${lastError?.message || String(lastError)}`
    );
  }

  /**
   * 读取论文全文内容
   */
  async readPaper(paperId: string, options: DownloadOptions = {}): Promise<string> {
    try {
      const savePath = options.savePath || './downloads';
      const filePath = path.join(savePath, `${paperId.replace(/\//g, '_')}.pdf`);

      // 如果PDF不存在，先下载
      if (!fs.existsSync(filePath)) {
        await this.downloadPdf(paperId, options);
      }

      return `PDF file downloaded at: ${filePath}. Full text extraction requires additional PDF parsing implementation.`;
    } catch (error) {
      this.handleHttpError(error, 'read paper');
    }
  }

  /**
   * 解析搜索响应
   */
  private parseSearchResponse(data: BioRxivResponse, query: string, options: BioRxivSearchOptions): Paper[] {
    if (!data.collection || !Array.isArray(data.collection)) {
      return [];
    }

    // 如果有查询词，进行文本匹配过滤
    let filteredCollection = data.collection;
    if (query && query !== '*' && query.trim()) {
      const queryLower = query.toLowerCase();
      filteredCollection = data.collection.filter(item => 
        item.title.toLowerCase().includes(queryLower) ||
        item.abstract.toLowerCase().includes(queryLower) ||
        item.authors.toLowerCase().includes(queryLower) ||
        item.category.toLowerCase().includes(queryLower)
      );
    }

    if (options.category && options.category.trim()) {
      const categoryLower = options.category.toLowerCase().replace(/_/g, ' ');
      filteredCollection = filteredCollection.filter(item =>
        item.category.toLowerCase().replace(/_/g, ' ').includes(categoryLower)
      );
    }

    return filteredCollection.map(item => this.parseBioRxivPaper(item))
      .filter(paper => paper !== null) as Paper[];
  }

  private pdfUrlCandidates(paperId: string): string[] {
    const clean = paperId.trim();
    if (/v\d+$/i.test(clean)) {
      return [`https://www.${this.serverType}.org/content/${clean}.full.pdf`];
    }
    return [
      `https://www.${this.serverType}.org/content/${clean}.full.pdf`,
      `https://www.${this.serverType}.org/content/${clean}v1.full.pdf`
    ];
  }

  /**
   * 解析单个bioRxiv论文
   */
  private parseBioRxivPaper(item: BioRxivPaper): Paper | null {
    try {
      // 解析作者
      const authors = item.authors.split(';').map(author => author.trim());
      
      // 解析日期
      const publishedDate = this.parseDate(item.date);
      const year = publishedDate?.getFullYear();
      
      // 构建URL
      const paperUrl = `https://www.${this.serverType}.org/content/${item.doi}v${item.version}`;
      const pdfUrl = `https://www.${this.serverType}.org/content/${item.doi}v${item.version}.full.pdf`;

      return PaperFactory.create({
        paperId: item.doi,
        title: this.cleanText(item.title),
        authors: authors,
        abstract: this.cleanText(item.abstract),
        doi: item.doi,
        publishedDate: publishedDate,
        pdfUrl: pdfUrl,
        url: paperUrl,
        source: this.serverType,
        categories: [item.category],
        keywords: [],
        citationCount: 0,
        year: year,
        extra: {
          version: item.version,
          type: item.type,
          license: item.license,
          server: item.server,
          corresponding_author: item.author_corresponding,
          corresponding_institution: item.author_corresponding_institution
        }
      });
    } catch (error) {
      logDebug(`Error parsing ${this.serverType} paper:`, error);
      return null;
    }
  }
}

/**
 * medRxiv搜索器 - 继承自BioRxivSearcher
 */
export class MedRxivSearcher extends BioRxivSearcher {
  constructor() {
    super('medrxiv');
  }
}
