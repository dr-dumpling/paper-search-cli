import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import {
  getConfigPath,
  importEnvFile,
  initUserConfig,
  listConfigEntries,
  loadUserConfigIntoEnv,
  readUserConfig,
  setUserConfigValue,
  unsetUserConfigValue
} from '../../src/config/ConfigService.js';

describe('ConfigService', () => {
  let tempDir: string;
  let originalConfigFile: string | undefined;
  let originalSemanticKey: string | undefined;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'paper-search-config-test-'));
    originalConfigFile = process.env.PAPER_SEARCH_CONFIG_FILE;
    originalSemanticKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
    process.env.PAPER_SEARCH_CONFIG_FILE = join(tempDir, 'config.json');
    delete process.env.SEMANTIC_SCHOLAR_API_KEY;
  });

  afterEach(() => {
    if (originalConfigFile === undefined) delete process.env.PAPER_SEARCH_CONFIG_FILE;
    else process.env.PAPER_SEARCH_CONFIG_FILE = originalConfigFile;

    if (originalSemanticKey === undefined) delete process.env.SEMANTIC_SCHOLAR_API_KEY;
    else process.env.SEMANTIC_SCHOLAR_API_KEY = originalSemanticKey;

    rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates and reads a user config file', () => {
    const init = initUserConfig();
    expect(init.path).toBe(getConfigPath());
    expect(init.created).toBe(true);

    setUserConfigValue('SEMANTIC_SCHOLAR_API_KEY', 'semantic-test-key');
    expect(readUserConfig()).toEqual({ SEMANTIC_SCHOLAR_API_KEY: 'semantic-test-key' });

    unsetUserConfigValue('SEMANTIC_SCHOLAR_API_KEY');
    expect(readUserConfig()).toEqual({});
  });

  it('loads user config into missing environment variables without overriding shell env', () => {
    setUserConfigValue('SEMANTIC_SCHOLAR_API_KEY', 'from-config');
    process.env.SEMANTIC_SCHOLAR_API_KEY = 'from-env';

    expect(loadUserConfigIntoEnv()).toEqual([]);
    expect(process.env.SEMANTIC_SCHOLAR_API_KEY).toBe('from-env');

    delete process.env.SEMANTIC_SCHOLAR_API_KEY;
    expect(loadUserConfigIntoEnv()).toEqual(['SEMANTIC_SCHOLAR_API_KEY']);
    expect(process.env.SEMANTIC_SCHOLAR_API_KEY).toBe('from-config');
  });

  it('imports supported keys from a dotenv file and masks listed values', () => {
    const envPath = join(tempDir, '.env');
    writeFileSync(
      envPath,
      [
        'SEMANTIC_SCHOLAR_API_KEY=semantic-test-key',
        'PAPER_SEARCH_UNPAYWALL_EMAIL=user@example.com',
        'UNSUPPORTED_KEY=ignored'
      ].join('\n')
    );

    const result = importEnvFile(envPath);
    expect(result.imported).toEqual(['SEMANTIC_SCHOLAR_API_KEY', 'PAPER_SEARCH_UNPAYWALL_EMAIL']);

    const entries = listConfigEntries();
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'SEMANTIC_SCHOLAR_API_KEY',
          configured: true,
          value: 'sema...-key'
        }),
        expect.objectContaining({
          key: 'PAPER_SEARCH_UNPAYWALL_EMAIL',
          configured: true,
          value: 'us***@example.com'
        })
      ])
    );
  });
});
