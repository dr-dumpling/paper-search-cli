import axios from 'axios';
import { RequestCache } from '../utils/RequestCache.js';
import { RateLimiter } from '../utils/RateLimiter.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';
import { logDebug, logWarn } from '../utils/Logger.js';
export class CitationService {
    client;
    cache;
    rateLimiter;
    apiKey;
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.SEMANTIC_SCHOLAR_API_KEY;
        this.client = axios.create({
            baseURL: 'https://api.semanticscholar.org/graph/v1',
            timeout: TIMEOUTS.DEFAULT,
            headers: {
                'Accept': 'application/json',
                'User-Agent': USER_AGENT,
                ...(this.apiKey ? { 'x-api-key': this.apiKey } : {})
            }
        });
        // Semantic Scholar rate limits: 100 req/5min (free), 1000 req/5min (paid)
        const requestsPerMinute = this.apiKey ? 180 : 18;
        this.rateLimiter = new RateLimiter({
            requestsPerSecond: requestsPerMinute / 60,
            burstCapacity: Math.max(3, Math.floor(requestsPerMinute / 20))
        });
        this.cache = new RequestCache({
            maxSize: 500,
            ttlMs: 86400000 // 24 hours
        });
    }
    /**
     * Get citation data for a single paper by ID
     */
    async getCitationData(paperId, forceRefresh = false) {
        try {
            // Check cache first
            if (!forceRefresh) {
                const cacheKey = this.cache.generateKey('citation', paperId, {});
                const cached = this.cache.get(cacheKey);
                if (cached) {
                    return cached;
                }
            }
            await this.rateLimiter.waitForPermission();
            const fields = [
                'paperId',
                'title',
                'citationCount',
                'referenceCount',
                'influentialCitationCount',
                'year',
                'authors',
                'venue',
                'externalIds',
                'url'
            ].join(',');
            const response = await ErrorHandler.retryWithBackoff(() => this.client.get(`/paper/${paperId}`, {
                params: { fields }
            }), { context: 'Semantic Scholar citation lookup' });
            if (response.status !== 200 || !response.data) {
                return null;
            }
            const data = this.parseCitationData(response.data);
            // Cache the result
            const cacheKey = this.cache.generateKey('citation', paperId, {});
            this.cache.set(cacheKey, data);
            return data;
        }
        catch (error) {
            logWarn(`Error fetching citation data for ${paperId}:`, error.message);
            return null;
        }
    }
    /**
     * Get citation data by DOI
     */
    async getCitationDataByDoi(doi, forceRefresh = false) {
        try {
            const paperId = `DOI:${doi}`;
            return await this.getCitationData(paperId, forceRefresh);
        }
        catch (error) {
            logWarn(`Error fetching citation data by DOI ${doi}:`, error.message);
            return null;
        }
    }
    /**
     * Get citation data by arXiv ID
     */
    async getCitationDataByArxiv(arxivId, forceRefresh = false) {
        try {
            const paperId = `ARXIV:${arxivId}`;
            return await this.getCitationData(paperId, forceRefresh);
        }
        catch (error) {
            logWarn(`Error fetching citation data by arXiv ID ${arxivId}:`, error.message);
            return null;
        }
    }
    /**
     * Batch lookup citations for multiple papers
     */
    async batchLookup(requests) {
        const results = new Map();
        for (const request of requests) {
            let paperId = null;
            let key;
            if (request.paperId) {
                paperId = request.paperId;
                key = request.paperId;
            }
            else if (request.doi) {
                paperId = `DOI:${request.doi}`;
                key = request.doi;
            }
            else if (request.arxivId) {
                paperId = `ARXIV:${request.arxivId}`;
                key = request.arxivId;
            }
            else if (request.title) {
                key = request.title;
                // Search by title (not implemented in this version)
                results.set(key, null);
                continue;
            }
            else {
                continue;
            }
            try {
                const data = await this.getCitationData(paperId);
                results.set(key, data);
            }
            catch (error) {
                logDebug(`Error in batch lookup for ${key}:`, error);
                results.set(key, null);
            }
        }
        return results;
    }
    /**
     * Get references for a paper
     */
    async getReferences(paperId, limit = 100) {
        try {
            await this.rateLimiter.waitForPermission();
            const fields = [
                'paperId',
                'title',
                'citationCount',
                'year',
                'authors',
                'venue'
            ].join(',');
            const response = await ErrorHandler.retryWithBackoff(() => this.client.get(`/paper/${paperId}/references`, {
                params: { fields, limit }
            }), { context: 'Semantic Scholar references lookup' });
            if (response.status !== 200 || !response.data?.data) {
                return [];
            }
            return response.data.data
                .map((item) => item.citedPaper)
                .filter((paper) => paper)
                .map((paper) => this.parseCitationData(paper));
        }
        catch (error) {
            logWarn(`Error fetching references for ${paperId}:`, error.message);
            return [];
        }
    }
    /**
     * Get citations for a paper
     */
    async getCitations(paperId, limit = 100) {
        try {
            await this.rateLimiter.waitForPermission();
            const fields = [
                'paperId',
                'title',
                'citationCount',
                'year',
                'authors',
                'venue'
            ].join(',');
            const response = await ErrorHandler.retryWithBackoff(() => this.client.get(`/paper/${paperId}/citations`, {
                params: { fields, limit }
            }), { context: 'Semantic Scholar citations lookup' });
            if (response.status !== 200 || !response.data?.data) {
                return [];
            }
            return response.data.data
                .map((item) => item.citingPaper)
                .filter((paper) => paper)
                .map((paper) => this.parseCitationData(paper));
        }
        catch (error) {
            logWarn(`Error fetching citations for ${paperId}:`, error.message);
            return [];
        }
    }
    /**
     * Parse Semantic Scholar response to CitationData
     */
    parseCitationData(data) {
        return {
            paperId: data.paperId,
            title: data.title,
            citationCount: data.citationCount || 0,
            referenceCount: data.referenceCount || 0,
            influentialCitationCount: data.influentialCitationCount,
            year: data.year,
            authors: data.authors?.map((author) => ({
                name: author.name,
                authorId: author.authorId
            })),
            venue: data.venue,
            doi: data.externalIds?.DOI,
            url: data.url
        };
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}
export default CitationService;
//# sourceMappingURL=CitationService.js.map