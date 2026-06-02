# Paper Search CLI Contract

This contract records the stable CLI surface that the `paper-search` Routing Skill may rely on. The Routing Skill should stay short and should not describe commands, flags, or defaults that are absent from this contract and the current CLI.

## Entrypoints

- `paper-search` is the primary executable.
- `paper-search --version`, `paper-search -v`, and `paper-search version` print the installed version.
- `paper-search --help` and `paper-search help` print usage.
- `paper-search tools --pretty` lists direct `run` tool names and schemas.
- Private API keys, emails, and tokens must be configured through `paper-search setup`, `paper-search config`, `.env`, or shell environment variables. They must not be written into Skill files.

## Top-Level Commands

- `paper-search search <query> [--platform NAME] [--sources CSV] [--max-results N] [--year YEAR] [--pretty]`
- `paper-search run <tool-name> --arg key=value --json-args '{"key":"value"}' [--pretty]`
- `paper-search download <paper-id> --platform NAME [--save-path PATH] [--pretty]`
- `paper-search journal-metrics <journal...> [--file PATH] [--include-raw] [--pretty]`
- `paper-search metrics ...` is an alias for `journal-metrics`.
- `paper-search status [--validate] [--pretty]`
- `paper-search doctor [--validate] [--format text] [--pretty]`
- `paper-search smoke --mock [--pretty]`
- `paper-search smoke --live [--pretty]`
- `paper-search skills status [--targets CSV] [--pretty]`
- `paper-search skills diff [--targets CSV] [--format text] [--pretty]`
- `paper-search skills update [--targets CSV] [--pretty]`
- `paper-search setup [--all] [--keys CSV] [--install-skills CSV] [--skip-skills]`
- `paper-search tools [--pretty]`
- `paper-search diagnostics [--pretty]`
- `paper-search requirements [--pretty]` is an alias for `diagnostics`.
- `paper-search config init [--pretty]`
- `paper-search config path [--pretty]`
- `paper-search config keys [--pretty]`
- `paper-search config list [--all] [--pretty]`
- `paper-search config doctor [--pretty]` is a compatibility config summary; use top-level `doctor` for the full health report.
- `paper-search config get KEY [--raw] [--pretty]`
- `paper-search config set KEY VALUE [--pretty]`
- `paper-search config unset KEY [--pretty]`
- `paper-search config delete KEY [--pretty]` and `paper-search config remove KEY [--pretty]` are aliases for `unset`.
- `paper-search config import-env [file] [--pretty]`

## Direct Run Tools

These names can be used with `paper-search run <tool-name>`:

- `search_papers`
- `search_arxiv`
- `search_webofscience`
- `search_pubmed`
- `search_biorxiv`
- `search_medrxiv`
- `search_semantic_scholar`
- `search_semantic_snippets`
- `search_iacr`
- `download_paper`
- `search_google_scholar`
- `get_paper_by_doi`
- `search_scihub`
- `check_scihub_mirrors`
- `get_platform_status`
- `query_journal_metrics`
- `search_sciencedirect`
- `search_springer`
- `search_wiley`
- `search_scopus`
- `search_crossref`
- `search_openalex`
- `search_unpaywall`
- `search_pmc`
- `search_europepmc`
- `search_core`
- `search_openaire`
- `download_with_fallback`
- `search_dblp`
- `search_ieee`
- `search_acm`
- `search_usenix`
- `search_openreview`
- `search_springerlink`

## Output Expectations

- JSON is the default machine-readable output for agent and script callers.
- `--pretty` pretty-prints JSON.
- `--format text` is supported by top-level `doctor` and `skills diff` for explicitly requested human-readable reports.
- `--include-text` keeps raw tool response text in JSON for commands where the CLI supports it.
- The Routing Skill should parse JSON when making decisions and use text format only when the user needs a readable report.

## Search Command Contract

- `paper-search search` is the integrated metadata search entrypoint.
- Use `--platform NAME` for one source and `--sources a,b,c` for explicit multi-source search.
- Use `--platform all` or `--sources all` only when broad recall matters more than precision.
- `search_papers` is the direct tool behind the integrated `search` command.
- `search_semantic_snippets` uses `limit`, not `maxResults`, and is for body/title/abstract snippets rather than complete full text.
- `search_unpaywall` resolves DOI-based OA metadata and returns at most one result.
- `search_scihub` is DOI/URL-targeted lookup and is not a metadata search source.
- `CORE_MAX_RESULTS_CAP` controls the configurable CORE-only result cap. Default is `100`; hard maximum is `500`. Other platforms keep their own current limits.

## Download Command Contract

`download_paper` tries source-native download first when available. Unsupported or failed native downloads route into the same fallback funnel used by `download_with_fallback`.

`download_with_fallback` order is source-native download, metadata PDF URL, repository discovery through PMC/Europe PMC/CORE/OpenAIRE, Unpaywall DOI resolution, then Sci-Hub as the final fallback.

Sci-Hub Fallback is enabled by default. To suppress that final stage for a request, pass:

```json
{"useSciHub": false}
```

The Routing Skill must not describe future-only download commands or strategy flags until they appear in `paper-search --help` or `paper-search tools`.

## Configuration And Secret Boundaries

Configuration sources, in priority order:

1. Shell environment variables
2. Current directory `.env`
3. User config file under `~/.config/paper-search-cli/config.json`
4. Free-source built-in defaults

Useful configuration commands:

```bash
paper-search setup
paper-search config set SEMANTIC_SCHOLAR_API_KEY your_key
paper-search setup EASYSCHOLAR_KEY
paper-search config list --pretty
paper-search doctor --pretty
```

Do not ask users to paste secrets into chat. Do not write secrets into Skill, README, tests, or logs. `doctor` and `config` output should mask configured secret values.
