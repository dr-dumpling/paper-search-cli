import { describe, expect, it } from '@jest/globals';
import { TOOLS } from '../../src/core/tools.js';

const EXPECTED_TOOL_NAMES = [
  'search_papers',
  'search_arxiv',
  'search_webofscience',
  'search_pubmed',
  'search_biorxiv',
  'search_medrxiv',
  'search_semantic_scholar',
  'search_semantic_snippets',
  'get_paper_citations',
  'get_paper_references',
  'search_iacr',
  'download_paper',
  'search_google_scholar',
  'get_paper_by_doi',
  'search_scihub',
  'check_scihub_mirrors',
  'get_platform_status',
  'query_journal_metrics',
  'search_sciencedirect',
  'search_springer',
  'search_wiley',
  'search_scopus',
  'search_crossref',
  'search_openalex',
  'search_unpaywall',
  'search_pmc',
  'search_europepmc',
  'search_core',
  'search_openaire',
  'download_with_fallback',
  'search_dblp',
  'search_ieee',
  'search_acm',
  'search_usenix',
  'search_openreview',
  'search_springerlink'
];

const EXPECTED_SCHEMA_SUMMARY: Record<string, { required: string[]; properties: string[] }> = {
  search_papers: {
    required: ['query'],
    properties: [
      'query',
      'platform',
      'sources',
      'maxResults',
      'year',
      'author',
      'journal',
      'category',
      'days',
      'fetchDetails',
      'fieldsOfStudy',
      'sortBy',
      'sortOrder'
    ]
  },
  search_arxiv: {
    required: ['query'],
    properties: ['query', 'maxResults', 'category', 'author', 'year', 'sortBy', 'sortOrder']
  },
  search_webofscience: {
    required: ['query'],
    properties: ['query', 'maxResults', 'year', 'author', 'journal', 'sortBy', 'sortOrder']
  },
  search_pubmed: {
    required: ['query'],
    properties: ['query', 'maxResults', 'year', 'author', 'journal', 'publicationType', 'sortBy']
  },
  search_biorxiv: {
    required: ['query'],
    properties: ['query', 'maxResults', 'days', 'category']
  },
  search_medrxiv: {
    required: ['query'],
    properties: ['query', 'maxResults', 'days', 'category']
  },
  search_semantic_scholar: {
    required: ['query'],
    properties: ['query', 'maxResults', 'year', 'fieldsOfStudy']
  },
  search_semantic_snippets: {
    required: ['query'],
    properties: [
      'query',
      'limit',
      'year',
      'fieldsOfStudy',
      'paperIds',
      'authors',
      'venue',
      'minCitationCount',
      'publicationDateOrYear',
      'fields'
    ]
  },
  get_paper_citations: {
    required: [],
    properties: ['paperId', 'doi', 'arxivId', 'limit']
  },
  get_paper_references: {
    required: [],
    properties: ['paperId', 'doi', 'arxivId', 'limit']
  },
  search_iacr: {
    required: ['query'],
    properties: ['query', 'maxResults', 'fetchDetails']
  },
  download_paper: {
    required: ['paperId', 'platform'],
    properties: ['paperId', 'platform', 'savePath']
  },
  search_google_scholar: {
    required: ['query'],
    properties: ['query', 'maxResults', 'yearLow', 'yearHigh', 'author']
  },
  get_paper_by_doi: {
    required: ['doi'],
    properties: ['doi', 'platform']
  },
  search_scihub: {
    required: ['doiOrUrl'],
    properties: ['doiOrUrl', 'downloadPdf', 'savePath']
  },
  check_scihub_mirrors: {
    required: [],
    properties: ['forceCheck']
  },
  get_platform_status: {
    required: [],
    properties: ['validate']
  },
  query_journal_metrics: {
    required: [],
    properties: ['journal', 'journals', 'file', 'includeRaw']
  },
  search_sciencedirect: {
    required: ['query'],
    properties: ['query', 'maxResults', 'year', 'author', 'journal', 'openAccess']
  },
  search_springer: {
    required: ['query'],
    properties: ['query', 'maxResults', 'year', 'author', 'journal', 'subject', 'openAccess', 'type']
  },
  search_wiley: {
    required: ['query'],
    properties: ['query']
  },
  search_scopus: {
    required: ['query'],
    properties: ['query', 'maxResults', 'year', 'author', 'journal', 'affiliation', 'subject', 'openAccess', 'documentType']
  },
  search_crossref: {
    required: ['query'],
    properties: ['query', 'maxResults', 'year', 'author', 'sortBy', 'sortOrder']
  },
  search_openalex: {
    required: ['query'],
    properties: ['query', 'maxResults', 'year']
  },
  search_unpaywall: {
    required: ['query'],
    properties: ['query', 'maxResults']
  },
  search_pmc: {
    required: ['query'],
    properties: ['query', 'maxResults', 'year']
  },
  search_europepmc: {
    required: ['query'],
    properties: ['query', 'maxResults', 'year']
  },
  search_core: {
    required: ['query'],
    properties: ['query', 'maxResults', 'year']
  },
  search_openaire: {
    required: ['query'],
    properties: ['query', 'maxResults', 'year']
  },
  download_with_fallback: {
    required: ['source', 'paperId'],
    properties: ['source', 'paperId', 'doi', 'title', 'savePath', 'useSciHub']
  },
  search_dblp: {
    required: ['query'],
    properties: ['query', 'maxResults', 'year', 'author', 'journal', 'venue', 'articleTitle', 'startRecord', 'sortBy', 'sortOrder']
  },
  search_ieee: {
    required: ['query'],
    properties: ['query', 'maxResults', 'year', 'author', 'journal', 'venue', 'articleTitle', 'startRecord', 'sortBy', 'sortOrder']
  },
  search_acm: {
    required: ['query'],
    properties: ['query', 'maxResults', 'year', 'author', 'journal', 'venue', 'articleTitle', 'startRecord', 'sortBy', 'sortOrder']
  },
  search_usenix: {
    required: ['query'],
    properties: ['query', 'maxResults', 'year', 'author', 'journal', 'venue', 'articleTitle', 'startRecord', 'sortBy', 'sortOrder']
  },
  search_openreview: {
    required: ['query'],
    properties: ['query', 'maxResults', 'year', 'author', 'journal', 'venue', 'articleTitle', 'startRecord', 'sortBy', 'sortOrder']
  },
  search_springerlink: {
    required: ['query'],
    properties: ['query', 'maxResults', 'year', 'author', 'journal', 'venue', 'articleTitle', 'startRecord', 'sortBy', 'sortOrder']
  }
};

