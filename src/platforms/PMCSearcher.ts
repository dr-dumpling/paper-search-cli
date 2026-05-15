import axios, { AxiosInstance } from 'axios';
import { Paper, PaperFactory } from '../models/Paper.js';
import { PaperSource, SearchOptions, DownloadOptions, PlatformCapabilities } from './PaperSource.js';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';
import { downloadPdfFromUrl, safeFilename } from '../utils/PdfDownload.js';
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
    const pdfUrls = await this.resolvePdfUrls(pmcid);
    if (pdfUrls.length === 0) {
      throw new Error(
        `PMC paper ${pmcid} does not expose a direct downloadable PDF URL. Some PMC viewer PDFs require browser proof-of-work; try Europe PMC, CORE, Unpaywall, or download_with_fallback.`
      );
    }

    const errors: string[] = [];
    for (const pdfUrl of pdfUrls) {
      try {
        return await downloadPdfFromUrl(pdfUrl, options.savePath || './downloads', `pmc_${safeFilename(pmcid)}`);
      } catch (error: any) {
        errors.push(`${pdfUrl}: ${error?.message || String(error)}`);
      }
    }

    throw new Error(`PMC paper ${pmcid} PDF candidates failed. ${errors.join(' | ')}`);
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

  private async resolvePdfUrls(pmcid: string): Promise<string[]> {
    return [
      ...await this.resolveViaEuropePmc(pmcid),
      ...await this.resolveViaPmcOa(pmcid)
    ].filter((url, index, urls) => url && urls.indexOf(url) === index);
  }

  private async resolveViaEuropePmc(pmcid: string): Promise<string[]> {
    try {
      const response = await axios.get('https://www.ebi.ac.uk/europepmc/webservices/rest/search', {
        params: {
          query: pmcid,
          format: 'json',
          resultType: 'core',
          pageSize: 1
        },
        timeout: TIMEOUTS.DEFAULT,
        headers: {
          Accept: 'application/json',
          'User-Agent': USER_AGENT
        }
      });

      const item = response.data?.resultList?.result?.[0];
      const urls = item?.fullTextUrlList?.fullTextUrl;
      const list = Array.isArray(urls) ? urls : urls ? [urls] : [];
      const direct = list.filter((entry: any) => (
        String(entry?.documentStyle || '').toLowerCase() === 'pdf' &&
        entry?.url &&
        !this.isEuropePmcRenderUrl(entry.url) &&
        !String(entry.url).startsWith('ftp://')
      )).map((entry: any) => entry.url);
      const render = list.filter((entry: any) => (
        String(entry?.documentStyle || '').toLowerCase() === 'pdf' &&
        entry?.url &&
        this.isEuropePmcRenderUrl(entry.url)
      )).map((entry: any) => entry.url);

      return [...direct, ...render];
    } catch {
      return [];
    }
  }

  private async resolveViaPmcOa(pmcid: string): Promise<string[]> {
    try {
      const response = await axios.get('https://www.ncbi.nlm.nih.gov/pmc/utils/oa/oa.fcgi', {
        params: { id: pmcid },
        timeout: TIMEOUTS.DEFAULT,
        headers: {
          Accept: 'application/xml,text/xml,*/*',
          'User-Agent': USER_AGENT
        },
        responseType: 'text'
      });
      const xml = String(response.data || '');
      const matches = Array.from(xml.matchAll(/<link\b(?=[^>]*\bformat=["']pdf["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/gi));
      return matches
        .map(match => match[1] || '')
        .filter(href => href && !href.startsWith('ftp://'));
    } catch {
      return [];
    }
  }

  private isEuropePmcRenderUrl(url: string): boolean {
    return /europepmc\.org\/articles\/[^?]+\?pdf=render/i.test(url);
  }

  private normalizePmcId(value: string): string {
    const cleaned = value.replace(/^PMCID:/i, '').trim();
    return cleaned.toUpperCase().startsWith('PMC') ? cleaned : `PMC${cleaned}`;
  }
}
