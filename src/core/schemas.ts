import { z } from 'zod';

const SortBySchema = z.enum(['relevance', 'date', 'citations']);
const SortOrderSchema = z.enum(['asc', 'desc']);

export const SearchPapersSchema = z
  .object({
    query: z.string().min(1),
    platform: z
      .enum([
        'arxiv',
        'webofscience',
        'pubmed',
        'wos',
        'biorxiv',
        'medrxiv',
        'semantic',
        'iacr',
        'googlescholar',
        'scholar',
        'scihub',
        'sciencedirect',
        'springer',
        'scopus',
        'crossref',
        'openalex',
        'unpaywall',
        'pmc',
        'europepmc',
        'core',
        'openaire',
        'all'
      ])
      .optional()
      .default('crossref'),
    sources: z.string().optional(),
    maxResults: z.number().int().min(1).max(100).optional().default(10),
    year: z.string().optional(),
    author: z.string().optional(),
    journal: z.string().optional(),
    category: z.string().optional(),
    days: z.number().int().min(1).max(3650).optional(),
    fetchDetails: z.boolean().optional(),
    fieldsOfStudy: z.array(z.string()).optional(),
    sortBy: SortBySchema.optional().default('relevance'),
    sortOrder: SortOrderSchema.optional().default('desc')
  })
  .strip();

export const SearchArxivSchema = z
  .object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).max(50).optional().default(10),
    category: z.string().optional(),
    author: z.string().optional(),
    year: z.string().optional(),
    sortBy: SortBySchema.optional(),
    sortOrder: SortOrderSchema.optional()
  })
  .strip();

export const SearchWebOfScienceSchema = z
  .object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).max(50).optional().default(10),
    year: z.string().optional(),
    author: z.string().optional(),
    journal: z.string().optional(),
    sortBy: z
      .enum(['relevance', 'date', 'citations', 'title', 'author', 'journal'])
      .optional(),
    sortOrder: SortOrderSchema.optional()
  })
  .strip();

export const SearchPubMedSchema = z
  .object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).max(100).optional().default(10),
    year: z.string().optional(),
    author: z.string().optional(),
    journal: z.string().optional(),
    publicationType: z.array(z.string()).optional(),
    sortBy: z.enum(['relevance', 'date']).optional()
  })
  .strip();

export const SearchBioRxivSchema = z
  .object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).max(100).optional().default(10),
    days: z.number().int().min(1).max(3650).optional(),
    category: z.string().optional()
  })
  .strip();

export const SearchMedRxivSchema = SearchBioRxivSchema;

export const SearchSemanticScholarSchema = z
  .object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).max(100).optional().default(10),
    year: z.string().optional(),
    fieldsOfStudy: z.array(z.string()).optional()
  })
  .strip();

export const SearchSemanticSnippetsSchema = z
  .object({
    query: z.string().min(1),
    limit: z.number().int().min(1).max(1000).optional().default(5),
    year: z.string().optional(),
    fieldsOfStudy: z.union([z.string(), z.array(z.string())]).optional(),
    paperIds: z.union([z.string(), z.array(z.string())]).optional(),
    authors: z.union([z.string(), z.array(z.string())]).optional(),
    venue: z.union([z.string(), z.array(z.string())]).optional(),
    minCitationCount: z.number().int().min(0).optional(),
    publicationDateOrYear: z.string().optional(),
    fields: z.union([z.string(), z.array(z.string())]).optional()
  })
  .strip();

export const SearchIACRSchema = z
  .object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).max(50).optional().default(10),
    fetchDetails: z.boolean().optional()
  })
  .strip();

export const DownloadPaperSchema = z
  .object({
    paperId: z.coerce.string().min(1),
    platform: z.enum([
      'arxiv',
      'biorxiv',
      'medrxiv',
      'semantic',
      'iacr',
      'scihub',
      'springer',
      'wiley',
      'pmc',
      'europepmc',
      'core'
    ]),
    savePath: z.coerce.string().optional()
  })
  .strip();

export const SearchGoogleScholarSchema = z
  .object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).max(20).optional().default(10),
    yearLow: z.number().int().optional(),
    yearHigh: z.number().int().optional(),
    author: z.string().optional()
  })
  .strip();

export const GetPaperByDoiSchema = z
  .object({
    doi: z.coerce.string().min(1),
    platform: z
      .enum([
        'arxiv',
        'webofscience',
        'pubmed',
        'crossref',
        'openalex',
        'unpaywall',
        'pmc',
        'europepmc',
        'core',
        'all'
      ])
      .optional()
      .default('all')
  })
  .strip();

export const SearchSciHubSchema = z
  .object({
    doiOrUrl: z.coerce.string().min(1),
    downloadPdf: z.boolean().optional().default(false),
    savePath: z.coerce.string().optional()
  })
  .strip();

export const CheckSciHubMirrorsSchema = z
  .object({
    forceCheck: z.boolean().optional().default(false)
  })
  .strip();

export const SearchScienceDirectSchema = z
  .object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).max(100).optional().default(10),
    year: z.string().optional(),
    author: z.string().optional(),
    journal: z.string().optional(),
    openAccess: z.boolean().optional()
  })
  .strip();

