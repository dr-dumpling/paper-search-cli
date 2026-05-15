/**
 * Application constants and configuration
 * Centralized configuration for timeouts, limits, and other settings
 */
/**
 * API Timeout Configuration (in milliseconds)
 */
export declare const TIMEOUTS: {
    /** Default timeout for API requests */
    readonly DEFAULT: 30000;
    /** Extended timeout for slow APIs */
    readonly EXTENDED: 60000;
    /** Short timeout for health checks */
    readonly HEALTH_CHECK: 10000;
    /** Timeout for PDF downloads */
    readonly DOWNLOAD: 120000;
    /** Timeout for batch operations */
    readonly BATCH: 90000;
    /** Per-source timeout for fan-out operations */
    readonly SOURCE_TASK: 15000;
    /** Timeout buffer for withTimeout wrapper */
    readonly BUFFER: 5000;
};
/**
 * Rate Limiting Configuration
 */
export declare const RATE_LIMITS: {
    /** Default requests per second */
    readonly DEFAULT_RPS: 1;
    /** Conservative requests per second */
    readonly CONSERVATIVE_RPS: 0.5;
    /** Aggressive requests per second (for high-limit APIs) */
    readonly AGGRESSIVE_RPS: 5;
    /** Default burst capacity */
    readonly DEFAULT_BURST: 5;
};
/**
 * Search Limits
 */
export declare const SEARCH_LIMITS: {
    /** Default number of results */
    readonly DEFAULT_RESULTS: 10;
    /** Maximum results per request */
    readonly MAX_RESULTS: 100;
    /** Maximum query length */
    readonly MAX_QUERY_LENGTH: 1000;
    /** Maximum boolean operators in query */
    readonly MAX_BOOLEAN_OPERATORS: 10;
};
/**
 * API Endpoints
 */
export declare const API_ENDPOINTS: {
    readonly CROSSREF: "https://api.crossref.org/works";
    readonly OPENCITATIONS: "https://opencitations.net/index/coci/api/v1";
    readonly WOS_STARTER: "https://api.clarivate.com/apis/wos-starter";
    readonly SPRINGER_META: "https://api.springernature.com/meta/v2";
    readonly SPRINGER_OA: "https://api.springernature.com/openaccess";
    readonly ELSEVIER: "https://api.elsevier.com";
    readonly SEMANTIC_SCHOLAR: "https://api.semanticscholar.org/graph/v1";
    readonly ARXIV: "http://export.arxiv.org/api";
    readonly PUBMED: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
    readonly BIORXIV: "https://api.biorxiv.org";
    readonly MEDRXIV: "https://api.medrxiv.org";
    readonly WILEY_TDM: "https://api.wiley.com/onlinelibrary/tdm/v1";
};
/**
 * Default User Agent
 */
export declare const USER_AGENT = "Paper-Search-CLI/1.0 (Academic Research Tool)";
/**
 * Default mailto for Crossref polite pool
 */
export declare const DEFAULT_MAILTO: string;
/**
 * DOI validation pattern
 */
export declare const DOI_PATTERN: RegExp;
/**
 * Maximum DOI length
 */
export declare const MAX_DOI_LENGTH = 256;
declare const _default: {
    TIMEOUTS: {
        /** Default timeout for API requests */
        readonly DEFAULT: 30000;
        /** Extended timeout for slow APIs */
        readonly EXTENDED: 60000;
        /** Short timeout for health checks */
        readonly HEALTH_CHECK: 10000;
        /** Timeout for PDF downloads */
        readonly DOWNLOAD: 120000;
        /** Timeout for batch operations */
        readonly BATCH: 90000;
        /** Per-source timeout for fan-out operations */
        readonly SOURCE_TASK: 15000;
        /** Timeout buffer for withTimeout wrapper */
        readonly BUFFER: 5000;
    };
    RATE_LIMITS: {
        /** Default requests per second */
        readonly DEFAULT_RPS: 1;
        /** Conservative requests per second */
        readonly CONSERVATIVE_RPS: 0.5;
        /** Aggressive requests per second (for high-limit APIs) */
        readonly AGGRESSIVE_RPS: 5;
        /** Default burst capacity */
        readonly DEFAULT_BURST: 5;
    };
    SEARCH_LIMITS: {
        /** Default number of results */
        readonly DEFAULT_RESULTS: 10;
        /** Maximum results per request */
        readonly MAX_RESULTS: 100;
        /** Maximum query length */
        readonly MAX_QUERY_LENGTH: 1000;
        /** Maximum boolean operators in query */
        readonly MAX_BOOLEAN_OPERATORS: 10;
    };
    API_ENDPOINTS: {
        readonly CROSSREF: "https://api.crossref.org/works";
        readonly OPENCITATIONS: "https://opencitations.net/index/coci/api/v1";
        readonly WOS_STARTER: "https://api.clarivate.com/apis/wos-starter";
        readonly SPRINGER_META: "https://api.springernature.com/meta/v2";
        readonly SPRINGER_OA: "https://api.springernature.com/openaccess";
        readonly ELSEVIER: "https://api.elsevier.com";
        readonly SEMANTIC_SCHOLAR: "https://api.semanticscholar.org/graph/v1";
        readonly ARXIV: "http://export.arxiv.org/api";
        readonly PUBMED: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
        readonly BIORXIV: "https://api.biorxiv.org";
        readonly MEDRXIV: "https://api.medrxiv.org";
        readonly WILEY_TDM: "https://api.wiley.com/onlinelibrary/tdm/v1";
    };
    USER_AGENT: string;
    DEFAULT_MAILTO: string;
    DOI_PATTERN: RegExp;
    MAX_DOI_LENGTH: number;
};
export default _default;
//# sourceMappingURL=constants.d.ts.map