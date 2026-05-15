export declare const CONFIG_KEYS: readonly ["SEMANTIC_SCHOLAR_API_KEY", "PAPER_SEARCH_UNPAYWALL_EMAIL", "UNPAYWALL_EMAIL", "PAPER_SEARCH_CORE_API_KEY", "CORE_API_KEY", "WOS_API_KEY", "WOS_API_VERSION", "PUBMED_API_KEY", "NCBI_EMAIL", "NCBI_TOOL", "ELSEVIER_API_KEY", "SPRINGER_API_KEY", "SPRINGER_OPENACCESS_API_KEY", "WILEY_TDM_TOKEN", "CROSSREF_MAILTO", "PAPER_SEARCH_OPENAIRE_API_KEY", "OPENAIRE_API_KEY", "LOG_LEVEL", "DEFAULT_DOWNLOAD_PATH", "MAX_FILE_SIZE_MB", "RATE_LIMIT_REQUESTS_PER_MINUTE", "RATE_LIMIT_BURST"];
export type ConfigKey = (typeof CONFIG_KEYS)[number];
export interface ConfigEntry {
    key: string;
    configured: boolean;
    source: 'environment' | 'user_config' | 'missing';
    value: string;
}
export declare function getConfigPath(): string;
export declare function readUserConfig(): Record<string, string>;
export declare function writeUserConfig(config: Record<string, string>): string;
export declare function initUserConfig(force?: boolean): {
    path: string;
    created: boolean;
};
export declare function setUserConfigValue(key: string, value: string): Record<string, string>;
export declare function unsetUserConfigValue(key: string): Record<string, string>;
export declare function importEnvFile(filePath: string): {
    path: string;
    imported: string[];
};
export declare function loadUserConfigIntoEnv(): string[];
export declare function listConfigEntries(includeMissing?: boolean): ConfigEntry[];
export declare function maskValue(key: string, value: string): string;
export declare function assertConfigKey(key: string): asserts key is ConfigKey;
//# sourceMappingURL=ConfigService.d.ts.map