import axios, { AxiosInstance } from 'axios';
import { Paper, PaperFactory } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';
import { downloadPdfFromUrl, safeFilename } from '../utils/PdfDownload.js';
import { PDFExtractor } from '../utils/PDFExtractor.js';

interface CoreWork {
  id?: string | number;
  title?: string;
  authors?: Array<{ name?: string }> | string[];
  abstract?: string;
  doi?: string;
  publishedDate?: string;
  yearPublished?: number;
  url?: string;
  downloadUrl?: string;
  fullTextUrls?: string[];
  fullText?: string;
  subjects?: Array<{ name?: string }> | string[];
  tags?: Array<{ name?: string }> | string[];
  repository?: { name?: string };
  language?: string;
  citationCount?: number;
  downloadCount?: number;
}

export class CORESearcher extends PaperSource {
  private readonly client: AxiosInstance;

  constructor(apiKey?: string) {
    const configuredKey = apiKey || process.env.PAPER_SEARCH_CORE_API_KEY || process.env.CORE_API_KEY || '';
    super('core', 'https://api.core.ac.uk/v3', configuredKey);
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: TIMEOUTS.DEFAULT,
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
        ...(configuredKey ? { Authorization: `Bearer ${configuredKey}` } : {})
      },
      validateStatus: status => status < 500 || [500, 502, 503, 504].includes(status)
    });
  }

  getCapabilities(): PlatformCapabilities {
    return {
      search: true,
      download: true,
      fullText: true,
      citations: true,
      requiresApiKey: false,
      supportedOptions: ['maxResults', 'year']
    };
  }

  async search(query: string, options: SearchOptions = {}): Promise<Paper[]> {
    try {
      const response = await this.requestWithRetry('/search/works', {
        q: query,
        limit: Math.min(options.maxResults || 10, 100),
        offset: 0,
        ...(options.year ? { year: options.year } : {})
      });
      const results = Array.isArray(response?.results) ? response.results : [];
      return results.map((item: CoreWork) => this.parseWork(item)).filter(Boolean) as Paper[];
    } catch (error) {
      this.handleHttpError(error, 'search');
    }
  }

  async downloadPdf(paperId: string, options: DownloadOptions = {}): Promise<string> {
    const details = await this.getDetails(paperId);
    const pdfUrl = details ? this.findPdfUrl(details) : '';
    if (!pdfUrl) {
      throw new Error(`CORE paper ${paperId} does not expose an accessible PDF URL`);
    }
    return downloadPdfFromUrl(pdfUrl, options.savePath || './downloads', `core_${safeFilename(paperId)}`);
  }

  async readPaper(paperId: string, options: DownloadOptions = {}): Promise<string> {
    const details = await this.getDetails(paperId);
    if (details?.fullText && details.fullText.length > 500) {
      return details.fullText;
    }

    const pdfPath = await this.downloadPdf(paperId, options);
    const result = await new PDFExtractor().extractFromFile(pdfPath);
    return result.text || `PDF downloaded to ${pdfPath}, but no text could be extracted.`;
  }

  private async getDetails(paperId: string): Promise<CoreWork | null> {
    try {
      const response = await this.client.get(`/works/${encodeURIComponent(paperId)}`);
      if (response.status >= 400) return null;
      return response.data as CoreWork;
    } catch {
      return null;
    }
  }

  private async requestWithRetry(path: string, params: Record<string, unknown>): Promise<any> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await this.client.get(path, { params });
        if ([401, 403, 429].includes(response.status) && !this.apiKey) {
          return { results: [] };
        }
        if ([429, 500, 502, 503, 504].includes(response.status)) {
          await new Promise(resolve => setTimeout(resolve, Math.min(8000, 1000 * 2 ** attempt)));
          continue;
        }
        if ([401, 403].includes(response.status) && this.apiKey) {
          const fallback = await axios.get(`${this.baseUrl}${path}`, {
            params,
            timeout: TIMEOUTS.DEFAULT,
            headers: { Accept: 'application/json', 'User-Agent': USER_AGENT }
          });
          return fallback.data;
        }
        if (response.status >= 400) {
          throw new Error(`CORE request failed with HTTP ${response.status}`);
        }
        return response.data;
      } catch (error) {
        lastError = error;
        await new Promise(resolve => setTimeout(resolve, Math.min(8000, 1000 * 2 ** attempt)));
      }
    }
    throw lastError instanceof Error ? lastError : new Error('CORE request failed');
  }

  private parseWork(item: CoreWork): Paper | null {
    if (!item.id || !item.title) return null;
    const categories = this.nameList(item.subjects);
    const keywords = this.nameList(item.tags);
    const pdfUrl = this.findPdfUrl(item);

    return PaperFactory.create({
      paperId: String(item.id),
      title: this.cleanText(item.title),
      authors: this.nameList(item.authors),
      abstract: item.abstract || '',
      doi: item.doi || '',
      publishedDate: item.publishedDate ? this.parseDate(item.publishedDate) : null,
      pdfUrl,
      url: item.url || (item.doi ? `https://doi.org/${item.doi}` : ''),
      source: 'core',
      categories: categories.slice(0, 10),
      keywords: keywords.slice(0, 10),
      citationCount: Number(item.citationCount || 0),
      year: item.yearPublished,
      extra: {
        repository: item.repository?.name || '',
        language: item.language || '',
        downloadCount: item.downloadCount || 0
      }
    });
  }

  private findPdfUrl(item: CoreWork): string {
    if (item.downloadUrl?.toLowerCase().includes('pdf')) return item.downloadUrl;
    return (item.fullTextUrls || []).find(url => url.toLowerCase().includes('pdf')) || '';
  }

  private nameList(values?: Array<{ name?: string }> | string[]): string[] {
    if (!Array.isArray(values)) return [];
    return values
      .map(value => (typeof value === 'string' ? value : value.name || ''))
      .filter(Boolean);
  }
}
