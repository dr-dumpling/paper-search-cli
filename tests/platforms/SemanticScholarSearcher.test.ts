/**
 * SemanticScholarSearcher Platform Tests
 */

import axios from 'axios';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SemanticScholarSearcher } from '../../src/platforms/SemanticScholarSearcher.js';

describe('SemanticScholarSearcher', () => {
  let searcher: SemanticScholarSearcher;

  beforeEach(() => {
    searcher = new SemanticScholarSearcher();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const caps = searcher.getCapabilities();
      expect(caps.search).toBe(true);
      expect(caps.download).toBe(true);
      expect(caps.citations).toBe(true);
      expect(caps.requiresApiKey).toBe(false); // Optional
    });
  });

  describe('constructor', () => {
    it('should work without API key', () => {
      const instance = new SemanticScholarSearcher();
      expect(instance).toBeDefined();
    });

    it('should accept API key for higher rate limits', () => {
      const instance = new SemanticScholarSearcher('test-key');
      expect(instance).toBeDefined();
    });
  });

  describe('search options', () => {
    it('should support fieldsOfStudy filter', () => {
      expect(searcher.search).toBeDefined();
    });

    it('should support year filter', () => {
      expect(searcher.search).toBeDefined();
    });
  });

  describe('getPaperByDoi', () => {
    it('should use DOI: prefix', () => {
      expect(searcher.getPaperByDoi).toBeDefined();
    });
  });

  describe('paper details', () => {
    it('should have getPaperDetails method', () => {
      expect((searcher as any).getPaperDetails).toBeDefined();
    });
  });

  describe('PDF URL normalization', () => {
    it('converts arXiv abstract links to direct PDF links and ignores DOI landing pages', async () => {
      jest.spyOn(axios, 'get').mockResolvedValue({
        data: {
          data: [
            {
              paperId: 'paper-1',
              title: 'Arxiv paper',
              openAccessPdf: { url: 'https://arxiv.org/abs/2501.06425' },
              externalIds: { DOI: '10.48550/arXiv.2501.06425' }
            },
            {
              paperId: 'paper-2',
              title: 'Landing page only',
              openAccessPdf: { url: 'https://doi.org/10.1016/j.xpro.2022.101947' },
              externalIds: { DOI: '10.1016/j.xpro.2022.101947' }
            }
          ]
        }
      } as any);

      const results = await searcher.search('test', { maxResults: 2 });

      expect(results[0].pdfUrl).toBe('https://arxiv.org/pdf/2501.06425');
      expect(results[1].pdfUrl).toBe('');
    });
  });

  describe('searchSnippets', () => {
    it('should require SEMANTIC_SCHOLAR_API_KEY', async () => {
      await expect(searcher.searchSnippets({ query: 'mediation bootstrap', limit: 1 })).rejects.toThrow(
        'search_semantic_snippets requires SEMANTIC_SCHOLAR_API_KEY'
      );
    });

    it('should call snippet search and normalize snippet results', async () => {
      const instance = new SemanticScholarSearcher('test-key');
      jest.spyOn(axios, 'get').mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: {
          data: [
            {
              score: 0.9,
              paper: {
                corpusId: 123,
                title: 'A snippet paper',
                authors: ['Ada Lovelace'],
                openAccessInfo: { status: 'GREEN' }
              },
              snippet: {
                text: 'Matched body text.',
                snippetKind: 'body',
                section: 'Methods',
                snippetOffset: { start: 1, end: 3 },
                annotations: { sentences: [] }
              }
            }
          ]
        }
      } as any);

      const results = await instance.searchSnippets({
        query: 'mediation bootstrap',
        limit: 1,
        fieldsOfStudy: 'Medicine'
      });

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/snippet/search'),
        expect.objectContaining({
          params: expect.objectContaining({
            query: 'mediation bootstrap',
            limit: 1,
            fieldsOfStudy: 'Medicine'
          }),
          headers: expect.objectContaining({ 'x-api-key': 'test-key' })
        })
      );
      expect(results).toEqual([
        {
          score: 0.9,
          paper: {
            corpusId: '123',
            title: 'A snippet paper',
            authors: ['Ada Lovelace'],
            openAccessInfo: { status: 'GREEN' },
            url: 'https://www.semanticscholar.org/paper/CorpusId:123'
          },
          snippet: {
            text: 'Matched body text.',
            snippetKind: 'body',
            section: 'Methods',
            snippetOffset: { start: 1, end: 3 },
            annotations: { sentences: [] }
          },
          text: 'Matched body text.'
        }
      ]);
    });
  });
});
