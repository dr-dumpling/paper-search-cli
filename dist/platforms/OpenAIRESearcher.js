import axios from 'axios';
import * as xml2js from 'xml2js';
import { PaperFactory } from '../models/Paper.js';
import { PaperSource } from './PaperSource.js';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';
export class OpenAIRESearcher extends PaperSource {
    client;
    constructor(apiKey) {
        const configuredKey = apiKey || process.env.PAPER_SEARCH_OPENAIRE_API_KEY || process.env.OPENAIRE_API_KEY || '';
        super('openaire', 'https://api.openaire.eu', configuredKey);
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: TIMEOUTS.DEFAULT,
            headers: {
                Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
                'User-Agent': USER_AGENT,
                ...(configuredKey ? { Authorization: `Bearer ${configuredKey}` } : {})
            },
            responseType: 'text',
            validateStatus: status => status < 500 || [500, 502, 503, 504].includes(status)
        });
    }
    getCapabilities() {
        return {
            search: true,
            download: false,
            fullText: false,
            citations: false,
            requiresApiKey: false,
            supportedOptions: ['maxResults', 'year']
        };
    }
    async search(query, options = {}) {
        try {
            const xml = await this.searchXml(query, Math.min(options.maxResults || 10, 100));
            const parsed = await xml2js.parseStringPromise(xml, {
                explicitArray: false,
                explicitCharkey: true,
                attrkey: '$',
                charkey: '_',
                mergeAttrs: false
            });
            const resultNodes = this.collectNodes(parsed, 'result');
            const papers = [];
            for (const node of resultNodes) {
                const paper = this.parseResult(node);
                if (!paper)
                    continue;
                if (options.year && paper.year !== Number(options.year))
                    continue;
                papers.push(paper);
                if (papers.length >= (options.maxResults || 10))
                    break;
            }
            return papers;
        }
        catch (error) {
            this.handleHttpError(error, 'search');
        }
    }
    async downloadPdf(_paperId, _options = {}) {
        throw new Error('OpenAIRE does not provide direct downloads in this CLI. Use pdf_url with download_with_fallback.');
    }
    async readPaper(_paperId, _options = {}) {
        throw new Error('OpenAIRE is a discovery source; direct full-text reading is not supported.');
    }
    async searchXml(query, maxResults) {
        const profiles = [
            { page: 1, userAgent: USER_AGENT },
            { page: 0, userAgent: USER_AGENT },
            { page: 1, userAgent: 'Mozilla/5.0' }
        ];
        let lastError;
        for (const profile of profiles) {
            for (let attempt = 0; attempt < 3; attempt += 1) {
                try {
                    const response = await this.client.get('/search/researchProducts', {
                        params: { keywords: query, page: profile.page, size: maxResults },
                        headers: { 'User-Agent': profile.userAgent }
                    });
                    if ([403, 429, 500, 502, 503, 504].includes(response.status)) {
                        await new Promise(resolve => setTimeout(resolve, Math.min(8000, 1000 * 2 ** attempt)));
                        continue;
                    }
                    if (response.status >= 400) {
                        throw new Error(`OpenAIRE request failed with HTTP ${response.status}`);
                    }
                    return String(response.data || '');
                }
                catch (error) {
                    lastError = error;
                }
            }
        }
        throw lastError instanceof Error ? lastError : new Error('OpenAIRE request failed');
    }
    parseResult(node) {
        const flat = this.flattenStrings(node);
        const title = this.firstTextForKeys(node, ['title', 'maintitle']) || this.first(flat, []);
        if (!title)
            return null;
        const doi = this.extractDoi(flat.join(' '));
        const urls = flat.filter(value => /^https?:\/\//i.test(value));
        const pdfUrl = urls.find(url => url.toLowerCase().includes('pdf')) || '';
        const dateText = this.firstTextForKeys(node, ['publicationdate', 'dateofacceptance', 'date']) ||
            flat.find(value => /\b(19|20)\d{2}(-\d{2}-\d{2})?\b/.test(value)) ||
            '';
        const publishedDate = dateText ? this.parseDate(dateText.match(/\b(19|20)\d{2}(-\d{2}-\d{2})?\b/)?.[0] || '') : null;
        const objId = this.firstTextForKeys(node, ['objidentifier', 'originalid', 'pid']) || `openaire_${Math.abs(this.hash(title))}`;
        return PaperFactory.create({
            paperId: objId,
            title: this.cleanText(title),
            authors: this.textsForKeys(node, ['creator', 'person']).slice(0, 20),
            abstract: this.firstTextForKeys(node, ['description', 'abstract']) || this.collectLikelyAbstract(flat),
            doi,
            publishedDate,
            pdfUrl,
            url: urls[0] || (doi ? `https://doi.org/${doi}` : ''),
            source: 'openaire',
            year: publishedDate?.getFullYear(),
            extra: {
                openAccess: flat.some(value => /open access|openaire/i.test(value)),
                sourceHint: 'openaire'
            }
        });
    }
    collectNodes(value, keyName) {
        const out = [];
        const walk = (node, key = '') => {
            if (!node || typeof node !== 'object')
                return;
            if (key.toLowerCase() === keyName.toLowerCase())
                out.push(node);
            for (const [childKey, childValue] of Object.entries(node)) {
                if (Array.isArray(childValue)) {
                    childValue.forEach(item => walk(item, childKey));
                }
                else {
                    walk(childValue, childKey);
                }
            }
        };
        walk(value);
        return out;
    }
    flattenStrings(value) {
        const out = [];
        const walk = (node) => {
            if (typeof node === 'string') {
                const cleaned = this.cleanText(node);
                if (cleaned)
                    out.push(cleaned);
                return;
            }
            if (!node || typeof node !== 'object')
                return;
            for (const [childKey, childValue] of Object.entries(node)) {
                if (childKey === '$')
                    continue;
                if (Array.isArray(childValue))
                    childValue.forEach(walk);
                else
                    walk(childValue);
            }
        };
        walk(value);
        return [...new Set(out)];
    }
    first(values, hints) {
        if (hints.length === 0)
            return values[0] || '';
        return values.find(value => hints.some(hint => value.toLowerCase().includes(hint))) || values[0] || '';
    }
    textsForKeys(value, keys) {
        const wanted = new Set(keys.map(key => key.toLowerCase()));
        const out = [];
        const walk = (node, key = '') => {
            if (!node || typeof node !== 'object')
                return;
            const normalizedKey = key.toLowerCase();
            if (wanted.has(normalizedKey)) {
                const text = this.nodeText(node);
                if (text)
                    out.push(text);
            }
            for (const [childKey, childValue] of Object.entries(node)) {
                if (childKey === '$')
                    continue;
                if (Array.isArray(childValue))
                    childValue.forEach(item => walk(item, childKey));
                else
                    walk(childValue, childKey);
            }
        };
        walk(value);
        return [...new Set(out)];
    }
    firstTextForKeys(value, keys) {
        return this.textsForKeys(value, keys)[0] || '';
    }
    nodeText(value) {
        if (typeof value === 'string')
            return this.cleanText(value);
        if (!value || typeof value !== 'object')
            return '';
        if (typeof value._ === 'string')
            return this.cleanText(value._);
        return '';
    }
    collectLikelyAbstract(values) {
        return values.find(value => value.length > 120 && !value.startsWith('http')) || '';
    }
    extractDoi(value) {
        return value.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i)?.[0] || '';
    }
    hash(value) {
        let hash = 0;
        for (let i = 0; i < value.length; i += 1)
            hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
        return hash;
    }
}
//# sourceMappingURL=OpenAIRESearcher.js.map