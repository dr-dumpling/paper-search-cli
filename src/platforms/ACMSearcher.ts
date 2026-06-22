import axios, { AxiosInstance } from 'axios';
import { Paper, PaperFactory } from '../models/Paper.js';
import { DownloadOptions, PaperSource, PlatformCapabilities, SearchOptions } from './PaperSource.js';
import { DEFAULT_MAILTO, TIMEOUTS, USER_AGENT } from '../config/constants.js';
import { ErrorHandler } from '../infrastructure/http/ErrorHandler.js';

interface CrossrefResponse {
  message?: {
    items?: CrossrefItem[];
  };
}

interface CrossrefItem {
  DOI?: string;
  title?: string[];
  author?: Array<{ given?: string; family?: string }>;
  abstract?: string;
  URL?: string;
  publisher?: string;
  type?: string;
  page?: string;
  volume?: string;
  issue?: string;
  subject?: string[];
  'container-title'?: string[];
  'is-referenced-by-count'?: number;
  'published-print'?: CrossrefDate;
  'published-online'?: CrossrefDate;
  published?: CrossrefDate;
  created?: CrossrefDate;
}

interface CrossrefDate {
  'date-parts'?: number[][];
}

export class ACMSearcher extends PaperSource {
  private readonly client: AxiosInstance;
  private readonly mailto: string;

  constructor(mailto?: string) {
    super('acm', 'https://api.crossref.org/works');
    this.mailto = mailto || process.env.CROSSREF_MAILTO || DEFAULT_MAILTO;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: TIMEOUTS.DEFAULT,
      headers: {
        Accept: 'application/json',
        'User-Agent': `${USER_AGENT} (mailto:${this.mailto})`
      }
    });
  }

  getCapabilities(): PlatformCapabilities {
    return {
      search: true,
      download: false,
      fullText: false,
      citations: true,
      requiresApiKey: false,
      supportedOptions: ['maxResults', 'year', 'author', 'sortBy', 'sortOrder']
    };
  }

  async search(query: string, options: SearchOptions = {}): Promise<Paper[]> {
    try {
      const params: Record<string, unknown> = {
        query,
        rows: Math.min(Math.max((options.maxResults || 10) * 3, 20), 100),
        filter: this.buildFilter(options),
        mailto: this.mailto,
        sort: this.mapSort(options.sortBy),
        order: options.sortOrder === 'asc' ? 'asc' : 'desc'
      };

      const response = await ErrorHandler.retryWithBackoff(
        () => this.client.get<CrossrefResponse>('', { params }),
        { context: 'ACM Crossref metadata search' }
      );

      const maxResults = options.maxResults || 10;
      return (response.data.message?.items || [])
        .map(item => this.parseItem(item))
        .filter((paper): paper is Paper => Boolean(paper))
        .slice(0, maxResults);
    } catch (error) {
      this.handleHttpError(error, 'search');
    }
  }

  async downloadPdf(_paperId: string, _options: DownloadOptions = {}): Promise<string> {
    throw new Error('ACM metadata search does not support direct PDF download.');
  }

  async readPaper(_paperId: string, _options: DownloadOptions = {}): Promise<string> {
    throw new Error('ACM metadata search does not provide full text.');
  }

  private buildFilter(options: SearchOptions): string {
    const filters = ['prefix:10.1145'];
    if (options.year) {
      const match = options.year.match(/^(\d{4})(?:-(\d{4})?)?$/);
      if (match) {
        filters.push(`from-pub-date:${match[1]}`);
        filters.push(`until-pub-date:${match[2] || match[1]}`);
      }
    }
    return filters.join(',');
  }

  private mapSort(sortBy: SearchOptions['sortBy']): string {
    if (sortBy === 'date') return 'published';
    if (sortBy === 'citations') return 'is-referenced-by-count';
    return 'relevance';
  }

  private parseItem(item: CrossrefItem): Paper | null {
    const doi = item.DOI || '';
    const title = item.title?.[0] || '';
    if (!doi || !title) return null;

    const { publishedDate, year } = this.parsePublishedDate(item);
    const acmUrl = `https://dl.acm.org/doi/${doi}`;

    return PaperFactory.create({
      paperId: doi,
      title: this.cleanText(title),
      authors: (item.author || [])
        .map(author => `${author.given || ''} ${author.family || ''}`.trim())
        .filter(Boolean),
      abstract: this.cleanText((item.abstract || '').replace(/<[^>]+>/g, '')),
      doi,
      publishedDate,
      pdfUrl: '',
      url: acmUrl,
      source: 'acm',
      journal: item['container-title']?.[0] || undefined,
      volume: item.volume || undefined,
      issue: item.issue || undefined,
      pages: item.page || undefined,
      year,
      citationCount: item['is-referenced-by-count'] || 0,
      categories: item.subject || [],
      extra: {
        crossrefUrl: item.URL || '',
        publisher: item.publisher || '',
        type: item.type || '',
        accessMode: 'crossref-acm-doi-prefix'
      }
    });
  }

  private parsePublishedDate(item: CrossrefItem): { publishedDate: Date | null; year?: number } {
    const date =
      item['published-print'] ||
      item['published-online'] ||
      item.published ||
      item.created;
    const parts = date?.['date-parts']?.[0] || [];
    const year = typeof parts[0] === 'number' ? parts[0] : undefined;
    if (!year) return { publishedDate: null };
    return {
      year,
      publishedDate: new Date(year, (parts[1] || 1) - 1, parts[2] || 1)
    };
  }
}

