import { z } from 'zod';
import { getGenericSearchToolPlatform } from '../registry/platformMetadata.js';
import { HARD_CORE_MAX_RESULTS_CAP, getCoreMaxResultsCap } from '../config/ResultCaps.js';
import { SearchSemanticSnippetsSchema } from '../capabilities/body-snippet-search/schemas.js';
import { CitationLookupSchema } from '../capabilities/citation-expansion/schemas.js';
import { GetPaperByDoiSchema, SearchPapersSchema } from '../capabilities/metadata-search/schemas.js';
import { QueryJournalMetricsSchema } from '../capabilities/journal-metrics/schemas.js';
import { DownloadPaperSchema, DownloadWithFallbackSchema } from '../capabilities/pdf-discovery/schemas.js';

export { CitationLookupSchema };
export { DownloadPaperSchema, DownloadWithFallbackSchema };
export { GetPaperByDoiSchema, SearchPapersSchema };
export { QueryJournalMetricsSchema };
export { SearchSemanticSnippetsSchema };

const SortBySchema = z.enum(['relevance', 'date', 'citations']);
const SortOrderSchema = z.enum(['asc', 'desc']);

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

export const SearchIACRSchema = z
  .object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).max(50).optional().default(10),
    fetchDetails: z.boolean().optional()
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

export const SearchCoreSchema = z
  .object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).optional().default(10),
    year: z.string().optional()
  })
  .strip()
  .superRefine((value, ctx) => {
    assertCoreMaxResults(value.maxResults, ctx);
  });

export const GenericPlatformSearchSchema = z
  .object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).max(100).optional().default(10),
    year: z.string().optional(),
    author: z.string().optional(),
    journal: z.string().optional(),
    venue: z.string().optional(),
    articleTitle: z.string().optional(),
    startRecord: z.number().int().min(1).optional(),
    sortBy: SortBySchema.optional().default('relevance'),
    sortOrder: SortOrderSchema.optional().default('desc')
  })
  .strip();

export const GetPlatformStatusSchema = z
  .object({
    validate: z.boolean().optional().default(false)
  })
  .strip();

export type ToolName =
  | string
  | 'search_papers'
  | 'search_arxiv'
  | 'search_webofscience'
  | 'search_pubmed'
  | 'search_biorxiv'
  | 'search_medrxiv'
  | 'search_semantic_scholar'
  | 'search_semantic_snippets'
  | 'get_paper_citations'
  | 'get_paper_references'
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
  | 'download_with_fallback'
  | 'query_journal_metrics';

export function parseToolArgs(toolName: ToolName, args: unknown): any {
  if (getGenericSearchToolPlatform(String(toolName))) {
    return GenericPlatformSearchSchema.parse(args);
  }

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
    case 'get_paper_citations':
    case 'get_paper_references':
      return CitationLookupSchema.parse(args);
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
    case 'query_journal_metrics':
      return QueryJournalMetricsSchema.parse(args ?? {});
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
    case 'search_openaire':
      return SearchPMCStyleSchema.parse(args);
    case 'search_core':
      return SearchCoreSchema.parse(args);
    case 'download_with_fallback':
      return DownloadWithFallbackSchema.parse(args);
    default:
      return args;
  }
}

function assertCoreMaxResults(maxResults: number, ctx: z.RefinementCtx): void {
  const cap = getCoreMaxResultsCap();
  if (maxResults > cap) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      maximum: cap,
      type: 'number',
      inclusive: true,
      message: `CORE maxResults must be less than or equal to ${cap}. Configure CORE_MAX_RESULTS_CAP up to ${HARD_CORE_MAX_RESULTS_CAP} to raise this limit.`,
      path: ['maxResults']
    });
  }
}
