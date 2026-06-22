import { SEARCH_PLATFORM_VALUES } from '../../registry/platformMetadata.js';

export const SEARCH_PAPERS_TOOL = {
  name: 'search_papers',
  description: 'Search academic papers from multiple sources including arXiv, Web of Science, etc.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query string' },
      platform: {
        type: 'string',
        enum: [...SEARCH_PLATFORM_VALUES, 'all'],
        description:
          'Platform to search (default: crossref). Use --sources for comma-separated multi-source search. Note: Wiley only supports PDF download by DOI.'
      },
      sources: {
        type: 'string',
        description:
          'Comma-separated source list for multi-source search, or all for every registered search source except DOI-download-only providers. Failed or unconfigured sources are reported in failed_sources/errors. Example: crossref,openalex,pubmed,pmc'
      },
      maxResults: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        description: 'Maximum number of results to return'
      },
      year: { type: 'string', description: 'Year filter (e.g., "2023", "2020-2023", "2020-")' },
      author: { type: 'string', description: 'Author name filter' },
      journal: { type: 'string', description: 'Journal name filter' },
      category: { type: 'string', description: 'Category filter (e.g., cs.AI for arXiv)' },
      days: {
        type: 'number',
        description: 'Number of days to search back (bioRxiv/medRxiv only)'
      },
      fetchDetails: {
        type: 'boolean',
        description: 'Fetch detailed information (IACR only)'
      },
      fieldsOfStudy: {
        type: 'array',
        items: { type: 'string' },
        description: 'Fields of study filter (Semantic Scholar only)'
      },
      sortBy: {
        type: 'string',
        enum: ['relevance', 'date', 'citations'],
        description: 'Sort results by relevance, date, or citations'
      },
      sortOrder: {
        type: 'string',
        enum: ['asc', 'desc'],
        description: 'Sort order: ascending or descending'
      }
    },
    required: ['query']
  }
};

export const GET_PAPER_BY_DOI_TOOL = {
  name: 'get_paper_by_doi',
  description: 'Retrieve paper information using DOI from available platforms',
  inputSchema: {
    type: 'object',
    properties: {
      doi: {
        type: 'string',
        description: 'DOI (Digital Object Identifier)'
      },
      platform: {
        type: 'string',
        enum: ['arxiv', 'webofscience', 'pubmed', 'crossref', 'openalex', 'unpaywall', 'pmc', 'europepmc', 'core', 'all'],
        description: 'Platform to search'
      }
    },
    required: ['doi']
  }
};

export const METADATA_SEARCH_TOOLS = [SEARCH_PAPERS_TOOL, GET_PAPER_BY_DOI_TOOL];
