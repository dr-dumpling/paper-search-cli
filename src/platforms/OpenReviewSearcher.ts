import axios, { AxiosInstance } from 'axios';
import { Paper, PaperFactory } from '../models/Paper.js';
import { DownloadOptions, PaperSource, PlatformCapabilities, SearchOptions } from './PaperSource.js';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';
import { ErrorHandler } from '../infrastructure/http/ErrorHandler.js';

interface OpenReviewSearchResponse {
  notes?: OpenReviewNote[];
  count?: number;
}

interface OpenReviewNote {
  id?: string;
  forum?: string;
  invitation?: string;
  invitations?: string[];
  domain?: string;
  cdate?: number;
  pdate?: number;
  tcdate?: number;
  tmdate?: number;
  signatures?: string[];
  content?: Record<string, unknown>;
}

export class OpenReviewSearcher extends PaperSource {
  private readonly client: AxiosInstance;

  constructor() {
    super('openreview', 'https://api.openreview.net');
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
      supportedOptions: ['maxResults', 'year', 'author', 'journal', 'venue']
    };
  }

  async search(query: string, options: SearchOptions = {}): Promise<Paper[]> {
    try {
      const params: Record<string, unknown> = {
        term: query,
        limit: Math.min(options.maxResults || 10, 100)
      };

      const response = await ErrorHandler.retryWithBackoff(
        () => this.client.get<OpenReviewSearchResponse>('/notes/search', { params }),
        { context: 'OpenReview note search' }
      );

      return (response.data.notes || [])
        .map(note => this.parseNote(note))
        .filter((paper): paper is Paper => Boolean(paper))
        .filter(paper => this.matchesOptions(paper, options))
        .slice(0, options.maxResults || 10);
    } catch (error) {
      this.handleHttpError(error, 'search');
    }
  }

  async downloadPdf(_paperId: string, _options: DownloadOptions = {}): Promise<string> {
    throw new Error('OpenReview search returns PDF URLs but does not download files directly.');
  }

  async readPaper(_paperId: string, _options: DownloadOptions = {}): Promise<string> {
    throw new Error('OpenReview full-text parsing is not supported by this searcher.');
  }

  private parseNote(note: OpenReviewNote): Paper | null {
    const content = note.content || {};
    const title = this.asString(this.contentValue(content, 'title'));
    if (!title) return null;

    const authors = this.asStringArray(this.contentValue(content, 'authors'));
    const authorIds = this.asStringArray(this.contentValue(content, 'authorids'));
    const abstract = this.asString(this.contentValue(content, 'abstract'));
    const venue = this.asString(this.contentValue(content, 'venue')) || this.asString(this.contentValue(content, 'venueid'));
    const pdfValue = this.asString(this.contentValue(content, 'pdf'));
    const htmlValue = this.asString(this.contentValue(content, 'html'));
    const doi = this.extractDoi(htmlValue) || this.extractDoi(this.asString(this.contentValue(content, 'doi')));
    const timestamp = note.pdate || note.cdate || note.tcdate || note.tmdate;
    const publishedDate = timestamp ? new Date(timestamp) : null;
    const year = publishedDate?.getFullYear();
    const url = note.forum || note.id ? `https://openreview.net/forum?id=${note.forum || note.id}` : htmlValue;

    return PaperFactory.create({
      paperId: note.id || note.forum || title,
      title: this.cleanText(title),
      authors,
      abstract: this.cleanText(abstract),
      doi,
      publishedDate,
      pdfUrl: this.resolveOpenReviewUrl(pdfValue),
      url,
      source: 'openreview',
      journal: venue || undefined,
      year,
      extra: {
        forum: note.forum || '',
        invitation: note.invitation || note.invitations?.[0] || '',
        domain: note.domain || '',
        signatures: note.signatures || [],
        authorIds,
        html: htmlValue
      }
    });
  }

  private matchesOptions(paper: Paper, options: SearchOptions): boolean {
    if (options.year && paper.year && !this.yearMatches(paper.year, options.year)) return false;
    if (options.author && !paper.authors.some(author => author.toLowerCase().includes(options.author!.toLowerCase()))) return false;
    const venue = options.venue || options.journal;
    if (venue && !(paper.journal || '').toLowerCase().includes(venue.toLowerCase())) return false;
    return true;
  }

  private yearMatches(year: number, filter: string): boolean {
    const match = filter.match(/^(\d{4})(?:-(\d{4})?)?$/);
    if (!match) return true;
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    return year >= start && year <= end;
  }

  private contentValue(content: Record<string, unknown>, key: string): unknown {
    const value = content[key];
    if (value && typeof value === 'object' && !Array.isArray(value) && 'value' in value) {
      return (value as { value?: unknown }).value;
    }
    return value;
  }

  private asString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    return '';
  }

  private asStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map(item => this.asString(item)).filter(Boolean);
    }
    const single = this.asString(value);
    return single ? [single] : [];
  }

  private resolveOpenReviewUrl(value: string): string {
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    return `https://openreview.net${value.startsWith('/') ? value : `/${value}`}`;
  }

  private extractDoi(value: string): string {
    const match = value.match(/10\.\d{4,9}\/[^\s"'<>]+/i);
    return match ? match[0].replace(/[).,;]+$/, '') : '';
  }
}
