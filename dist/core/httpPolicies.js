export const HTTP_POLICIES = {
    crossref: {
        rateLimit: { rps: 1 },
        cache: { ttlMs: 3_600_000 },
        timeoutMs: 10_000
    },
    openalex: {
        rateLimit: { rps: 1 },
        cache: { ttlMs: 3_600_000 },
        timeoutMs: 10_000
    },
    arxiv: {
        rateLimit: { rps: 0.33 },
        timeoutMs: 10_000
    }
};
//# sourceMappingURL=httpPolicies.js.map