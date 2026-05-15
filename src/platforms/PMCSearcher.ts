import axios, { AxiosInstance } from 'axios';
import { Paper, PaperFactory } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';
import { downloadPdfFromUrl } from '../utils/PdfDownload.js';
import { PDFExtractor } from '../utils/PDFExtractor.js';

interface PmcSummary {
  uid?: string;
  title?: string;
  fulljournalname?: string;
  source?: string;
  pubdate?: string;
  authors?: Array<{ name?: string }>;
  articleids?: Array<{ idtype?: string; value?: string }>;
}

export class PMCSearcher extends PaperSource {
  private readonly client: AxiosInstance;
  private readonly tool = process.env.NCBI_TOOL || 'paper-search-cli';
  private readonly email = process.env.NCBI_EMAIL || process.env.CROSSREF_MAILTO || 'paper-search-cli@example.com';

  constructor() {
    super('pmc', 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils');
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
      download: true,
      fullText: true,
      citations: false,
      requiresApiKey: false,
      supportedOptions: ['maxResults', 'year']
    };
  }

  async search(query: string, options: SearchOptions = {}): Promise<Paper[]> {
    try {
      const term = options.year ? `${query} AND ${options.year}[pdat]` : query;
      const searchResponse = await this.client.get('/esearch.fcgi', {
        params: {
          db: 'pmc',
          term,
          retmax: options.maxResults || 10,
          retmode: 'json',
          tool: this.tool,
          email: this.email
        }
      });
      const ids: string[] = searchResponse.data?.esearchresult?.idlist || [];
      if (ids.length === 0) return [];

      const summaryResponse = await this.client.get('/esummary.fcgi', {
        params: {
          db: 'pmc',
          id: ids.join(','),
          retmode: 'json',
          tool: this.tool,
          email: this.email
        }
      });

      const result = summaryResponse.data?.result || {};
      return ids.map(id => this.parseSummary(result[id])).filter(Boolean) as Paper[];
    } catch (error) {
      this.handleHttpError(error, 'search');
    }
  }

  async downloadPdf(paperId: string, options: DownloadOptions = {}): Promise<string> {
    const pmcid = this.normalizePmcId(paperId);
    const url = `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/pdf/`;
    return downloadPdfFromUrl(url, options.savePath || './downloads', pmcid);
  }

  async readPaper(paperId: string, options: DownloadOptions = {}): Promise<string> {
    const pdfPath = await this.downloadPdf(paperId, options);
    const result = await new PDFExtractor().extractFromFile(pdfPath);
    return result.text || `PDF downloaded to ${pdfPath}, but no text could be extracted.`;
  }

  private parseSummary(item?: PmcSummary): Paper | null {
    if (!item?.uid || !item.title) return null;

    const pmcid = this.findArticleId(item, 'pmc') || this.findArticleId(item, 'pmcid') || `PMC${item.uid}`;
    const normalizedPmcid = this.normalizePmcId(pmcid);
    const doi = this.findArticleId(item, 'doi');
    const journal = item.fulljournalname || item.source || '';

    return PaperFactory.create({
      paperId: normalizedPmcid,
      title: this.cleanText(item.title),
      authors: (item.authors || []).map(author => author.name || '').filter(Boolean),
      abstract: '',
      doi,
      publishedDate: item.pubdate ? this.parseDate(item.pubdate) : null,
      pdfUrl: `https://www.ncbi.nlm.nih.gov/pmc/articles/${normalizedPmcid}/pdf/`,
      url: `https://www.ncbi.nlm.nih.gov/pmc/articles/${normalizedPmcid}/`,
      source: 'pmc',
      journal,
      categories: journal ? [journal] : []
    });
  }

  private findArticleId(item: PmcSummary, idType: string): string {
    const article = (item.articleids || []).find(id => id.idtype?.toLowerCase() === idType.toLowerCase());
    return article?.value || '';
  }

  private normalizePmcId(value: string): string {
    const cleaned = value.replace(/^PMCID:/i, '').trim();
    return cleaned.toUpperCase().startsWith('PMC') ? cleaned : `PMC${cleaned}`;
  }
}
