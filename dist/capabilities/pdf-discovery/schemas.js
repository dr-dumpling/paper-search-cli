import { z } from 'zod';
import { isKnownSearchPlatform } from '../../registry/platformMetadata.js';
export const DownloadPaperSchema = z
    .object({
    paperId: z.coerce.string().min(1),
    platform: z.coerce.string().min(1).refine(value => value === 'wiley' || isKnownSearchPlatform(value), {
        message: 'Unsupported download platform'
    }),
    savePath: z.coerce.string().optional()
})
    .strip();
export const DownloadWithFallbackSchema = z
    .object({
    source: z.coerce.string().min(1),
    paperId: z.coerce.string().min(1),
    doi: z.coerce.string().optional().default(''),
    title: z.coerce.string().optional().default(''),
    savePath: z.coerce.string().optional(),
    useSciHub: z.boolean().optional().default(true)
})
    .strip();
//# sourceMappingURL=schemas.js.map