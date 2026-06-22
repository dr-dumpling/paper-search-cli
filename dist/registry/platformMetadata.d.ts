import type { SearchOptions } from '../platforms/PaperSource.js';
export type PlatformSourceKind = 'official-api' | 'metadata-proxy' | 'html' | 'alias';
export type CapabilityGroup = 'metadata_search' | 'citation_expansion' | 'body_snippet_search' | 'journal_metrics' | 'pdf_discovery' | 'entitled_access';
export type CapabilityProfileSourceGroup = 'metadata_free' | 'metadata_entitled' | 'pdf_open_access' | 'pdf_entitled' | 'pdf_scihub';
export type PlatformSchemaKind = 'generic' | 'arxiv' | 'webofscience' | 'pubmed' | 'biorxiv' | 'medrxiv' | 'semantic-scholar' | 'google-scholar' | 'iacr' | 'core' | 'springer' | 'sciencedirect' | 'scopus' | 'wiley-deprecated' | 'crossref' | 'openalex' | 'pmc-style' | 'unpaywall' | 'scihub' | 'custom';
export interface PlatformMetadata {
    id: string;
    aliases?: string[];
    displayName: string;
    sourceKind: PlatformSourceKind;
    defaultInAll: boolean;
    directTool?: boolean;
    toolName?: string;
    configKeys?: string[][];
    optionalConfigKeys?: string[][];
    supportedOptions: (keyof SearchOptions)[];
    schemaKind?: PlatformSchemaKind;
    optionCaps?: {
        maxResults?: number;
    };
    capabilityGroups?: CapabilityGroup[];
    supportsDoiLookup?: boolean;
    isRepository?: boolean;
    repositoryFallbackOrder?: number;
    doiLookupOrder?: number;
    capabilityProfileSources?: {
        group: CapabilityProfileSourceGroup;
        order: number;
        source?: string;
    }[];
    description?: string;
}
export declare const PLATFORM_METADATA: PlatformMetadata[];
export declare const SEARCH_PLATFORM_IDS: string[];
export declare const SEARCH_PLATFORM_VALUES: string[];
export declare const DEFAULT_ALL_SOURCES: string[];
export declare function resolvePlatformId(platform: string): string;
export declare function isPlatformAlias(platform: string): boolean;
export declare function isKnownSearchPlatform(platform: string): boolean;
export declare function getPlatformMetadata(platform: string): PlatformMetadata | undefined;
export declare function getDefaultAllSources(): string[];
export declare function getRepositoryFallbackSources(): string[];
export declare function getDoiLookupSources(): string[];
export declare function getCapabilityProfileSources(group: CapabilityProfileSourceGroup): string[];
export declare function getCapabilityProfileConfigKeysBySource(groups: CapabilityProfileSourceGroup[]): Record<string, string[]>;
export declare function getAliasMap(): Record<string, string>;
export declare function getGenericSearchToolPlatform(toolName: string): string | undefined;
export declare function getGenericSearchToolNames(): string[];
export declare function getPlatformToolDescriptors(): PlatformMetadata[];
export declare function getGenericPlatformToolDescriptors(): PlatformMetadata[];
//# sourceMappingURL=platformMetadata.d.ts.map