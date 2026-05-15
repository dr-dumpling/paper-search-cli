import axios, { AxiosInstance } from 'axios';
import { Paper, PaperFactory } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';
import { downloadPdfFromUrl, safeFilename } from '../utils/PdfDownload.js';
import { PDFExtractor } from '../utils/PDFExtractor.js';

interface EuropePmcUrl {
  documentStyle?: string;
  url?: string;
}

interface EuropePmcItem {
  id?: string;
  source?: string;
  title?: string;
  abstractText?: string;
  doi?: string;
  doiId?: string;
  pubYear?: string;
  pubMonth?: string;
  pubDay?: string;
  authorList?: { author?: Array<{ fullName?: string }> | string[] };
  fullTextUrlList?: { fullTextUrl?: EuropePmcUrl[] | EuropePmcUrl };
  journalTitle?: string;
  journalISSN?: string;
  keywordList?: { keyword?: string[] | string };
  isOpenAccess?: string;
  openAccessLicence?: string;
  citedByCount?: number;
  pmid?: string;
  pmcid?: string;
}

export class EuropePMCSearcher extends PaperSource {
  private readonly client: AxiosInstance;

  constructor() {
    super('europepmc', 'https://www.ebi.ac.uk/europepmc/webservices/rest');
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
      citations: true,
      requiresApiKey: false,
      supportedOptions: ['maxResults', 'year']
    };
  }

  async search(query: string, options: SearchOptions = {}): Promise<Paper[]> {
    try {
      const response = await this.client.get('/search', {
        params: {
          query,
          pageSize: Math.min(options.maxResults || 10, 100),
          format: 'json',
          resultType: 'core',
          ...(options.year ? { year: options.year } : {})
        }
      });

      const results = response.data?.resultList?.result || [];
      return results.map((item: EuropePmcItem) => this.parseItem(item)).filter(Boolean) as Paper[];
    } catch (error) {
      this.handleHttpError(error, 'search');
    }
  }

  async downloadPdf(paperId: string, options: DownloadOptions = {}): Promise<string> {
    const details = await this.getDetails(paperId);
    const pdfUrl = details ? this.findPdfUrl(details) : '';
    if (!pdfUrl) {
      throw new Error(`Europe PMC paper ${paperId} does not expose an accessible PDF URL`);
    }
    return downloadPdfFromUrl(pdfUrl, options.savePath || './downloads', `europepmc_${safeFilename(paperId)}`);
  }

  async readPaper(paperId: string, options: DownloadOptions = {}): Promise<string> {
    const pdfPath = await this.downloadPdf(paperId, options);
    const result = await new PDFExtractor().extractFromFile(pdfPath);
    return result.text || `PDF downloaded to ${pdfPath}, but no text could be extracted.`;
  }

  private parseItem(item: EuropePmcItem): Paper | null {
    if (!item.id || !item.title) return null;

    const paperId = this.normalizeId(item);
    const doi = item.doi || item.doiId || '';
    const pdfUrl = this.findPdfUrl(item);
    const landingUrl = this.findLandingUrl(item, paperId, doi);
    const keywords = item.keywordList?.keyword;

    return PaperFactory.create({
      paperId,
      title: this.cleanText(item.title),
      authors: this.parseAuthors(item),
      abstract: item.abstractText || '',
      doi,
      publishedDate: this.parsePublicationDate(item),
      pdfUrl,
      url: landingUrl,
      source: 'europepmc',
      journal: item.journalTitle || '',
      keywords: Array.isArray(keywords) ? keywords : keywords ? [keywords] : [],
      citationCount: Number(item.citedByCount || 0),
      year: item.pubYear ? Number(item.pubYear) || undefined : undefined,
      extra: {
        issn: item.journalISSN || '',
        isOpenAccess: item.isOpenAccess === 'Y',
        openAccessLicence: item.openAccessLicence || '',
        pmid: item.pmid || '',
        pmcid: item.pmcid || ''
      }
    });
  }

  private async getDetails(paperId: string): Promise<EuropePmcItem | null> {
    const query = paperId.startsWith('PMID:')
      ? `ext_id:${paperId.replace('PMID:', '')} src:med`
      : paperId.startsWith('PMC')
        ? `ext_id:${paperId} src:pmc`
        : paperId.startsWith('10.')
          ? `doi:${paperId}`
          : `ext_id:${paperId}`;

    const response = await this.client.get('/search', {
      params: { query, format: 'json', resultType: 'core', pageSize: 1 }
    });
    return response.data?.resultList?.result?.[0] || null;
  }

  private normalizeId(item: EuropePmcItem): string {
    if (item.source === 'MED') return `PMID:${item.id}`;
    if (item.source === 'PMC') return item.id?.startsWith('PMC') ? item.id : `PMC${item.id}`;
    return item.id || item.doi || '';
  }

  private parseAuthors(item: EuropePmcItem): string[] {
    const authors = item.authorList?.author || [];
    if (!Array.isArray(authors)) return [];
    return authors
      .map(author => (typeof author === 'string' ? author : author.fullName || ''))
      .filter(Boolean);
  }

  private parsePublicationDate(item: EuropePmcItem): Date | null {
    if (!item.pubYear) return null;
    const month = String(item.pubMonth || '1').padStart(2, '0');
    const day = String(item.pubDay || '1').padStart(2, '0');
    return this.parseDate(`${item.pubYear}-${month}-${day}`);
  }

  private findPdfUrl(item: EuropePmcItem): string {
    const urls = item.fullTextUrlList?.fullTextUrl;
    const list = Array.isArray(urls) ? urls : urls ? [urls] : [];
    const direct = list.find(entry => entry.documentStyle === 'pdf' && entry.url)?.url || '';
    if (direct) return direct;
    const pmcid = item.pmcid || (item.source === 'PMC' ? item.id : '');
    return pmcid ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid.startsWith('PMC') ? pmcid : `PMC${pmcid}`}/pdf/` : '';
  }

  private findLandingUrl(item: EuropePmcItem, paperId: string, doi: string): string {
    const urls = item.fullTextUrlList?.fullTextUrl;
    const list = Array.isArray(urls) ? urls : urls ? [urls] : [];
    const html = list.find(entry => entry.documentStyle === 'html' && entry.url)?.url || '';
    if (html) return html;
    if (doi) return `https://doi.org/${doi}`;
    if (paperId.startsWith('PMID:')) return `https://pubmed.ncbi.nlm.nih.gov/${paperId.replace('PMID:', '')}/`;
    if (paperId.startsWith('PMC')) return `https://www.ncbi.nlm.nih.gov/pmc/articles/${paperId}/`;
    return '';
  }
}
