export async function runLiveSmoke(runner) {
    const checks = buildLiveSmokeChecks(runner.hasConfig);
    const cases = [];
    for (const check of checks) {
        if (check.skipWhen) {
            const severity = check.configured || check.enabled ? check.severity : 'skipped';
            cases.push({
                name: check.name,
                ok: true,
                severity,
                status: 'skipped',
                skipped: true,
                configured: check.configured,
                enabled: check.enabled,
                tool: check.tool,
                message: check.skipMessage || 'Skipped.',
                remediation: severity === 'skipped' ? undefined : check.remediation,
                data: check.data
            });
            continue;
        }
        if (!check.tool) {
            cases.push({
                name: check.name,
                ok: true,
                severity: check.severity,
                status: 'passed',
                configured: check.configured,
                enabled: check.enabled,
                message: check.passMessage,
                data: check.data
            });
            continue;
        }
        try {
            const result = await runner.callTool(check.tool, check.args || {});
            const passed = result.ok && (check.validate ? check.validate(result) : true);
            cases.push({
                name: check.name,
                ok: passed,
                severity: check.severity,
                status: passed ? 'passed' : 'failed',
                configured: check.configured,
                enabled: check.enabled,
                tool: check.tool,
                message: passed ? check.passMessage : `${check.failMessage}: ${result.message || 'no result message'}`,
                remediation: passed ? undefined : check.remediation,
                data: result.data
            });
        }
        catch (error) {
            cases.push({
                name: check.name,
                ok: false,
                severity: check.severity,
                status: 'failed',
                configured: check.configured,
                enabled: check.enabled,
                tool: check.tool,
                message: `${check.failMessage}: ${error?.message || String(error)}`,
                remediation: check.remediation
            });
        }
    }
    return summarizeLiveSmoke(cases, runner.capabilityProfile, runner.skillStatus);
}
export function summarizeLiveSmoke(cases, capabilityProfile, skillStatus) {
    const severityCounts = {
        critical: 0,
        degraded: 0,
        warning: 0,
        skipped: 0
    };
    for (const item of cases) {
        if (!item.ok || item.status === 'skipped') {
            severityCounts[item.severity] += 1;
        }
    }
    const failedCases = cases.filter(item => !item.ok && item.severity === 'critical');
    const degradedCases = cases.filter(item => !item.ok && item.severity === 'degraded');
    const nextSteps = [
        'Review degraded cases and run the listed remediation commands if a configured capability should work.',
        'Run "paper-search doctor --pretty" to inspect masked configuration and capability profile.',
        'Run "paper-search config list --pretty" to confirm key sources without exposing raw secrets.'
    ];
    return {
        ok: failedCases.length === 0,
        mode: 'live',
        cases,
        failedCases,
        degradedCases,
        severityCounts,
        capabilityProfile,
        skillStatus,
        nextSteps,
        exitCode: failedCases.length > 0 ? 1 : 0
    };
}
function buildLiveSmokeChecks(hasConfig) {
    const hasSemantic = hasConfig('SEMANTIC_SCHOLAR_API_KEY');
    const hasEasyScholar = hasConfig('EASYSCHOLAR_KEY');
    const hasWos = hasConfig('WOS_API_KEY');
    const hasElsevier = hasConfig('ELSEVIER_API_KEY');
    const hasSpringer = hasConfig('SPRINGER_API_KEY');
    const hasIeee = hasConfig('IEEE_API_KEY');
    const hasWiley = hasConfig('WILEY_TDM_TOKEN');
    return [
        {
            name: 'free metadata search (Crossref)',
            tool: 'search_crossref',
            args: { query: 'machine learning', maxResults: 1 },
            severity: 'critical',
            passMessage: 'Free metadata search returned a live response.',
            failMessage: 'Free metadata search failed',
            remediation: 'Check network/proxy settings, then rerun `paper-search search "machine learning" --platform crossref --max-results 1 --pretty`.'
        },
        {
            name: 'Sci-Hub availability fallback',
            tool: 'check_scihub_mirrors',
            args: { forceCheck: true },
            severity: 'degraded',
            enabled: true,
            passMessage: 'Sci-Hub fallback is enabled and at least one mirror is reachable.',
            failMessage: 'Sci-Hub fallback is enabled, but no mirror passed the lightweight availability check',
            remediation: 'Check local network access to Sci-Hub mirrors, proxy settings, or rerun later. Live smoke does not download PDFs.',
            validate: result => Array.isArray(result.data) && result.data.some((item) => item?.status === 'Working')
        },
        {
            name: 'Semantic Scholar snippet capability',
            tool: 'search_semantic_snippets',
            args: { query: 'machine learning', limit: 1 },
            severity: 'degraded',
            configured: hasSemantic,
            skipWhen: !hasSemantic,
            skipMessage: 'SEMANTIC_SCHOLAR_API_KEY is not configured; body snippet live check skipped.',
            passMessage: 'SEMANTIC_SCHOLAR_API_KEY is configured and snippet search responded.',
            failMessage: 'SEMANTIC_SCHOLAR_API_KEY is configured, but snippet search could not be verified',
            remediation: 'Run `paper-search config get SEMANTIC_SCHOLAR_API_KEY --pretty`, confirm the key is valid and has quota, then rerun `paper-search run search_semantic_snippets --arg query="machine learning" --arg limit=1 --pretty`.'
        },
        {
            name: 'EasyScholar journal metrics',
            tool: 'query_journal_metrics',
            args: { journals: ['Nature'] },
            severity: 'degraded',
            configured: hasEasyScholar,
            skipWhen: !hasEasyScholar,
            skipMessage: 'EASYSCHOLAR_KEY is not configured; journal metrics live check skipped.',
            passMessage: 'EASYSCHOLAR_KEY is configured and journal metrics responded.',
            failMessage: 'EASYSCHOLAR_KEY is configured, but journal metrics could not be verified',
            remediation: 'Run `paper-search config get EASYSCHOLAR_KEY --pretty`, confirm the EasyScholar SecretKey is valid, then rerun `paper-search journal-metrics "Nature" --pretty`.'
        },
        {
            name: 'Web of Science metadata',
            tool: 'search_webofscience',
            args: { query: 'machine learning', maxResults: 1 },
            severity: 'degraded',
            configured: hasWos,
            skipWhen: !hasWos,
            skipMessage: 'WOS_API_KEY is not configured; Web of Science live check skipped.',
            passMessage: 'WOS_API_KEY is configured and Web of Science metadata responded.',
            failMessage: 'WOS_API_KEY is configured, but Web of Science metadata could not be verified',
            remediation: 'Run `paper-search config get WOS_API_KEY --pretty`, confirm Clarivate API entitlement/version, then rerun `paper-search run search_webofscience --arg query="machine learning" --arg maxResults=1 --pretty`.'
        },
        {
            name: 'ScienceDirect metadata',
            tool: 'search_sciencedirect',
            args: { query: 'machine learning', maxResults: 1 },
            severity: 'degraded',
            configured: hasElsevier,
            skipWhen: !hasElsevier,
            skipMessage: 'ELSEVIER_API_KEY is not configured; ScienceDirect live check skipped.',
            passMessage: 'ELSEVIER_API_KEY is configured and ScienceDirect metadata responded.',
            failMessage: 'ELSEVIER_API_KEY is configured, but ScienceDirect metadata could not be verified',
            remediation: 'Run `paper-search config get ELSEVIER_API_KEY --pretty`, confirm Elsevier product entitlement, then rerun `paper-search run search_sciencedirect --arg query="machine learning" --arg maxResults=1 --pretty`.'
        },
        {
            name: 'Scopus metadata',
            tool: 'search_scopus',
            args: { query: 'machine learning', maxResults: 1 },
            severity: 'degraded',
            configured: hasElsevier,
            skipWhen: !hasElsevier,
            skipMessage: 'ELSEVIER_API_KEY is not configured; Scopus live check skipped.',
            passMessage: 'ELSEVIER_API_KEY is configured and Scopus metadata responded.',
            failMessage: 'ELSEVIER_API_KEY is configured, but Scopus metadata could not be verified',
            remediation: 'Confirm the Elsevier key has Scopus entitlement; ScienceDirect access does not automatically imply Scopus access.'
        },
        {
            name: 'Springer metadata',
            tool: 'search_springer',
            args: { query: 'machine learning', maxResults: 1 },
            severity: 'degraded',
            configured: hasSpringer,
            skipWhen: !hasSpringer,
            skipMessage: 'SPRINGER_API_KEY is not configured; Springer live check skipped.',
            passMessage: 'SPRINGER_API_KEY is configured and Springer metadata responded.',
            failMessage: 'SPRINGER_API_KEY is configured, but Springer metadata could not be verified',
            remediation: 'Run `paper-search config get SPRINGER_API_KEY --pretty`, confirm Springer API entitlement, then rerun `paper-search run search_springer --arg query="machine learning" --arg maxResults=1 --pretty`.'
        },
        {
            name: 'IEEE metadata',
            tool: 'search_ieee',
            args: { query: 'machine learning', maxResults: 1 },
            severity: 'degraded',
            configured: hasIeee,
            skipWhen: !hasIeee,
            skipMessage: 'IEEE_API_KEY is not configured; IEEE live check skipped.',
            passMessage: 'IEEE_API_KEY is configured and IEEE metadata responded.',
            failMessage: 'IEEE_API_KEY is configured, but IEEE metadata could not be verified',
            remediation: 'Run `paper-search config get IEEE_API_KEY --pretty`, confirm IEEE Xplore API entitlement, then rerun `paper-search run search_ieee --arg query="machine learning" --arg maxResults=1 --pretty`.'
        },
        {
            name: 'Wiley TDM token',
            severity: 'warning',
            configured: hasWiley,
            skipWhen: true,
            skipMessage: hasWiley
                ? 'WILEY_TDM_TOKEN is configured, but live smoke avoids Wiley DOI/full-text download checks.'
                : 'WILEY_TDM_TOKEN is not configured; Wiley live check skipped.',
            passMessage: 'Wiley TDM live smoke skipped.',
            failMessage: 'Wiley TDM live smoke skipped',
            remediation: 'Use `paper-search download <doi> --platform wiley --pretty` only when you intentionally want to test Wiley DOI download access.'
        }
    ];
}
//# sourceMappingURL=liveSmoke.js.map