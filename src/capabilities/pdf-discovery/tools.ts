import { SEARCH_PLATFORM_VALUES } from '../../registry/platformMetadata.js';

export const DOWNLOAD_PAPER_TOOL = {
  name: 'download_paper',
  description:
    'Download PDF file of an academic paper. Native downloads are tried first; unsupported or failed native downloads use the fallback funnel ending with Sci-Hub.',
  inputSchema: {
    type: 'object',
    properties: {
      paperId: { type: 'string', description: 'Paper ID (e.g., arXiv ID, DOI for Sci-Hub)' },
      platform: {
        type: 'string',
        enum: [...new Set([...SEARCH_PLATFORM_VALUES, 'wiley'])],
        description: 'Platform where the paper is from. If native download is unsupported or fails, the fallback funnel is used.'
      },
      savePath: {
        type: 'string',
        description: 'Directory to save the PDF file'
      }
    },
    required: ['paperId', 'platform']
  }
};

export const DOWNLOAD_WITH_FALLBACK_TOOL = {
  name: 'download_with_fallback',
  description:
    'Download with a funnel fallback chain: source-native download, metadata PDF URL, PMC/Europe PMC/CORE/OpenAIRE discovery, Unpaywall DOI resolution, then Sci-Hub as the final fallback unless useSciHub=false.',
  inputSchema: {
    type: 'object',
    properties: {
      source: { type: 'string', description: 'Primary source name, e.g. arxiv, crossref, pmc, core' },
      paperId: { type: 'string', description: 'Source-native paper identifier' },
      doi: { type: 'string', description: 'Optional DOI for OA fallback resolution' },
      title: { type: 'string', description: 'Optional title for repository discovery fallback' },
      savePath: { type: 'string', description: 'Directory to save the PDF file' },
      useSciHub: {
        type: 'boolean',
        description: 'Use Sci-Hub as the final fallback. Default: true. Set false only to suppress this final stage.'
      }
    },
    required: ['source', 'paperId']
  }
};

export const PDF_DISCOVERY_TOOLS = [DOWNLOAD_PAPER_TOOL, DOWNLOAD_WITH_FALLBACK_TOOL];
