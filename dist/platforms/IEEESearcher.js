import axios from 'axios';
import { PaperFactory } from '../models/Paper.js';
import { PaperSource } from './PaperSource.js';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';
import { ErrorHandler } from '../infrastructure/http/ErrorHandler.js';
export class IEEESearcher extends PaperSource {
    client;
    constructor(apiKey) {
        super('ieee', 'https://ieeexploreapi.ieee.org/api/v1/search/articles', apiKey);
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
            citations: true,
            requiresApiKey: true,
            supportedOptions: ['maxResults', 'year', 'author', 'journal', 'sortBy', 'sortOrder', 'articleTitle', 'startRecord']
        };
    }
    async search(query, options = {}) {
        if (!this.apiKey) {
            throw new Error('IEEE API key is required. Please set IEEE_API_KEY environment variable.');
        }
        try {
            const params = {
                apikey: this.apiKey,
                format: 'json',
                querytext: query,
                max_records: Math.min(options.maxResults || 10, 200),
                start_record: options.startRecord || 1
            };
            if (options.articleTitle)
                params.article_title = options.articleTitle;
            if (options.author)
                params.author = options.author;
            if (options.journal)
                params.publication_title = options.journal;
            if (options.year && /^\d{4}$/.test(options.year.trim()))
                params.publication_year = options.year.trim();
            if (options.sortBy) {
                params.sort_field = this.mapSortField(options.sortBy);
                params.sort_order = options.sortOrder === 'asc' ? 'asc' : 'desc';
            }
            const response = await ErrorHandler.retryWithBackoff(() => this.client.get('', { params }), { context: 'IEEE Xplore search' });
            return (response.data.articles || [])
                .map(article => this.parseArticle(article))
                .filter((paper) => Boolean(paper));
        }
        catch (error) {
            this.handleHttpError(error, 'search');
        }
    }
    async downloadPdf(_paperId, _options = {}) {
        throw new Error('IEEE Xplore API search returns metadata and PDF URLs only; direct PDF download is not supported by this CLI.');
    }
    async readPaper(_paperId, _options = {}) {
        throw new Error('IEEE Xplore full text requires separate API entitlement and is not supported by this searcher.');
    }
    mapSortField(sortBy) {
        if (sortBy === 'date')
            return 'publication_year';
        if (sortBy === 'citations')
            return 'citing_paper_count';
        return 'article_number';
    }
    parseArticle(article) {
        if (!article.title)
            return null;
        const year = Number(article.publication_year) || this.extractYear(article.publication_date);
        const startPage = article.start_page || '';
        const endPage = article.end_page || '';
        const pages = startPage && endPage ? `${startPage}-${endPage}` : startPage || endPage || undefined;
        const articleNumber = article.article_number ? String(article.article_number) : '';
        const doi = article.doi || '';
        return PaperFactory.create({
            paperId: articleNumber || doi || article.title,
            title: this.cleanText(article.title),
            authors: (article.authors?.authors || [])
                .sort((a, b) => (a.author_order || 0) - (b.author_order || 0))
                .map(author => author.full_name || '')
                .filter(Boolean),
            abstract: this.cleanText(article.abstract || ''),
            doi,
            publishedDate: year ? new Date(year, 0, 1) : null,
            pdfUrl: article.pdf_url || '',
            url: article.html_url || (doi ? `https://doi.org/${doi}` : ''),
            source: 'ieee',
            journal: article.publication_title || undefined,
            volume: article.volume || undefined,
            issue: article.issue || undefined,
            pages,
            year,
            citationCount: Number(article.citing_paper_count) || 0,
            keywords: this.extractKeywords(article),
            extra: {
                articleNumber,
                contentType: article.content_type || '',
                publisher: article.publisher || '',
                isbn: article.isbn || '',
                issn: article.issn || ''
            }
        });
    }
    extractYear(value) {
        const match = value?.match(/\b(19|20)\d{2}\b/);
        return match ? Number(match[0]) : undefined;
    }
    extractKeywords(article) {
        const ieeeTerms = article.index_terms?.ieee_terms?.terms || [];
        const authorTerms = article.index_terms?.author_terms?.terms || [];
        return [...ieeeTerms, ...authorTerms].filter((term, index, terms) => term && terms.indexOf(term) === index);
    }
}
//# sourceMappingURL=IEEESearcher.js.map