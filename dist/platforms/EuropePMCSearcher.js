import axios from 'axios';
import { PaperFactory } from '../models/Paper.js';
import { PaperSource } from './PaperSource.js';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';
import { downloadPdfFromUrl, safeFilename } from '../utils/PdfDownload.js';
import { PDFExtractor } from '../utils/PDFExtractor.js';
export class EuropePMCSearcher extends PaperSource {
    client;
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
    getCapabilities() {
        return {
            search: true,
            download: true,
            fullText: true,
            citations: true,
            requiresApiKey: false,
            supportedOptions: ['maxResults', 'year']
        };
    }
    async search(query, options = {}) {
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
            return results.map((item) => this.parseItem(item)).filter(Boolean);
        }
        catch (error) {
            this.handleHttpError(error, 'search');
        }
    }
    async downloadPdf(paperId, options = {}) {
        const details = await this.getDetails(paperId);
        const pdfUrls = details ? this.findPdfUrls(details) : [];
        if (pdfUrls.length === 0) {
            throw new Error(`Europe PMC paper ${paperId} does not expose an accessible PDF URL`);
        }
        const errors = [];
        for (const pdfUrl of pdfUrls) {
            try {
                return await downloadPdfFromUrl(pdfUrl, options.savePath || './downloads', `europepmc_${safeFilename(paperId)}`);
            }
            catch (error) {
                errors.push(`${pdfUrl}: ${error?.message || String(error)}`);
            }
        }
        throw new Error(`Europe PMC paper ${paperId} PDF candidates failed. ${errors.join(' | ')}`);
    }
    async readPaper(paperId, options = {}) {
        const pdfPath = await this.downloadPdf(paperId, options);
        const result = await new PDFExtractor().extractFromFile(pdfPath);
        return result.text || `PDF downloaded to ${pdfPath}, but no text could be extracted.`;
    }
    parseItem(item) {
        if (!item.id || !item.title)
            return null;
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
    async getDetails(paperId) {
        const query = paperId.startsWith('PMID:')
            ? `ext_id:${paperId.replace('PMID:', '')} src:med`
            : paperId.startsWith('PMC')
                ? paperId
                : paperId.startsWith('10.')
                    ? `doi:${paperId}`
                    : `ext_id:${paperId}`;
        const response = await this.client.get('/search', {
            params: { query, format: 'json', resultType: 'core', pageSize: 1 }
        });
        return response.data?.resultList?.result?.[0] || null;
    }
    normalizeId(item) {
        if (item.source === 'MED')
            return `PMID:${item.id}`;
        if (item.source === 'PMC')
            return item.id?.startsWith('PMC') ? item.id : `PMC${item.id}`;
        return item.id || item.doi || '';
    }
    parseAuthors(item) {
        const authors = item.authorList?.author || [];
        if (!Array.isArray(authors))
            return [];
        return authors
            .map(author => (typeof author === 'string' ? author : author.fullName || ''))
            .filter(Boolean);
    }
    parsePublicationDate(item) {
        if (!item.pubYear)
            return null;
        const month = String(item.pubMonth || '1').padStart(2, '0');
        const day = String(item.pubDay || '1').padStart(2, '0');
        return this.parseDate(`${item.pubYear}-${month}-${day}`);
    }
    findPdfUrl(item) {
        return this.findPdfUrls(item)[0] || '';
    }
    findPdfUrls(item) {
        const urls = item.fullTextUrlList?.fullTextUrl;
        const list = Array.isArray(urls) ? urls : urls ? [urls] : [];
        const pdfs = list.filter(entry => String(entry.documentStyle || '').toLowerCase() === 'pdf' && entry.url);
        const direct = pdfs
            .map(entry => entry.url || '')
            .filter(url => url && !this.isEuropePmcRenderUrl(url) && !url.startsWith('ftp://'));
        const render = pdfs
            .map(entry => entry.url || '')
            .filter(url => this.isEuropePmcRenderUrl(url));
        const pmcid = item.pmcid || (item.source === 'PMC' ? item.id : '');
        const ncbiRender = pmcid
            ? [`https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid.startsWith('PMC') ? pmcid : `PMC${pmcid}`}/pdf/`]
            : [];
        return [...direct, ...render, ...ncbiRender].filter((url, index, urls) => url && urls.indexOf(url) === index);
    }
    isEuropePmcRenderUrl(url) {
        return /europepmc\.org\/articles\/[^?]+\?pdf=render/i.test(url);
    }
    findLandingUrl(item, paperId, doi) {
        const urls = item.fullTextUrlList?.fullTextUrl;
        const list = Array.isArray(urls) ? urls : urls ? [urls] : [];
        const html = list.find(entry => entry.documentStyle === 'html' && entry.url)?.url || '';
        if (html)
            return html;
        if (doi)
            return `https://doi.org/${doi}`;
        if (paperId.startsWith('PMID:'))
            return `https://pubmed.ncbi.nlm.nih.gov/${paperId.replace('PMID:', '')}/`;
        if (paperId.startsWith('PMC'))
            return `https://www.ncbi.nlm.nih.gov/pmc/articles/${paperId}/`;
        return '';
    }
}
//# sourceMappingURL=EuropePMCSearcher.js.map