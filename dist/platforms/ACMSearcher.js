import axios from 'axios';
import { PaperFactory } from '../models/Paper.js';
import { PaperSource } from './PaperSource.js';
import { DEFAULT_MAILTO, TIMEOUTS, USER_AGENT } from '../config/constants.js';
import { ErrorHandler } from '../infrastructure/http/ErrorHandler.js';
export class ACMSearcher extends PaperSource {
    client;
    mailto;
    constructor(mailto) {
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
    getCapabilities() {
        return {
            search: true,
            download: false,
            fullText: false,
            citations: true,
            requiresApiKey: false,
            supportedOptions: ['maxResults', 'year', 'author', 'sortBy', 'sortOrder']
        };
    }
    async search(query, options = {}) {
        try {
            const params = {
                query,
                rows: Math.min(Math.max((options.maxResults || 10) * 3, 20), 100),
                filter: this.buildFilter(options),
                mailto: this.mailto,
                sort: this.mapSort(options.sortBy),
                order: options.sortOrder === 'asc' ? 'asc' : 'desc'
            };
            const response = await ErrorHandler.retryWithBackoff(() => this.client.get('', { params }), { context: 'ACM Crossref metadata search' });
            const maxResults = options.maxResults || 10;
            return (response.data.message?.items || [])
                .map(item => this.parseItem(item))
                .filter((paper) => Boolean(paper))
                .slice(0, maxResults);
        }
        catch (error) {
            this.handleHttpError(error, 'search');
        }
    }
    async downloadPdf(_paperId, _options = {}) {
        throw new Error('ACM metadata search does not support direct PDF download.');
    }
    async readPaper(_paperId, _options = {}) {
        throw new Error('ACM metadata search does not provide full text.');
    }
    buildFilter(options) {
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
    mapSort(sortBy) {
        if (sortBy === 'date')
            return 'published';
        if (sortBy === 'citations')
            return 'is-referenced-by-count';
        return 'relevance';
    }
    parseItem(item) {
        const doi = item.DOI || '';
        const title = item.title?.[0] || '';
        if (!doi || !title)
            return null;
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
    parsePublishedDate(item) {
        const date = item['published-print'] ||
            item['published-online'] ||
            item.published ||
            item.created;
        const parts = date?.['date-parts']?.[0] || [];
        const year = typeof parts[0] === 'number' ? parts[0] : undefined;
        if (!year)
            return { publishedDate: null };
        return {
            year,
            publishedDate: new Date(year, (parts[1] || 1) - 1, parts[2] || 1)
        };
    }
}
//# sourceMappingURL=ACMSearcher.js.map