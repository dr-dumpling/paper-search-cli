# Paper Search CLI

[中文](README-sc.md)

Paper Search CLI is a standalone Node.js command line tool for searching, validating, and downloading academic papers from multiple scholarly sources. It is designed for direct terminal use, automation scripts, and agent workflows that need a stable command surface with predictable JSON output.

It keeps the detailed platform coverage and safety model of the earlier Paper Search implementation, but runs as a normal CLI process. There is no long-running background service to configure, start, or keep alive.

![Node.js](https://img.shields.io/badge/node.js->=18.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-^5.5.3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platforms](https://img.shields.io/badge/platforms-20-brightgreen.svg)
![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)

## Current Status

| Area | Status |
| --- | --- |
| Runtime | Standalone Node.js CLI |
| Main command | `paper-search` |
| Current platform count | 20 implemented sources/platforms |
| Output style | JSON by default, optional text output |
| Configuration | Shell env/current `.env` plus user config at `~/.config/paper-search-cli/config.json` |
| Best current default | `crossref` + `openalex` for broad metadata, `pubmed` + `pmc`/`europepmc` for biomedical search, `arxiv` for preprints |
| New upstream ideas absorbed | `--sources` fan-out, DOI/title dedupe, open-access-first `download_with_fallback` |

## Design Goals

- **Free-first retrieval**: prefer public metadata and open-access full-text routes before restricted or fragile sources.
- **One command surface**: keep search, status, download, and precise tool calls behind the same executable.
- **Agent-safe output**: produce predictable JSON that can be parsed without scraping terminal text.
- **Transparent source behavior**: document which platforms provide metadata only, which can download PDFs, and which need API keys.
- **No hidden background process**: each command starts, returns a result, and exits.

## Key Features

- **20 academic sources/platforms**: Crossref, OpenAlex, PubMed, PubMed Central, Europe PMC, arXiv, bioRxiv, medRxiv, Semantic Scholar, CORE, OpenAIRE, Web of Science, Google Scholar, IACR ePrint, Sci-Hub, ScienceDirect, Springer Nature, Wiley, Scopus, and Unpaywall.
- **Single command interface**: install once, then call `paper-search` from terminal, scripts, or agents.
- **JSON-first output**: stdout is machine-readable JSON by default; stderr is reserved for human-readable diagnostics.
- **Unified paper model**: normalized title, authors, DOI, source, dates, abstract, PDF URL, citation count, and provider-specific metadata where available.
- **Multi-source search with dedupe**: query selected sources with `--sources crossref,openalex,pmc`, or use curated `platform=all`, then merge duplicates by DOI and title/author keys.
- **Open-access-first fallback download**: `download_with_fallback` tries native source download, discovered PDF URLs, PMC/Europe PMC/CORE/OpenAIRE, Unpaywall DOI resolution, then optional Sci-Hub only when explicitly enabled.
- **Security-first request handling**: DOI validation, query sanitization, sensitive data masking, and structured error handling.
- **Rate limits and retry logic**: platform-specific rate limiting and retryable API error handling.
- **PDF download support**: download from supported sources such as arXiv, bioRxiv, medRxiv, Semantic Scholar, IACR, Sci-Hub, Springer open access, and Wiley DOI-based access.
- **Agent-friendly commands**: `tools`, `status`, `search`, `download`, and `run` cover both simple use and precise advanced calls.

## Supported Platforms

| Platform | Search | Download | Full Text | Citations | API Key | Special Features |
| --- | --- | --- | --- | --- | --- | --- |
| Crossref | Yes | No | No | Yes | No | Default search platform, broad metadata coverage |
| OpenAlex | Yes | Via fallback URL | No | Yes | No | Broad free metadata, concepts, OA location discovery |
| arXiv | Yes | Yes | Yes | No | No | Physics, CS, math, and related preprints |
| Web of Science | Yes | No | No | Yes | Required | Citation database, date sorting, year ranges |
| PubMed | Yes | No | No | No | Optional | Biomedical literature through NCBI E-utilities |
| PubMed Central | Yes | Yes | Yes | No | No | Open biomedical full text and PMC PDFs |
| Europe PMC | Yes | Yes | Yes | No | No | Biomedical metadata plus open full-text links |
| Google Scholar | Yes | No | No | Yes | No | Broad academic discovery, scrape-based |
| bioRxiv | Yes | Yes | Yes | No | No | Biology preprints |
| medRxiv | Yes | Yes | Yes | No | No | Medical preprints |
| Semantic Scholar | Yes | Yes | No | Yes | Optional | AI-oriented semantic paper search |
| CORE | Yes | Record-dependent | Record-dependent | No | Optional | Open repository metadata and PDF candidates |
| OpenAIRE | Yes | Via fallback URL | No | No | Optional | Open repository discovery source |
| Unpaywall | DOI only | Via fallback URL | No | No | Email required | DOI-based open-access resolution |
| IACR ePrint | Yes | Yes | Yes | No | No | Cryptography papers |
| Sci-Hub | Yes | Yes | No | No | No | DOI-based paper lookup and PDF retrieval |
| ScienceDirect | Yes | No | No | Yes | Required | Elsevier metadata and abstracts |
| Springer Nature | Yes | Open access only | No | No | Required | Metadata API and OpenAccess API |
| Wiley | No keyword search | Yes | Yes | No | Required | TDM API, DOI-based PDF download only |
| Scopus | Yes | No | No | Yes | Required | Abstract and citation database |

Notes:

- Wiley does not support keyword search through the Wiley TDM API. Use `search_crossref` to find Wiley articles and then use `download_paper` with `platform=wiley` and the DOI.
- `platform=all` uses a curated fan-out across the more stable free/open/API sources: Crossref, OpenAlex, PubMed, PMC, Europe PMC, arXiv, bioRxiv, medRxiv, IACR, CORE, and OpenAIRE. It intentionally excludes Google Scholar, Sci-Hub, paid-key sources, DOI-only Unpaywall, and rate-limit-prone Semantic Scholar unless requested explicitly.
- `--sources` accepts a comma-separated source list, for example `--sources crossref,openalex,pmc`.
- Google Scholar and Sci-Hub may have legal, contractual, or rate-limit constraints. See [Compliance](#compliance).

## Absorbed Upstream Ideas

The useful upstream changes have been brought into this CLI where they fit a standalone command-line workflow. The goal is not to mirror every integration; it is to improve recall and PDF discovery while keeping defaults stable and legally safer.

| Capability | Current CLI status | Notes |
| --- | --- | --- |
| Broader open metadata | Implemented | `search_openalex`; also available through `--sources openalex` and curated `platform=all` |
| DOI-based open-access resolution | Implemented | `search_unpaywall` and `download_with_fallback`; requires `PAPER_SEARCH_UNPAYWALL_EMAIL` or `UNPAYWALL_EMAIL` |
| Biomedical open full text | Implemented | `search_pmc` and `search_europepmc`; both can participate in fallback downloads |
| Repository-based PDF discovery | Implemented first batch | `search_core` and `search_openaire`; CORE works better with an API key, OpenAIRE is treated as discovery metadata |
| Multi-source fan-out and dedupe | Implemented | `--sources crossref,openalex,pmc` or `platform=all`; duplicates are merged by DOI, then title+authors |
| Open-access fallback download | Implemented | `download_with_fallback` tries native download, discovered PDF URLs, PMC/Europe PMC/CORE/OpenAIRE, Unpaywall, then optional Sci-Hub |

Still treated as candidates:

| Candidate | Suggested status | Reason |
| --- | --- | --- |
| Zenodo, HAL, DOAJ, dblp | Recommended later | Useful open metadata/repository coverage, but lower immediate value than OpenAlex/PMC/Europe PMC |
| SSRN, CiteSeerX, BASE | Optional or experimental | Useful in some domains, but access and response formats are less predictable |
| IEEE, ACM | Optional paid-key connectors | Should stay isolated behind explicit API keys or institutional access |
| Semantic Scholar in default fan-out | Explicit only | The source is useful, but the free tier can return HTTP 429 quickly; call it directly or include it in `--sources` when needed |
| Google Scholar automation | Best-effort only | Existing scrape-based source remains explicit; it is not used by curated `platform=all` |
| Sci-Hub fallback | Explicit opt-in only | Never used silently; `download_with_fallback` requires `useSciHub=true` |

## Quick Start

### Requirements

- Node.js >= 18.0.0
- npm

### Install From GitHub

One-command global install:

```bash
npm install -g github:dr-dumpling/paper-search-cli
paper-search setup
paper-search status --pretty
```

The GitHub install path runs the package `prepare` script, so it builds `dist/cli.js` during install. The package also includes a post-install note for environments that show npm lifecycle output. If npm hides that output, the first `paper-search status --pretty` run still points users to `paper-search setup`.

Local development install:

```bash
git clone https://github.com/dr-dumpling/paper-search-cli.git
cd paper-search-cli
npm install
npm run build
```

### Run Directly

```bash
node dist/cli.js status --pretty
node dist/cli.js search "large language model evaluation" --platform crossref --max-results 5 --pretty
```

### Register The `paper-search` Command

```bash
npm link
paper-search status --pretty
paper-search search "osteoarthritis occupational exposure" --platform pubmed --max-results 3 --pretty
```

`npm link` creates a local command entry for this checkout. Re-run `npm run build` after code changes.

## Configuration

Most free metadata sources work without configuration. For API keys and emails, prefer the user-level config file so the CLI works from any directory:

```bash
paper-search setup
paper-search config set SEMANTIC_SCHOLAR_API_KEY your_semantic_scholar_api_key_here
paper-search config set PAPER_SEARCH_UNPAYWALL_EMAIL you@example.com
paper-search config list --pretty
paper-search config doctor --pretty
```

The default config path is:

```text
~/.config/paper-search-cli/config.json
```

The file is written with `0600` permissions. `config list` and `config doctor` mask secrets.

`paper-search setup` is the guided setup command. By default it asks for the recommended credentials only: Semantic Scholar, Unpaywall email, Crossref email, and CORE. Use `paper-search setup --all` to walk through every supported configuration key, or `paper-search setup --keys SEMANTIC_SCHOLAR_API_KEY,CORE_API_KEY` to configure a specific subset.

You can also import an existing `.env`:

```bash
paper-search config import-env .env --pretty
```

Config priority is:

1. Shell environment variables.
2. Current working directory `.env`.
3. User config file.
4. Built-in defaults for free sources.

For repo-local development, copying `.env.example` still works:

```bash
cp .env.example .env
```

### Environment Variables

```bash
# Web of Science, required for Web of Science search
WOS_API_KEY=your_web_of_science_api_key_here
WOS_API_VERSION=v1

# PubMed, optional; increases rate limit from 3 requests/sec to 10 requests/sec
PUBMED_API_KEY=your_ncbi_api_key_here
NCBI_EMAIL=you@example.com
NCBI_TOOL=paper-search-cli

# Semantic Scholar, optional; increases request limits
SEMANTIC_SCHOLAR_API_KEY=your_semantic_scholar_api_key_here

# Elsevier, required for ScienceDirect and Scopus
ELSEVIER_API_KEY=your_elsevier_api_key_here

# Springer Nature, required for Springer search and open access download
SPRINGER_API_KEY=your_springer_api_key_here
SPRINGER_OPENACCESS_API_KEY=your_openaccess_api_key_here

# Wiley TDM, required for Wiley DOI-based PDF download
WILEY_TDM_TOKEN=your_wiley_tdm_token_here

# Crossref polite pool, optional but recommended
CROSSREF_MAILTO=you@example.com

# Unpaywall, required for DOI-based OA resolution
PAPER_SEARCH_UNPAYWALL_EMAIL=you@example.com
UNPAYWALL_EMAIL=you@example.com

# CORE, optional but recommended; anonymous access is often heavily rate-limited
PAPER_SEARCH_CORE_API_KEY=your_core_api_key_here
CORE_API_KEY=your_core_api_key_here

# OpenAIRE, optional; public search works without a key
PAPER_SEARCH_OPENAIRE_API_KEY=your_openaire_api_key_here
OPENAIRE_API_KEY=your_openaire_api_key_here
```

### API Key Sources

- Web of Science: [Clarivate Developer Portal](https://developer.clarivate.com/apis)
- PubMed: [NCBI API Keys](https://ncbiinsights.ncbi.nlm.nih.gov/2017/11/02/new-api-keys-for-the-e-utilities/)
- Semantic Scholar: [Semantic Scholar API](https://www.semanticscholar.org/product/api)
- Elsevier: [Elsevier Developer Portal](https://dev.elsevier.com/apikey/manage)
- Springer Nature: [Springer Nature Developers](https://dev.springernature.com/)
- Wiley TDM: [Wiley Text and Data Mining](https://onlinelibrary.wiley.com/library-info/resources/text-and-datamining)
- Unpaywall: [Unpaywall Data Format and API](https://unpaywall.org/products/api)
- CORE: [CORE API](https://core.ac.uk/services/api)
- OpenAIRE: [OpenAIRE APIs](https://develop.openaire.eu/)

`.env` is ignored by git. Do not commit API keys or tokens.

## Output Contract

By default, every command writes JSON to stdout.

```json
{
  "ok": true,
  "tool": "search_papers",
  "message": "Found 1 papers.",
  "data": []
}
```

Use `--pretty` for formatted JSON:

```bash
paper-search search "machine learning" --platform crossref --max-results 1 --pretty
```

Use `--format text` if you need the raw text response:

```bash
paper-search search "machine learning" --platform crossref --max-results 1 --format text
```

Use `--include-text` to keep the raw response text alongside parsed JSON:

```bash
paper-search run search_crossref --arg query="machine learning" --arg maxResults=3 --include-text --pretty
```

## Commands

### `paper-search search`

Unified search entrypoint.

```bash
paper-search search <query> [options]
```

Examples:

```bash
paper-search search "machine learning" --platform crossref --max-results 10 --pretty
paper-search search "machine learning" --sources crossref,openalex --max-results 2 --pretty
paper-search search "cancer immunotherapy" --platform all --max-results 2 --pretty
paper-search search "transformer neural networks" --platform arxiv --category cs.AI --year 2023 --pretty
paper-search search "COVID-19 vaccine efficacy" --platform pubmed --max-results 20 --year 2023 --pretty
paper-search search "CRISPR gene editing" --platform webofscience --journal Nature --max-results 15 --pretty
```

Common options:

| Option | Description |
| --- | --- |
| `--platform` | Source platform. Default: `crossref` |
| `--sources` | Comma-separated source list for multi-source search, e.g. `crossref,openalex,pmc` |
| `--max-results` | Maximum result count |
| `--year` | Year filter, e.g. `2024`, `2020-2024`, `2020-` |
| `--author` | Author name filter |
| `--journal` | Journal name filter |
| `--category` | Category filter, mainly arXiv/bioRxiv/medRxiv |
| `--days` | Days back for bioRxiv/medRxiv |
| `--sort-by` | `relevance`, `date`, or `citations` |
| `--sort-order` | `asc` or `desc` |

### `paper-search run`

Run a specific internal tool by name. This is the most precise command for agent workflows.

```bash
paper-search run <tool-name> --arg key=value --arg key=value
paper-search run <tool-name> --json-args '{"key":"value"}'
paper-search run <tool-name> --json-args @args.json
```

Examples:

```bash
paper-search run search_crossref --arg query="machine learning" --arg maxResults=5 --pretty
paper-search run search_papers --json-args '{"query":"machine learning","sources":"crossref,openalex","maxResults":2}' --pretty
paper-search run search_pubmed --json-args '{"query":"osteoarthritis","maxResults":5,"sortBy":"date"}' --pretty
paper-search run get_paper_by_doi --arg doi="10.1038/nature12373" --pretty
```

### `paper-search tools`

List all available tool names, descriptions, and input schemas.

```bash
paper-search tools --pretty
```

### `paper-search status`

Show platform capabilities and API key status. Secrets are never printed.

```bash
paper-search status --pretty
paper-search status --validate --pretty
```

`--validate` may make live provider requests. Use it when you intentionally want credential validation.

### `paper-search config`

Manage the user-level config file.

```bash
paper-search config init --pretty
paper-search config set SEMANTIC_SCHOLAR_API_KEY your_key --pretty
paper-search config set PAPER_SEARCH_UNPAYWALL_EMAIL you@example.com --pretty
paper-search config import-env .env --pretty
paper-search config list --pretty
paper-search config doctor --pretty
paper-search config path --pretty
paper-search config keys --pretty
```

### `paper-search download`

Download a paper PDF through a platform that supports downloads.

```bash
paper-search download <paper-id-or-doi> --platform <platform> [--save-path ./downloads]
```

Examples:

```bash
paper-search download 2301.00001 --platform arxiv --save-path ./downloads
paper-search download 10.1000/example --platform scihub --save-path ./downloads
paper-search download 10.1111/jtsb.12390 --platform wiley --save-path ./downloads
paper-search run download_with_fallback --arg source=arxiv --arg paperId=1201.0490 --arg doi=10.48550/arxiv.1201.0490 --arg savePath=./downloads --pretty
```

## Tool Reference

These names can be used with `paper-search run`.

### `search_papers`

Search across the unified dispatcher.

```bash
paper-search run search_papers --json-args '{"query":"machine learning","platform":"crossref","maxResults":10,"year":"2023","sortBy":"date"}' --pretty
```

Supported platforms:

```text
crossref, arxiv, webofscience, wos, pubmed, biorxiv, medrxiv, semantic,
iacr, googlescholar, scholar, scihub, sciencedirect, springer, scopus,
openalex, unpaywall, pmc, europepmc, core, openaire, all
```

For multi-source search, pass `sources`:

```bash
paper-search run search_papers --json-args '{"query":"machine learning","sources":"crossref,openalex,pmc","maxResults":2}' --pretty
```

### `search_crossref`

Search Crossref, the default free metadata source.

```bash
paper-search run search_crossref --arg query="machine learning" --arg maxResults=10 --arg year=2023 --arg sortBy=relevance --arg sortOrder=desc --pretty
```

### `search_arxiv`

Search arXiv preprints.

```bash
paper-search run search_arxiv --arg query="transformer neural networks" --arg maxResults=10 --arg category=cs.AI --arg year=2023 --arg sortBy=date --arg sortOrder=desc --pretty
```

### `search_pubmed`

Search PubMed/MEDLINE biomedical literature.

```bash
paper-search run search_pubmed --json-args '{"query":"COVID-19 vaccine efficacy","maxResults":20,"year":"2023","journal":"New England Journal of Medicine","publicationType":["Journal Article","Clinical Trial"],"sortBy":"date"}' --pretty
```

### Open Metadata And Full-Text Sources

Use these for the upstream-inspired open discovery path:

```bash
paper-search run search_openalex --arg query="machine learning" --arg maxResults=3 --pretty
paper-search run search_unpaywall --arg query="10.48550/arxiv.1201.0490" --pretty
paper-search run search_pmc --arg query="cancer immunotherapy" --arg maxResults=3 --pretty
paper-search run search_europepmc --arg query="cancer genomics" --arg maxResults=3 --pretty
paper-search run search_core --arg query="machine learning" --arg maxResults=3 --pretty
paper-search run search_openaire --arg query="machine learning" --arg maxResults=3 --pretty
```

Unpaywall is DOI-only and requires an email. CORE public access may return zero results or rate-limit quickly without an API key.

### `search_webofscience`

Search Web of Science. Requires `WOS_API_KEY`.

```bash
paper-search run search_webofscience --arg query="CRISPR gene editing" --arg maxResults=15 --arg year=2022 --arg journal=Nature --pretty
```

### `search_google_scholar`

Search Google Scholar.

```bash
paper-search run search_google_scholar --arg query="deep learning" --arg maxResults=10 --arg yearLow=2020 --arg yearHigh=2024 --pretty
```

### `search_biorxiv` and `search_medrxiv`

Search preprint servers by recent day window and optional category.

```bash
paper-search run search_biorxiv --arg query="genomics" --arg maxResults=10 --arg days=30 --pretty
paper-search run search_medrxiv --arg query="epidemiology" --arg maxResults=10 --arg days=60 --pretty
```

### `search_semantic_scholar`

Search Semantic Scholar with optional field filters.

```bash
paper-search run search_semantic_scholar --json-args '{"query":"graph neural networks","maxResults":10,"fieldsOfStudy":["Computer Science"]}' --pretty
```

### `search_semantic_snippets`

Search Semantic Scholar's Open Access snippet index. This searches excerpts from titles, abstracts, and body text; only `snippet.snippetKind="body"` should be treated as body-text evidence. Requires `SEMANTIC_SCHOLAR_API_KEY`.

```bash
paper-search run search_semantic_snippets --arg query="CMAverse mediation bootstrap confidence interval" --arg limit=5 --arg fieldsOfStudy=Medicine --pretty
```

### `search_iacr`

Search IACR ePrint Archive.

```bash
paper-search run search_iacr --arg query="zero knowledge proof" --arg maxResults=10 --arg fetchDetails=true --pretty
```

### `search_sciencedirect`

Search ScienceDirect. Requires `ELSEVIER_API_KEY`.

```bash
paper-search run search_sciencedirect --arg query="materials science" --arg maxResults=10 --arg openAccess=true --pretty
```

### `search_scopus`

Search Scopus. Requires `ELSEVIER_API_KEY`.

```bash
paper-search run search_scopus --arg query="citation analysis" --arg maxResults=10 --arg documentType=ar --pretty
```

### `search_springer`

Search Springer Nature. Requires `SPRINGER_API_KEY`.

```bash
paper-search run search_springer --arg query="machine learning" --arg maxResults=10 --arg type=Journal --arg openAccess=true --pretty
```

### `search_scihub`

Lookup a DOI or article URL through Sci-Hub and optionally download a PDF.

```bash
paper-search run search_scihub --arg doiOrUrl="10.1038/nature12373" --arg downloadPdf=false --pretty
paper-search run search_scihub --arg doiOrUrl="10.1038/nature12373" --arg downloadPdf=true --arg savePath=./downloads --pretty
```

### `check_scihub_mirrors`

Show Sci-Hub mirror health.

```bash
paper-search run check_scihub_mirrors --pretty
paper-search run check_scihub_mirrors --arg forceCheck=true --pretty
```

### `get_paper_by_doi`

Lookup metadata by DOI.

```bash
paper-search run get_paper_by_doi --arg doi="10.1038/nature12373" --arg platform=all --pretty
paper-search run get_paper_by_doi --arg doi="10.1038/nature12373" --arg platform=arxiv --pretty
```

### `download_paper`

Download PDF files from supported platforms.

```bash
paper-search run download_paper --arg paperId="2301.00001" --arg platform=arxiv --arg savePath=./downloads --pretty
```

Supported download platforms:

```text
arxiv, biorxiv, medrxiv, semantic, iacr, scihub, springer, wiley,
pmc, europepmc, core
```

### `download_with_fallback`

Try open-access routes before optional last-resort sources:

```bash
paper-search run download_with_fallback --arg source=arxiv --arg paperId=1201.0490 --arg doi=10.48550/arxiv.1201.0490 --arg savePath=./downloads --pretty
paper-search run download_with_fallback --arg source=crossref --arg paperId="10.1038/nature12373" --arg doi="10.1038/nature12373" --arg savePath=./downloads --arg useSciHub=false --pretty
```

`useSciHub` defaults to `false`; set it to `true` only when you explicitly choose that final fallback.

### `search_wiley`

Wiley keyword search is not supported by the Wiley TDM API. Use Crossref first, then download by DOI:

```bash
paper-search run search_crossref --arg query="site:wiley.com machine learning" --arg maxResults=10 --pretty
paper-search run download_paper --arg paperId="10.1111/example" --arg platform=wiley --pretty
```

### `get_platform_status`

Same as `paper-search status`.

```bash
paper-search run get_platform_status --pretty
paper-search run get_platform_status --arg validate=true --pretty
```

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test -- --runInBand
```

### Type Check

```bash
npm exec tsc -- --noEmit
```

### Security Audit

```bash
npm audit --omit=dev
```

### Packaging And Publishing

The package is prepared for one-command installation:

- `build` cleans `dist/` before compiling, so stale build files are not packaged.
- `prepare` builds `dist/cli.js` for GitHub installs such as `npm install -g github:dr-dumpling/paper-search-cli`, and for `npm pack`.
- `postinstall` provides the API key setup command when npm lifecycle output is visible; it does not ask for secrets during npm install.
- `prepublishOnly` runs tests and build before `npm publish`.
- `files` limits the published package to `dist/`, the postinstall script, docs, license, and `.env.example`.

Release checklist:

```bash
npm test -- --runInBand
npm run build
npm pack --dry-run
npm publish --access public
```

After npm publication, users can install with:

```bash
npm install -g paper-search-cli
paper-search setup
paper-search status --pretty
```

### Project Layout

```text
src/cli.ts               CLI entrypoint
src/core/                Tool registry, schemas, dispatcher, searcher initialization
src/platforms/           Platform-specific search/download implementations
src/models/              Unified paper model
src/services/            Shared higher-level services
src/utils/               Logging, rate limiting, quota, cache, security, PDF helpers
tests/                   Unit and integration tests
```

### Adding A New Platform

1. Create a new searcher in `src/platforms/`.
2. Extend `PaperSource` and implement `search`, `downloadPdf`, `readPaper`, and `getCapabilities`.
3. Register the searcher in `src/core/searchers.ts`.
4. Add a schema in `src/core/schemas.ts`.
5. Add a tool definition in `src/core/tools.ts`.
6. Add dispatch handling in `src/core/handleToolCall.ts`.
7. Add tests under `tests/platforms/`.
8. Run build, tests, and audit.

## Troubleshooting

### Command Not Found

Run from the project:

```bash
node dist/cli.js status --pretty
```

Or register the local command:

```bash
npm link
paper-search status --pretty
```

### Missing API Key

Run:

```bash
paper-search status --pretty
```

If a provider shows `missing`, add the relevant key through `paper-search setup`, user config, or `.env`, then rerun the command.

For global installs, prefer user config:

```bash
paper-search setup
paper-search config set SEMANTIC_SCHOLAR_API_KEY your_key
paper-search config doctor --pretty
```

### Provider Rate Limits

Reduce `--max-results`, avoid repeated live validation, and prefer sources with official APIs. PubMed, Semantic Scholar, and CORE support optional keys for better limits. CORE anonymous access can return HTTP 429; configure `PAPER_SEARCH_CORE_API_KEY` when you rely on it.

### JSON Parsing In Scripts

Use default JSON output and parse stdout. Human diagnostics are written to stderr.

## Compliance

This project includes integrations that may have legal, contractual, or ethical constraints. You are responsible for ensuring usage complies with applicable law, institutional policy, and third-party terms.

- Sci-Hub may provide access to copyrighted works without authorization in many jurisdictions. Use only when you have legal access rights.
- Google Scholar automation may violate Google terms or trigger blocking. Prefer official APIs or open metadata sources for compliance-sensitive work.
- `platform=all` avoids Google Scholar, Sci-Hub, paid-key sources, DOI-only Unpaywall, and rate-limit-prone Semantic Scholar by default. Request those sources explicitly when you choose to use them.
- Provider API keys may be subject to institutional terms. Do not share or commit credentials.

## License

MIT
