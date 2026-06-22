import axios from 'axios';
import { PaperFactory } from '../models/Paper.js';
import { PaperSource } from './PaperSource.js';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';
import { ErrorHandler } from '../infrastructure/http/ErrorHandler.js';
export class DBLPSearcher extends PaperSource {
    client;
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
    getCapabilities() {
        return {
            search: true,
            download: false,
            fullText: false,
            citations: false,
            requiresApiKey: false,
            supportedOptions: ['maxResults', 'year', 'author', 'journal', 'sortBy', 'sortOrder']
        };
    }
    async search(query, options = {}) {
        try {
            const params = {
                q: this.buildQuery(query, options),
                format: 'json',
                h: Math.min(options.maxResults || 10, 1000),
                c: 0
            };
            const response = await ErrorHandler.retryWithBackoff(() => this.client.get('', { params }), { context: 'DBLP search' });
            const hits = this.asArray(response.data?.result?.hits?.hit);
            return hits.map(hit => this.parseHit(hit)).filter((paper) => Boolean(paper));
        }
        catch (error) {
            this.handleHttpError(error, 'search');
        }
    }
    async downloadPdf(_paperId, _options = {}) {
        throw new Error('DBLP does not host PDFs directly. Use DOI or publisher URLs for download fallbacks.');
    }
    async readPaper(_paperId, _options = {}) {
        throw new Error('DBLP provides bibliographic metadata only; it does not provide full text.');
    }
    buildQuery(query, options) {
        const parts = [query.trim()];
        if (options.author)
            parts.push(`author:${options.author.trim()}`);
        if (options.journal)
            parts.push(options.journal.trim());
        if (options.venue)
            parts.push(options.venue.trim());
        if (options.year && /^\d{4}$/.test(options.year.trim()))
            parts.push(options.year.trim());
        return parts.filter(Boolean).join(' ');
    }
    parseHit(hit) {
        const info = hit.info;
        if (!info?.title)
            return null;
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
    parseAuthors(author) {
        return this.asArray(author)
            .map(item => {
            if (typeof item === 'string')
                return item;
            return item.text || '';
        })
            .map(authorName => authorName.trim())
            .filter(Boolean);
    }
    firstValue(value) {
        if (Array.isArray(value))
            return value[0] || '';
        return value || '';
    }
    asArray(value) {
        if (!value)
            return [];
        return Array.isArray(value) ? value : [value];
    }
}
//# sourceMappingURL=DBLPSearcher.js.map