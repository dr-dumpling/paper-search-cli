import axios from 'axios';
import { PaperFactory } from '../models/Paper.js';
import { PaperSource } from './PaperSource.js';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';
export class OpenAlexSearcher extends PaperSource {
    client;
    constructor() {
        super('openalex', 'https://api.openalex.org/works');
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: TIMEOUTS.DEFAULT,
            headers: {
                Accept: 'application/json',
                'User-Agent': `${USER_AGENT} (mailto:${process.env.CROSSREF_MAILTO || 'paper-search-cli@example.com'})`
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
            supportedOptions: ['maxResults', 'year']
        };
    }
    async search(query, options = {}) {
        try {
            const params = {
                search: query,
                per_page: Math.min(options.maxResults || 10, 200)
            };
            if (options.year) {
                const year = options.year.match(/^\d{4}$/)?.[0];
                if (year) {
                    params.filter = `from_publication_date:${year}-01-01,to_publication_date:${year}-12-31`;
                }
            }
            const response = await this.client.get('', { params });
            const results = Array.isArray(response.data?.results) ? response.data.results : [];
            return results.map((item) => this.parseWork(item)).filter(Boolean);
        }
        catch (error) {
            this.handleHttpError(error, 'search');
        }
    }
    async downloadPdf(_paperId, _options = {}) {
        throw new Error('OpenAlex does not host PDFs directly. Use pdf_url or download_with_fallback.');
    }
    async readPaper(_paperId, _options = {}) {
        throw new Error('OpenAlex provides metadata and OA links only; it does not provide direct full text.');
    }
    parseWork(item) {
        const title = item.title || item.display_name || '';
        if (!title)
            return null;
        const doi = item.doi?.replace(/^https:\/\/doi\.org\//i, '') || '';
        const primaryLocation = item.primary_location || {};
        const openAccess = item.open_access || {};
        const url = primaryLocation.landing_page_url || item.id || (doi ? `https://doi.org/${doi}` : '');
        const pdfUrl = primaryLocation.pdf_url || openAccess.oa_url || '';
        const concepts = (item.concepts || []).map(concept => concept.display_name || '').filter(Boolean);
        return PaperFactory.create({
            paperId: (item.id || '').replace('https://openalex.org/', '') || doi || title,
            title,
            authors: (item.authorships || [])
                .map(authorship => authorship.author?.display_name || '')
                .filter(Boolean),
            abstract: this.reconstructAbstract(item.abstract_inverted_index),
            doi,
            publishedDate: item.publication_date ? this.parseDate(item.publication_date) : null,
            pdfUrl,
            url,
            source: 'openalex',
            categories: concepts.slice(0, 5),
            citationCount: item.cited_by_count || 0,
            year: item.publication_date ? Number(item.publication_date.slice(0, 4)) || undefined : undefined,
            extra: {
                openAccess: Boolean(openAccess.is_oa),
                oaStatus: openAccess.oa_status || '',
                openAlexId: item.id || ''
            }
        });
    }
    reconstructAbstract(index) {
        if (!index)
            return '';
        const words = [];
        for (const [word, positions] of Object.entries(index)) {
            for (const position of positions || []) {
                words.push([position, word]);
            }
        }
        return words.sort((a, b) => a[0] - b[0]).map(([, word]) => word).join(' ');
    }
}
//# sourceMappingURL=OpenAlexSearcher.js.map