export const SearchSpringerSchema = z
  .object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).max(100).optional().default(10),
    year: z.string().optional(),
    author: z.string().optional(),
    journal: z.string().optional(),
    subject: z.string().optional(),
    openAccess: z.boolean().optional(),
    type: z.enum(['Journal', 'Book', 'Chapter']).optional()
  })
  .strip();

export const SearchWileySchema = z
  .object({
    query: z.string().min(1)
  })
  .strip();

export const SearchScopusSchema = z
  .object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).max(25).optional().default(10),
    year: z.string().optional(),
    author: z.string().optional(),
    journal: z.string().optional(),
    affiliation: z.string().optional(),
    subject: z.string().optional(),
    openAccess: z.boolean().optional(),
    documentType: z.enum(['ar', 'cp', 're', 'bk', 'ch']).optional()
  })
  .strip();

export const SearchCrossrefSchema = z
  .object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).max(100).optional().default(10),
    year: z.string().optional(),
    author: z.string().optional(),
    sortBy: SortBySchema.optional().default('relevance'),
    sortOrder: SortOrderSchema.optional().default('desc')
  })
  .strip();

export const SearchOpenAlexSchema = z
  .object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).max(100).optional().default(10),
    year: z.string().optional()
  })
  .strip();

export const SearchUnpaywallSchema = z
  .object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).max(1).optional().default(1)
  })
  .strip();

export const SearchPMCStyleSchema = z
  .object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).max(100).optional().default(10),
    year: z.string().optional()
  })
  .strip();

export const DownloadWithFallbackSchema = z
  .object({
    source: z.coerce.string().min(1),
    paperId: z.coerce.string().min(1),
    doi: z.coerce.string().optional().default(''),
    title: z.coerce.string().optional().default(''),
    savePath: z.coerce.string().optional(),
    useSciHub: z.boolean().optional().default(false)
  })
  .strip();

export const GetPlatformStatusSchema = z
  .object({
    validate: z.boolean().optional().default(false)
  })
  .strip();

export type ToolName =
  | 'search_papers'
  | 'search_arxiv'
  | 'search_webofscience'
  | 'search_pubmed'
  | 'search_biorxiv'
  | 'search_medrxiv'
  | 'search_semantic_scholar'
  | 'search_semantic_snippets'
  | 'search_iacr'
  | 'download_paper'
  | 'search_google_scholar'
  | 'get_paper_by_doi'
  | 'search_scihub'
  | 'check_scihub_mirrors'
  | 'get_platform_status'
  | 'search_sciencedirect'
  | 'search_springer'
  | 'search_wiley'
  | 'search_scopus'
  | 'search_crossref'
  | 'search_openalex'
  | 'search_unpaywall'
  | 'search_pmc'
  | 'search_europepmc'
  | 'search_core'
  | 'search_openaire'
  | 'download_with_fallback';

export function parseToolArgs(toolName: ToolName, args: unknown): any {
  switch (toolName) {
    case 'search_papers':
      return SearchPapersSchema.parse(args);
    case 'search_arxiv':
      return SearchArxivSchema.parse(args);
    case 'search_webofscience':
      return SearchWebOfScienceSchema.parse(args);
    case 'search_pubmed':
      return SearchPubMedSchema.parse(args);
    case 'search_biorxiv':
      return SearchBioRxivSchema.parse(args);
    case 'search_medrxiv':
      return SearchMedRxivSchema.parse(args);
    case 'search_semantic_scholar':
      return SearchSemanticScholarSchema.parse(args);
    case 'search_semantic_snippets':
      return SearchSemanticSnippetsSchema.parse(args);
    case 'search_iacr':
      return SearchIACRSchema.parse(args);
    case 'download_paper':
      return DownloadPaperSchema.parse(args);
    case 'search_google_scholar':
      return SearchGoogleScholarSchema.parse(args);
    case 'get_paper_by_doi':
      return GetPaperByDoiSchema.parse(args);
    case 'search_scihub':
      return SearchSciHubSchema.parse(args);
    case 'check_scihub_mirrors':
      return CheckSciHubMirrorsSchema.parse(args);
    case 'get_platform_status':
      return GetPlatformStatusSchema.parse(args ?? {});
    case 'search_sciencedirect':
      return SearchScienceDirectSchema.parse(args);
    case 'search_springer':
      return SearchSpringerSchema.parse(args);
    case 'search_wiley':
      return SearchWileySchema.parse(args);
    case 'search_scopus':
      return SearchScopusSchema.parse(args);
    case 'search_crossref':
      return SearchCrossrefSchema.parse(args);
    case 'search_openalex':
      return SearchOpenAlexSchema.parse(args);
    case 'search_unpaywall':
      return SearchUnpaywallSchema.parse(args);
    case 'search_pmc':
    case 'search_europepmc':
    case 'search_core':
    case 'search_openaire':
      return SearchPMCStyleSchema.parse(args);
    case 'download_with_fallback':
      return DownloadWithFallbackSchema.parse(args);
    default:
      return args;
  }
}
