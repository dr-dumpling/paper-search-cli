import axios from 'axios';
import { PaperFactory } from '../models/Paper.js';
import { PaperSource } from './PaperSource.js';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';
import { downloadPdfFromUrl, safeFilename } from '../utils/PdfDownload.js';
import { PDFExtractor } from '../utils/PDFExtractor.js';
export class PMCSearcher extends PaperSource {
    client;
    tool = process.env.NCBI_TOOL || 'paper-search-cli';
    email = process.env.NCBI_EMAIL || process.env.CROSSREF_MAILTO || 'paper-search-cli@example.com';
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
    getCapabilities() {
        return {
            search: true,
            download: true,
            fullText: true,
            citations: false,
            requiresApiKey: false,
            supportedOptions: ['maxResults', 'year']
        };
    }
    async search(query, options = {}) {
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
            const ids = searchResponse.data?.esearchresult?.idlist || [];
            if (ids.length === 0)
                return [];
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
            return ids.map(id => this.parseSummary(result[id])).filter(Boolean);
        }
        catch (error) {
            this.handleHttpError(error, 'search');
        }
    }
    async downloadPdf(paperId, options = {}) {
        const pmcid = this.normalizePmcId(paperId);
        const pdfUrls = await this.resolvePdfUrls(pmcid);
        if (pdfUrls.length === 0) {
            throw new Error(`PMC paper ${pmcid} does not expose a direct downloadable PDF URL. Some PMC viewer PDFs require browser proof-of-work; try Europe PMC, CORE, Unpaywall, or download_with_fallback.`);
        }
        const errors = [];
        for (const pdfUrl of pdfUrls) {
            try {
                return await downloadPdfFromUrl(pdfUrl, options.savePath || './downloads', `pmc_${safeFilename(pmcid)}`);
            }
            catch (error) {
                errors.push(`${pdfUrl}: ${error?.message || String(error)}`);
            }
        }
        throw new Error(`PMC paper ${pmcid} PDF candidates failed. ${errors.join(' | ')}`);
    }
    async readPaper(paperId, options = {}) {
        const pdfPath = await this.downloadPdf(paperId, options);
        const result = await new PDFExtractor().extractFromFile(pdfPath);
        return result.text || `PDF downloaded to ${pdfPath}, but no text could be extracted.`;
    }
    parseSummary(item) {
        if (!item?.uid || !item.title)
            return null;
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
    findArticleId(item, idType) {
        const article = (item.articleids || []).find(id => id.idtype?.toLowerCase() === idType.toLowerCase());
        return article?.value || '';
    }
    async resolvePdfUrls(pmcid) {
        return [
            ...await this.resolveViaEuropePmc(pmcid),
            ...await this.resolveViaPmcOa(pmcid)
        ].filter((url, index, urls) => url && urls.indexOf(url) === index);
    }
    async resolveViaEuropePmc(pmcid) {
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
            const direct = list.filter((entry) => (String(entry?.documentStyle || '').toLowerCase() === 'pdf' &&
                entry?.url &&
                !this.isEuropePmcRenderUrl(entry.url) &&
                !String(entry.url).startsWith('ftp://'))).map((entry) => entry.url);
            const render = list.filter((entry) => (String(entry?.documentStyle || '').toLowerCase() === 'pdf' &&
                entry?.url &&
                this.isEuropePmcRenderUrl(entry.url))).map((entry) => entry.url);
            return [...direct, ...render];
        }
        catch {
            return [];
        }
    }
    async resolveViaPmcOa(pmcid) {
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
        }
        catch {
            return [];
        }
    }
    isEuropePmcRenderUrl(url) {
        return /europepmc\.org\/articles\/[^?]+\?pdf=render/i.test(url);
    }
    normalizePmcId(value) {
        const cleaned = value.replace(/^PMCID:/i, '').trim();
        return cleaned.toUpperCase().startsWith('PMC') ? cleaned : `PMC${cleaned}`;
    }
}
//# sourceMappingURL=PMCSearcher.js.map