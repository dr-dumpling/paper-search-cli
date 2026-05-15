import { describe, expect, it } from '@jest/globals';
import { PaperFactory } from '../../src/models/Paper.js';
import { dedupePapers, parseSourceList } from '../../src/services/MultiSourceSearchService.js';

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

    it('uses a conservative curated source list for all', () => {
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
        'iacr',
        'core',
        'openaire'
      ]);
      expect(sources).not.toContain('googlescholar');
      expect(sources).not.toContain('scihub');
      expect(sources).not.toContain('semantic');
      expect(sources).not.toContain('unpaywall');
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
});