function schemaFor(toolName: string): any {
  const tool = TOOLS.find(item => item.name === toolName);
  if (!tool) throw new Error(`Tool not found: ${toolName}`);
  return tool.inputSchema;
}

function schemaSummary() {
  return Object.fromEntries(
    TOOLS.map(tool => [
      tool.name,
      {
        required: tool.inputSchema.required || [],
        properties: Object.keys(tool.inputSchema.properties || {})
      }
    ])
  );
}

describe('tools contract', () => {
  it('keeps the public tool name set stable', () => {
    expect(TOOLS.map(tool => tool.name)).toEqual(EXPECTED_TOOL_NAMES);
  });

  it('keeps each public tool schema field surface stable', () => {
    expect(schemaSummary()).toEqual(EXPECTED_SCHEMA_SUMMARY);
  });

  it('keeps citation expansion schemas explicit', () => {
    for (const toolName of ['get_paper_citations', 'get_paper_references']) {
      const schema = schemaFor(toolName);
      expect(Object.keys(schema.properties)).toEqual(['paperId', 'doi', 'arxivId', 'limit']);
      expect(schema.properties.limit).toEqual(
        expect.objectContaining({
          type: 'number',
          minimum: 1,
          maximum: 100
        })
      );
    }
  });

  it('does not expose future institutional access knobs in download_with_fallback', () => {
    const schema = schemaFor('download_with_fallback');
    expect(schema.required).toEqual(['source', 'paperId']);
    expect(Object.keys(schema.properties)).toEqual(['source', 'paperId', 'doi', 'title', 'savePath', 'useSciHub']);
    expect(schema.properties).not.toHaveProperty('institutional_access');
    expect(schema.properties).not.toHaveProperty('useInstitutionalAccess');
    expect(schema.properties).not.toHaveProperty('institutionalProvider');
  });
});
