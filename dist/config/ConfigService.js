import * as dotenv from 'dotenv';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { homedir } from 'os';
export const CONFIG_KEYS = [
    'SEMANTIC_SCHOLAR_API_KEY',
    'PAPER_SEARCH_UNPAYWALL_EMAIL',
    'UNPAYWALL_EMAIL',
    'PAPER_SEARCH_CORE_API_KEY',
    'CORE_API_KEY',
    'WOS_API_KEY',
    'WOS_API_VERSION',
    'PUBMED_API_KEY',
    'NCBI_EMAIL',
    'NCBI_TOOL',
    'ELSEVIER_API_KEY',
    'SPRINGER_API_KEY',
    'SPRINGER_OPENACCESS_API_KEY',
    'WILEY_TDM_TOKEN',
    'CROSSREF_MAILTO',
    'PAPER_SEARCH_OPENAIRE_API_KEY',
    'OPENAIRE_API_KEY',
    'LOG_LEVEL',
    'DEFAULT_DOWNLOAD_PATH',
    'MAX_FILE_SIZE_MB',
    'RATE_LIMIT_REQUESTS_PER_MINUTE',
    'RATE_LIMIT_BURST'
];
const CONFIG_KEY_SET = new Set(CONFIG_KEYS);
const APPLIED_FROM_USER_CONFIG = new Set();
export function getConfigPath() {
    if (process.env.PAPER_SEARCH_CONFIG_FILE)
        return process.env.PAPER_SEARCH_CONFIG_FILE;
    const configDir = process.env.PAPER_SEARCH_CONFIG_DIR || join(homedir(), '.config', 'paper-search-cli');
    return join(configDir, 'config.json');
}
export function readUserConfig() {
    const filePath = getConfigPath();
    if (!existsSync(filePath))
        return {};
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(`Invalid config file: ${filePath}`);
    }
    const config = {};
    for (const [key, value] of Object.entries(parsed)) {
        if (CONFIG_KEY_SET.has(key) && value !== undefined && value !== null) {
            config[key] = String(value);
        }
    }
    return config;
}
export function writeUserConfig(config) {
    const filePath = getConfigPath();
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
    chmodSync(filePath, 0o600);
    return filePath;
}
export function initUserConfig(force = false) {
    const filePath = getConfigPath();
    if (existsSync(filePath) && !force) {
        chmodSync(filePath, 0o600);
        return { path: filePath, created: false };
    }
    writeUserConfig({});
    return { path: filePath, created: true };
}
export function setUserConfigValue(key, value) {
    assertConfigKey(key);
    const config = readUserConfig();
    config[key] = value;
    writeUserConfig(config);
    return config;
}
export function unsetUserConfigValue(key) {
    assertConfigKey(key);
    const config = readUserConfig();
    delete config[key];
    writeUserConfig(config);
    return config;
}
export function importEnvFile(filePath) {
    if (!existsSync(filePath))
        throw new Error(`Env file not found: ${filePath}`);
    const parsed = dotenv.parse(readFileSync(filePath));
    const config = readUserConfig();
    const imported = [];
    for (const [key, value] of Object.entries(parsed)) {
        if (!CONFIG_KEY_SET.has(key))
            continue;
        config[key] = value;
        imported.push(key);
    }
    writeUserConfig(config);
    return { path: getConfigPath(), imported };
}
export function loadUserConfigIntoEnv() {
    const config = readUserConfig();
    const applied = [];
    for (const [key, value] of Object.entries(config)) {
        if (process.env[key])
            continue;
        process.env[key] = value;
        APPLIED_FROM_USER_CONFIG.add(key);
        applied.push(key);
    }
    return applied;
}
export function listConfigEntries(includeMissing = false) {
    const config = readUserConfig();
    return CONFIG_KEYS.map(key => {
        const value = process.env[key] || config[key] || '';
        const source = value
            ? APPLIED_FROM_USER_CONFIG.has(key) || (!process.env[key] && Boolean(config[key]))
                ? 'user_config'
                : 'environment'
            : 'missing';
        return {
            key,
            configured: Boolean(value),
            source,
            value: value ? maskValue(key, value) : ''
        };
    }).filter(entry => includeMissing || entry.configured);
}
export function maskValue(key, value) {
    if (!value)
        return '';
    if (key.toLowerCase().includes('email') || value.includes('@')) {
        const [name, domain] = value.split('@');
        if (!domain)
            return '***';
        return `${name.slice(0, 2)}***@${domain}`;
    }
    if (value.length <= 8)
        return '***';
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
export function assertConfigKey(key) {
    if (!CONFIG_KEY_SET.has(key)) {
        throw new Error(`Unsupported config key: ${key}. Run "paper-search config keys" to list supported keys.`);
    }
}
//# sourceMappingURL=ConfigService.js.map