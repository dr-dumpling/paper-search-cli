import { z } from 'zod';
import { HARD_CORE_MAX_RESULTS_CAP, getCoreMaxResultsCap } from '../../config/ResultCaps.js';
import { isKnownSearchPlatform } from '../../registry/platformMetadata.js';
const SortBySchema = z.enum(['relevance', 'date', 'citations']);
const SortOrderSchema = z.enum(['asc', 'desc']);
const SearchPlatformSchema = z
    .string()
    .min(1)
    .refine(value => value === 'all' || isKnownSearchPlatform(value), {
    message: 'Unsupported search platform'
});
function assertCoreMaxResults(value, ctx) {
    const cap = getCoreMaxResultsCap();
    if (value > cap) {
        ctx.addIssue({
            code: z.ZodIssueCode.too_big,
            maximum: cap,
            type: 'number',
            inclusive: true,
            message: `Number must be less than or equal to ${cap}`,
            path: ['maxResults']
        });
    }
}
export const SearchPapersSchema = z
    .object({
    query: z.string().min(1),
    platform: z
        .union([SearchPlatformSchema, z.literal('all')])
        .optional()
        .default('crossref'),
    sources: z.string().optional(),
    maxResults: z.number().int().min(1).max(HARD_CORE_MAX_RESULTS_CAP).optional().default(10),
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
    .strip()
    .superRefine((value, ctx) => {
    if (!value.sources && value.platform === 'core') {
        assertCoreMaxResults(value.maxResults, ctx);
        return;
    }
    if (value.maxResults > 100) {
        ctx.addIssue({
            code: z.ZodIssueCode.too_big,
            maximum: 100,
            type: 'number',
            inclusive: true,
            message: 'Number must be less than or equal to 100',
            path: ['maxResults']
        });
    }
});
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
//# sourceMappingURL=schemas.js.map