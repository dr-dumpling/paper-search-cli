import { describe, expect, it } from '@jest/globals';
import { PaperFactory } from '../../src/models/Paper.js';
import {
  dedupePapers,
  parseSourceList,
  searchMultipleSources
} from '../../src/services/MultiSourceSearchService.js';

const searchers = {
  crossref: {},
  openalex: {},
  pubmed: {},
  pmc: {},
  europepmc: {},
  arxiv: {},
  biorxiv: {},
  medrxiv: {},
  semantic: {},
  iacr: {},
  core: {},
  openaire: {},
  googlescholar: {},
  scholar: {},
  scihub: {},
  sciencedirect: {},
  webofscience: {},
  wos: {},
  springer: {},
  scopus: {},
  unpaywall: {}
} as any;

describe('MultiSourceSearchService', () => {
  describe('parseSourceList', () => {
    it('defaults to crossref for empty source lists', () => {
      expect(parseSourceList(undefined, searchers)).toEqual(['crossref']);
    });

    it('uses all registered search sources for all', () => {
      const sources = parseSourceList('all', searchers);

      expect(sources).toEqual([
        'crossref',
        'openalex',
        'pubmed',
        'pmc',
        'europepmc',
        'arxiv',
        'biorxiv',
        'medrxiv',
        'semantic',
        'iacr',
        'core',
        'openaire',
        'googlescholar',
        'webofscience',
        'sciencedirect',
        'springer',
        'scopus',
        'scihub',
        'unpaywall'
      ]);
      expect(sources).not.toContain('wos');
      expect(sources).not.toContain('scholar');
      expect(sources).not.toContain('wiley');
    });

    it('normalizes aliases, removes duplicates, and drops unknown sources', () => {
      expect(parseSourceList('crossref,europe_pmc,pubmed_central,crossref,unknown', searchers)).toEqual([
        'crossref',
        'europepmc',
        'pmc'
      ]);
    });
  });

  describe('dedupePapers', () => {
    it('deduplicates by DOI before falling back to title and authors', () => {
      const papers = [
        PaperFactory.create({
          paperId: 'crossref-1',
          title: 'Shared DOI',
          authors: ['A Author'],
          doi: '10.1000/example',
          source: 'crossref'
        }),
        PaperFactory.create({
          paperId: 'openalex-1',
          title: 'Shared DOI from OpenAlex',
          authors: ['Other Author'],
          doi: '10.1000/EXAMPLE',
          source: 'openalex'
        }),
        PaperFactory.create({
          paperId: 'pmc-1',
          title: 'Same Title',
          authors: ['B Author'],
          source: 'pmc'
        }),
        PaperFactory.create({
          paperId: 'europepmc-1',
          title: 'Same Title',
          authors: ['B Author'],
          source: 'europepmc'
        })
      ];

      const deduped = dedupePapers(papers);

      expect(deduped).toHaveLength(2);
      expect(deduped.map(paper => paper.paperId)).toEqual(['crossref-1', 'pmc-1']);
    });
  });

  describe('searchMultipleSources', () => {
    it('skips failed and timed-out sources while returning successful results', async () => {
      const successfulPaper = PaperFactory.create({
        paperId: 'crossref-1',
        title: 'Working Source',
        doi: '10.1000/working',
        source: 'crossref'
      });
      const localSearchers = {
        crossref: {
          search: async () => [successfulPaper]
        },
        openalex: {
          search: async () => {
            throw new Error('OpenAlex temporary failure');
          }
        },
        pubmed: {
          search: () => new Promise(() => undefined)
        }
      } as any;

      const result = await searchMultipleSources(
        localSearchers,
        'test query',
        'crossref,openalex,pubmed',
        { maxResults: 1 },
        5
      );

      expect(result.total).toBe(1);
      expect(result.papers[0].title).toBe('Working Source');
      expect(result.source_results.crossref).toBe(1);
      expect(result.source_results.openalex).toBe(0);
      expect(result.source_results.pubmed).toBe(0);
      expect(result.failed_sources).toEqual(['openalex', 'pubmed']);
      expect(result.errors.openalex).toContain('temporary failure');
      expect(result.errors.pubmed).toContain('timed out');
      expect(result.warnings).toHaveLength(2);
    });
  });
});
