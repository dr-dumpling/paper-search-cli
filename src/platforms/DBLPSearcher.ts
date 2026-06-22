import axios, { AxiosInstance } from 'axios';
import { Paper, PaperFactory } from '../models/Paper.js';
import { DownloadOptions, PaperSource, PlatformCapabilities, SearchOptions } from './PaperSource.js';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';
import { logDebug } from '../utils/Logger.js';
import { ErrorHandler } from '../infrastructure/http/ErrorHandler.js';

interface DBLPResponse {
  result?: {
    hits?: {
      '@total'?: string;
      '@computed'?: string;
      '@sent'?: string;
      '@first'?: string;
      hit?: DBLPHit | DBLPHit[];
    };
  };
}

interface DBLPHit {
  '@id'?: string;
  '@score'?: string;
  info?: DBLPInfo;
  url?: string;
}

interface DBLPInfo {
  authors?: {
    author?: DBLPAuthor | DBLPAuthor[] | string;
  };
  title?: string;
  venue?: string;
  volume?: string;
  number?: string;
  pages?: string;
  year?: string;
  type?: string;
  access?: string;
  key?: string;
  doi?: string;
  ee?: string | string[];
  url?: string;
}

interface DBLPAuthor {
  '@pid'?: string;
  text?: string;
}

export class DBLPSearcher extends PaperSource {
  private readonly client: AxiosInstance;

  constructor() {
    super('dblp', 'https://dblp.org/search/publ/api');
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: TIMEOUTS.DEFAULT,
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT
      }
    });
  }

  getCapabilities(): PlatformCapabilities {
    return {
      search: true,
      download: false,
      fullText: false,
      citations: false,
      requiresApiKey: false,
      supportedOptions: ['maxResults', 'year', 'author', 'journal', 'sortBy', 'sortOrder']
    };
  }

  async search(query: string, options: SearchOptions = {}): Promise<Paper[]> {
    try {
      const params: Record<string, unknown> = {
        q: this.buildQuery(query, options),
        format: 'json',
        h: Math.min(options.maxResults || 10, 1000),
        c: 0
      };

      const response = await ErrorHandler.retryWithBackoff(
        () => this.client.get<DBLPResponse>('', { params }),
        { context: 'DBLP search' }
      );

      const hits = this.asArray(response.data?.result?.hits?.hit);
      return hits.map(hit => this.parseHit(hit)).filter((paper): paper is Paper => Boolean(paper));
    } catch (error) {
      this.handleHttpError(error, 'search');
    }
  }

  async downloadPdf(_paperId: string, _options: DownloadOptions = {}): Promise<string> {
    throw new Error('DBLP does not host PDFs directly. Use DOI or publisher URLs for download fallbacks.');
  }

  async readPaper(_paperId: string, _options: DownloadOptions = {}): Promise<string> {
    throw new Error('DBLP provides bibliographic metadata only; it does not provide full text.');
  }

  private buildQuery(query: string, options: SearchOptions): string {
    const parts = [query.trim()];
    if (options.author) parts.push(`author:${options.author.trim()}`);
    if (options.journal) parts.push(options.journal.trim());
    if (options.venue) parts.push(options.venue.trim());
    if (options.year && /^\d{4}$/.test(options.year.trim())) parts.push(options.year.trim());
    return parts.filter(Boolean).join(' ');
  }

  private parseHit(hit: DBLPHit): Paper | null {
    const info = hit.info;
    if (!info?.title) return null;

    const year = info.year ? Number(info.year) || undefined : undefined;
    const doi = info.doi || '';
    const ee = this.firstValue(info.ee);
    const url = info.url || (doi ? `https://doi.org/${doi}` : ee || '');

    return PaperFactory.create({
      paperId: info.key || doi || hit['@id'] || info.title,
      title: this.cleanText(info.title),
      authors: this.parseAuthors(info.authors?.author),
      abstract: '',
      doi,
      publishedDate: year ? new Date(year, 0, 1) : null,
      pdfUrl: '',
      url,
      source: 'dblp',
      journal: info.venue || undefined,
      volume: info.volume || undefined,
      issue: info.number || undefined,
      pages: info.pages || undefined,
      year,
      extra: {
        dblpKey: info.key || '',
        dblpType: info.type || '',
        access: info.access || '',
        electronicEdition: ee,
        score: hit['@score'] || ''
      }
    });
  }

  private parseAuthors(author: DBLPAuthor | DBLPAuthor[] | string | undefined): string[] {
    return this.asArray(author)
      .map(item => {
        if (typeof item === 'string') return item;
        return item.text || '';
      })
      .map(authorName => authorName.trim())
      .filter(Boolean);
  }

  private firstValue(value: string | string[] | undefined): string {
    if (Array.isArray(value)) return value[0] || '';
    return value || '';
  }

  private asArray<T>(value: T | T[] | undefined): T[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }
}

