import { z } from 'zod';
export declare const SearchPapersSchema: z.ZodObject<{
    query: z.ZodString;
    platform: z.ZodDefault<z.ZodOptional<z.ZodEnum<["arxiv", "webofscience", "pubmed", "wos", "biorxiv", "medrxiv", "semantic", "iacr", "googlescholar", "scholar", "scihub", "sciencedirect", "springer", "scopus", "crossref", "openalex", "unpaywall", "pmc", "europepmc", "core", "openaire", "all"]>>>;
    sources: z.ZodOptional<z.ZodString>;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    year: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    journal: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    days: z.ZodOptional<z.ZodNumber>;
    fetchDetails: z.ZodOptional<z.ZodBoolean>;
    fieldsOfStudy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["relevance", "date", "citations"]>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    query: string;
    platform: "arxiv" | "webofscience" | "pubmed" | "wos" | "biorxiv" | "medrxiv" | "semantic" | "iacr" | "googlescholar" | "scholar" | "scihub" | "sciencedirect" | "springer" | "scopus" | "crossref" | "openalex" | "unpaywall" | "pmc" | "europepmc" | "core" | "openaire" | "all";
    maxResults: number;
    sortOrder: "asc" | "desc";
    sortBy: "relevance" | "date" | "citations";
    author?: string | undefined;
    journal?: string | undefined;
    year?: string | undefined;
    fetchDetails?: boolean | undefined;
    fieldsOfStudy?: string[] | undefined;
    days?: number | undefined;
    category?: string | undefined;
    sources?: string | undefined;
}, {
    query: string;
    author?: string | undefined;
    journal?: string | undefined;
    platform?: "arxiv" | "webofscience" | "pubmed" | "wos" | "biorxiv" | "medrxiv" | "semantic" | "iacr" | "googlescholar" | "scholar" | "scihub" | "sciencedirect" | "springer" | "scopus" | "crossref" | "openalex" | "unpaywall" | "pmc" | "europepmc" | "core" | "openaire" | "all" | undefined;
    year?: string | undefined;
    maxResults?: number | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    sortBy?: "relevance" | "date" | "citations" | undefined;
    fetchDetails?: boolean | undefined;
    fieldsOfStudy?: string[] | undefined;
    days?: number | undefined;
    category?: string | undefined;
    sources?: string | undefined;
}>;
export declare const SearchArxivSchema: z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    category: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodOptional<z.ZodEnum<["relevance", "date", "citations"]>>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    query: string;
    maxResults: number;
    author?: string | undefined;
    year?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    sortBy?: "relevance" | "date" | "citations" | undefined;
    category?: string | undefined;
}, {
    query: string;
    author?: string | undefined;
    year?: string | undefined;
    maxResults?: number | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    sortBy?: "relevance" | "date" | "citations" | undefined;
    category?: string | undefined;
}>;
export declare const SearchWebOfScienceSchema: z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    year: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    journal: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodOptional<z.ZodEnum<["relevance", "date", "citations", "title", "author", "journal"]>>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    query: string;
    maxResults: number;
    author?: string | undefined;
    journal?: string | undefined;
    year?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    sortBy?: "relevance" | "date" | "citations" | "title" | "author" | "journal" | undefined;
}, {
    query: string;
    author?: string | undefined;
    journal?: string | undefined;
    year?: string | undefined;
    maxResults?: number | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    sortBy?: "relevance" | "date" | "citations" | "title" | "author" | "journal" | undefined;
}>;
export declare const SearchPubMedSchema: z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    year: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    journal: z.ZodOptional<z.ZodString>;
    publicationType: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sortBy: z.ZodOptional<z.ZodEnum<["relevance", "date"]>>;
}, "strip", z.ZodTypeAny, {
    query: string;
    maxResults: number;
    author?: string | undefined;
    journal?: string | undefined;
    year?: string | undefined;
    sortBy?: "relevance" | "date" | undefined;
    publicationType?: string[] | undefined;
}, {
    query: string;
    author?: string | undefined;
    journal?: string | undefined;
    year?: string | undefined;
    maxResults?: number | undefined;
    sortBy?: "relevance" | "date" | undefined;
    publicationType?: string[] | undefined;
}>;
export declare const SearchBioRxivSchema: z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    days: z.ZodOptional<z.ZodNumber>;
    category: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    query: string;
    maxResults: number;
    days?: number | undefined;
    category?: string | undefined;
}, {
    query: string;
    maxResults?: number | undefined;
    days?: number | undefined;
    category?: string | undefined;
}>;
export declare const SearchMedRxivSchema: z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    days: z.ZodOptional<z.ZodNumber>;
    category: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    query: string;
    maxResults: number;
    days?: number | undefined;
    category?: string | undefined;
}, {
    query: string;
    maxResults?: number | undefined;
    days?: number | undefined;
    category?: string | undefined;
}>;
export declare const SearchSemanticScholarSchema: z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    year: z.ZodOptional<z.ZodString>;
    fieldsOfStudy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    query: string;
    maxResults: number;
    year?: string | undefined;
    fieldsOfStudy?: string[] | undefined;
}, {
    query: string;
    year?: string | undefined;
    maxResults?: number | undefined;
    fieldsOfStudy?: string[] | undefined;
}>;
export declare const SearchSemanticSnippetsSchema: z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    year: z.ZodOptional<z.ZodString>;
    fieldsOfStudy: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    paperIds: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    authors: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    venue: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    minCitationCount: z.ZodOptional<z.ZodNumber>;
    publicationDateOrYear: z.ZodOptional<z.ZodString>;
    fields: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
}, "strip", z.ZodTypeAny, {
    query: string;
    limit: number;
    year?: string | undefined;
    fieldsOfStudy?: string | string[] | undefined;
    authors?: string | string[] | undefined;
    venue?: string | string[] | undefined;
    fields?: string | string[] | undefined;
    paperIds?: string | string[] | undefined;
    minCitationCount?: number | undefined;
    publicationDateOrYear?: string | undefined;
}, {
    query: string;
    year?: string | undefined;
    limit?: number | undefined;
    fieldsOfStudy?: string | string[] | undefined;
    authors?: string | string[] | undefined;
    venue?: string | string[] | undefined;
    fields?: string | string[] | undefined;
    paperIds?: string | string[] | undefined;
    minCitationCount?: number | undefined;
    publicationDateOrYear?: string | undefined;
}>;
export declare const SearchIACRSchema: z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    fetchDetails: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    query: string;
    maxResults: number;
    fetchDetails?: boolean | undefined;
}, {
    query: string;
    maxResults?: number | undefined;
    fetchDetails?: boolean | undefined;
}>;
export declare const DownloadPaperSchema: z.ZodObject<{
    paperId: z.ZodString;
    platform: z.ZodEnum<["arxiv", "biorxiv", "medrxiv", "semantic", "iacr", "scihub", "springer", "wiley", "pmc", "europepmc", "core"]>;
    savePath: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    paperId: string;
    platform: "arxiv" | "biorxiv" | "medrxiv" | "semantic" | "iacr" | "scihub" | "springer" | "pmc" | "europepmc" | "core" | "wiley";
    savePath?: string | undefined;
}, {
    paperId: string;
    platform: "arxiv" | "biorxiv" | "medrxiv" | "semantic" | "iacr" | "scihub" | "springer" | "pmc" | "europepmc" | "core" | "wiley";
    savePath?: string | undefined;
}>;
export declare const SearchGoogleScholarSchema: z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    yearLow: z.ZodOptional<z.ZodNumber>;
    yearHigh: z.ZodOptional<z.ZodNumber>;
    author: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    query: string;
    maxResults: number;
    author?: string | undefined;
    yearLow?: number | undefined;
    yearHigh?: number | undefined;
}, {
    query: string;
    author?: string | undefined;
    maxResults?: number | undefined;
    yearLow?: number | undefined;
    yearHigh?: number | undefined;
}>;
export declare const GetPaperByDoiSchema: z.ZodObject<{
    doi: z.ZodString;
    platform: z.ZodDefault<z.ZodOptional<z.ZodEnum<["arxiv", "webofscience", "pubmed", "crossref", "openalex", "unpaywall", "pmc", "europepmc", "core", "all"]>>>;
}, "strip", z.ZodTypeAny, {
    platform: "arxiv" | "webofscience" | "pubmed" | "crossref" | "openalex" | "unpaywall" | "pmc" | "europepmc" | "core" | "all";
    doi: string;
}, {
    doi: string;
    platform?: "arxiv" | "webofscience" | "pubmed" | "crossref" | "openalex" | "unpaywall" | "pmc" | "europepmc" | "core" | "all" | undefined;
}>;
export declare const SearchSciHubSchema: z.ZodObject<{
    doiOrUrl: z.ZodString;
    downloadPdf: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    savePath: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    doiOrUrl: string;
    downloadPdf: boolean;
    savePath?: string | undefined;
}, {
    doiOrUrl: string;
    savePath?: string | undefined;
    downloadPdf?: boolean | undefined;
}>;
export declare const CheckSciHubMirrorsSchema: z.ZodObject<{
    forceCheck: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    forceCheck: boolean;
}, {
    forceCheck?: boolean | undefined;
}>;
export declare const SearchScienceDirectSchema: z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    year: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    journal: z.ZodOptional<z.ZodString>;
    openAccess: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    query: string;
    maxResults: number;
    author?: string | undefined;
    journal?: string | undefined;
    year?: string | undefined;
    openAccess?: boolean | undefined;
}, {
    query: string;
    author?: string | undefined;
    journal?: string | undefined;
    year?: string | undefined;
    maxResults?: number | undefined;
    openAccess?: boolean | undefined;
}>;
export declare const SearchSpringerSchema: z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    year: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    journal: z.ZodOptional<z.ZodString>;
    subject: z.ZodOptional<z.ZodString>;
    openAccess: z.ZodOptional<z.ZodBoolean>;
    type: z.ZodOptional<z.ZodEnum<["Journal", "Book", "Chapter"]>>;
}, "strip", z.ZodTypeAny, {
    query: string;
    maxResults: number;
    type?: "Journal" | "Book" | "Chapter" | undefined;
    author?: string | undefined;
    journal?: string | undefined;
    year?: string | undefined;
    subject?: string | undefined;
    openAccess?: boolean | undefined;
}, {
    query: string;
    type?: "Journal" | "Book" | "Chapter" | undefined;
    author?: string | undefined;
    journal?: string | undefined;
    year?: string | undefined;
    maxResults?: number | undefined;
    subject?: string | undefined;
    openAccess?: boolean | undefined;
}>;
export declare const SearchWileySchema: z.ZodObject<{
    query: z.ZodString;
}, "strip", z.ZodTypeAny, {
    query: string;
}, {
    query: string;
}>;
export declare const SearchScopusSchema: z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    year: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    journal: z.ZodOptional<z.ZodString>;
    affiliation: z.ZodOptional<z.ZodString>;
    subject: z.ZodOptional<z.ZodString>;
    openAccess: z.ZodOptional<z.ZodBoolean>;
    documentType: z.ZodOptional<z.ZodEnum<["ar", "cp", "re", "bk", "ch"]>>;
}, "strip", z.ZodTypeAny, {
    query: string;
    maxResults: number;
    author?: string | undefined;
    journal?: string | undefined;
    year?: string | undefined;
    affiliation?: string | undefined;
    subject?: string | undefined;
    openAccess?: boolean | undefined;
    documentType?: "ar" | "cp" | "re" | "bk" | "ch" | undefined;
}, {
    query: string;
    author?: string | undefined;
    journal?: string | undefined;
    year?: string | undefined;
    maxResults?: number | undefined;
    affiliation?: string | undefined;
    subject?: string | undefined;
    openAccess?: boolean | undefined;
    documentType?: "ar" | "cp" | "re" | "bk" | "ch" | undefined;
}>;
export declare const SearchCrossrefSchema: z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    year: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["relevance", "date", "citations"]>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    query: string;
    maxResults: number;
    sortOrder: "asc" | "desc";
    sortBy: "relevance" | "date" | "citations";
    author?: string | undefined;
    year?: string | undefined;
}, {
    query: string;
    author?: string | undefined;
    year?: string | undefined;
    maxResults?: number | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    sortBy?: "relevance" | "date" | "citations" | undefined;
}>;
export declare const SearchOpenAlexSchema: z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    year: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    query: string;
    maxResults: number;
    year?: string | undefined;
}, {
    query: string;
    year?: string | undefined;
    maxResults?: number | undefined;
}>;
export declare const SearchUnpaywallSchema: z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    query: string;
    maxResults: number;
}, {
    query: string;
    maxResults?: number | undefined;
}>;
export declare const SearchPMCStyleSchema: z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    year: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    query: string;
    maxResults: number;
    year?: string | undefined;
}, {
    query: string;
    year?: string | undefined;
    maxResults?: number | undefined;
}>;
export declare const DownloadWithFallbackSchema: z.ZodObject<{
    source: z.ZodString;
    paperId: z.ZodString;
    doi: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    title: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    savePath: z.ZodOptional<z.ZodString>;
    useSciHub: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    paperId: string;
    doi: string;
    source: string;
    useSciHub: boolean;
    savePath?: string | undefined;
}, {
    paperId: string;
    source: string;
    title?: string | undefined;
    doi?: string | undefined;
    savePath?: string | undefined;
    useSciHub?: boolean | undefined;
}>;
export declare const GetPlatformStatusSchema: z.ZodObject<{
    validate: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    validate: boolean;
}, {
    validate?: boolean | undefined;
}>;
export type ToolName = 'search_papers' | 'search_arxiv' | 'search_webofscience' | 'search_pubmed' | 'search_biorxiv' | 'search_medrxiv' | 'search_semantic_scholar' | 'search_semantic_snippets' | 'search_iacr' | 'download_paper' | 'search_google_scholar' | 'get_paper_by_doi' | 'search_scihub' | 'check_scihub_mirrors' | 'get_platform_status' | 'search_sciencedirect' | 'search_springer' | 'search_wiley' | 'search_scopus' | 'search_crossref' | 'search_openalex' | 'search_unpaywall' | 'search_pmc' | 'search_europepmc' | 'search_core' | 'search_openaire' | 'download_with_fallback';
export declare function parseToolArgs(toolName: ToolName, args: unknown): any;
//# sourceMappingURL=schemas.d.ts.map