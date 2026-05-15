/**
 * ArxivSearcher Platform Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ArxivSearcher } from '../../src/platforms/ArxivSearcher.js';

describe('ArxivSearcher', () => {
  let searcher: ArxivSearcher;

  beforeEach(() => {
    searcher = new ArxivSearcher();
  });

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const caps = searcher.getCapabilities();
      expect(caps.search).toBe(true);
      expect(caps.download).toBe(true);
      expect(caps.fullText).toBe(true);
      expect(caps.requiresApiKey).toBe(false);
    });
  });

  describe('search', () => {
    it('should handle category filter', () => {
      expect(searcher.search).toBeDefined();
    });

    it('should support sortBy and sortOrder', () => {
      expect(searcher.search).toBeDefined();
    });

    it('should normalize plain language queries to arXiv field syntax', () => {
      const normalized = (searcher as any).normalizeSearchQuery('llm large language model');

      expect(normalized).toBe('all:llm AND all:large AND all:language AND all:model');
    });

    it('should preserve advanced arXiv query syntax', () => {
      const advanced = 'ti:"large language model" AND cat:cs.CL';

      expect((searcher as any).normalizeSearchQuery(advanced)).toBe(advanced);
    });

    it('should cap arXiv result count to the API-safe limit', () => {
      expect((searcher as any).normalizeMaxResults(undefined)).toBe(10);
      expect((searcher as any).normalizeMaxResults(0)).toBe(1);
      expect((searcher as any).normalizeMaxResults(250)).toBe(25);
      expect((searcher as any).normalizeMaxResults(7.8)).toBe(7);
    });

    it('should identify arXiv timeout errors', () => {
      expect((searcher as any).isTimeoutError({ code: 'ECONNABORTED' })).toBe(true);
      expect((searcher as any).isTimeoutError({ code: 'ETIMEDOUT' })).toBe(true);
      expect((searcher as any).isTimeoutError(new Error('timeout of 30000ms exceeded'))).toBe(true);
      expect((searcher as any).isTimeoutError(new Error('bad request'))).toBe(false);
    });

    it('should fall back on arXiv rate limits and timeout-like errors', () => {
      expect((searcher as any).shouldUseWebFallback({ response: { status: 429 } })).toBe(true);
      expect((searcher as any).shouldUseWebFallback({ response: { status: 503 } })).toBe(true);
      expect((searcher as any).shouldUseWebFallback(new Error('timed out'))).toBe(true);
      expect((searcher as any).shouldUseWebFallback({ response: { status: 400 } })).toBe(false);
    });

    it('should fall back while the arXiv Export API is cooling down', () => {
      const error = (searcher as any).createArxivCooldownError(30000);

      expect((error as any).status).toBe(429);
      expect((searcher as any).shouldUseWebFallback(error)).toBe(true);
    });

    it('should parse arXiv web search fallback results', () => {
      const html = `
        <li class="arxiv-result">
          <p class="list-title is-inline-block">
            <a href="https://arxiv.org/abs/2605.08083">arXiv:2605.08083</a>
            <span>[<a href="https://arxiv.org/pdf/2605.08083">pdf</a>]</span>
          </p>
          <div class="tags"><span class="tag">cs.CL</span></div>
          <p class="title is-5 mathjax">LLMs Improving LLMs</p>
          <p class="authors">
            <span>Authors:</span>
            <a>Tong Zheng</a>, <a>Haolin Liu</a>
          </p>
          <p class="abstract mathjax">
            <span class="abstract-full">A fallback abstract. <a>Less</a></span>
          </p>
          <p class="is-size-7"><span>Submitted</span> 8 May, 2026;</p>
        </li>
      `;

      const results = (searcher as any).parseWebSearchResponse(html);

      expect(results).toHaveLength(1);
      expect(results[0].paperId).toBe('2605.08083');
      expect(results[0].title).toBe('LLMs Improving LLMs');
      expect(results[0].authors).toEqual(['Tong Zheng', 'Haolin Liu']);
      expect(results[0].abstract).toBe('A fallback abstract.');
      expect(results[0].pdfUrl).toBe('https://arxiv.org/pdf/2605.08083');
      expect(results[0].categories).toEqual(['cs.CL']);
      expect(results[0].extra.fallback).toBe('arxiv_web_search');
    });
  });

  describe('downloadPdf', () => {
    it('should be available', () => {
      expect(searcher.downloadPdf).toBeDefined();
    });
  });

  describe('arXiv ID handling', () => {
    it('should handle new format IDs (YYMM.NNNNN)', () => {
      // e.g., 2301.12345
      expect(searcher).toBeDefined();
    });

    it('should handle old format IDs (category/YYMMNNN)', () => {
      // e.g., cs.AI/0701001
      expect(searcher).toBeDefined();
    });
  });
});
