# Paper Search CLI

[中文](README-sc.md)

Paper Search CLI is a standalone Node.js command line tool for searching, validating, and downloading academic papers from multiple scholarly sources. It is designed for direct terminal use, automation scripts, and agent workflows that need a stable command surface with predictable JSON output.

It keeps the broad platform coverage, unified paper model, and detailed capability descriptions of the earlier Paper Search implementation, but runs as a normal CLI process. There is no long-running background service to configure, start, or keep alive.

![Node.js](https://img.shields.io/badge/node.js->=18.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-^5.5.3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platforms](https://img.shields.io/badge/platforms-20-brightgreen.svg)
![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
[![LinuxDo](https://img.shields.io/badge/LinuxDo-community-1f6feb)](https://linux.do)

Thanks to the sincere, friendly, collaborative, and professional [LinuxDo](https://linux.do) community. The CLI + Skill direction and the paper-search workflow refinements in this project were shaped by LinuxDo discussions and open-source sharing.

[Quick Start](#quick-start) · [Configuration](#configuration) · [Agent Skill](#agent-skill) · [Supported Platforms](#supported-platforms) · [Commands](#commands) · [Tool Reference](#tool-reference) · [Troubleshooting](#troubleshooting)

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
- **Semantic Scholar body-snippet search**: `search_semantic_snippets` searches Semantic Scholar's Open Access snippet index for body-text snippets, which is useful for finding methodological details. It requires `SEMANTIC_SCHOLAR_API_KEY`.
- **Open-access-first fallback download**: `download_with_fallback` tries native source download, discovered PDF URLs, PMC/Europe PMC/CORE/OpenAIRE, Unpaywall DOI resolution, then optional Sci-Hub only when explicitly enabled.
- **Rate limits and retry logic**: platform-specific rate limiting and retryable API error handling.
- **PDF download support**: download from supported sources such as arXiv, bioRxiv, medRxiv, Semantic Scholar, IACR, Sci-Hub, Springer open access, and Wiley DOI-based access.
- **Agent-friendly commands**: `tools`, `status`, `search`, `download`, and `run` cover both simple use and precise advanced calls.

## Quick Start

### Install

Requires Node.js >= 18.0.0 and npm.

```bash
npm install -g paper-search-cli
paper-search setup
paper-search search "machine learning" --platform crossref --max-results 3 --pretty
```

Run `paper-search setup` after installation to write optional API keys and emails into the user config.

For local development, or to test changes that have not been released yet, install from source:

```bash
git clone git@github.com:dr-dumpling/paper-search-cli.git
cd paper-search-cli
npm install
npm run build
npm install -g .
```

### Common Checks

```bash
paper-search status --pretty
paper-search tools --pretty
paper-search config doctor --pretty
```

## Supported Platforms

| Platform | Search | Download | Full Text | Citations | API Key | Special Features |
| --- | --- | --- | --- | --- | --- | --- |
| Crossref | ✅ | ❌ | ❌ | ✅ | ❌ | Default search platform, broad metadata coverage |
| OpenAlex | ✅ | 🟡 Conditional | ❌ | ✅ | ❌ | Broad free metadata; can feed fallback downloads when records include OA links |
| arXiv | ✅ | ✅ | ✅ | ❌ | ❌ | Physics, CS, math, and related preprints |
| Web of Science | ✅ | ❌ | ❌ | ✅ | ✅ Required | Citation database, date sorting, year ranges |
| PubMed | ✅ | ❌ | ❌ | ❌ | 🟡 Optional | Biomedical literature through NCBI E-utilities |
| PubMed Central | ✅ | ✅ | ✅ | ❌ | ❌ | Open biomedical full text and PMC PDFs |
| Europe PMC | ✅ | ✅ | ✅ | ❌ | ❌ | Biomedical metadata plus open full-text links |
| Google Scholar | ✅ | ❌ | ❌ | ✅ | ❌ | Broad academic discovery, scrape-based |
| bioRxiv | ✅ | ✅ | ✅ | ❌ | ❌ | Biology preprints |
| medRxiv | ✅ | ✅ | ✅ | ❌ | ❌ | Medical preprints |
| Semantic Scholar | ✅ | ✅ | ✅ Body snippets | ✅ | 🟡 Optional* | AI semantic search + OA body snippets |
| CORE | ✅ | 🟡 Conditional | 🟡 Conditional | ❌ | 🟡 Optional | Downloads work when records include PDF or full-text links |
| OpenAIRE | ✅ | 🟡 Conditional | ❌ | ❌ | 🟡 Optional | Can feed fallback downloads when records include open links |
| Unpaywall | 🟡 Conditional | 🟡 Conditional | ❌ | ❌ | ✅ Required | DOI-only lookup; requires an email; downloads work when an OA PDF is found |
| IACR ePrint | ✅ | ✅ | ✅ | ❌ | ❌ | Cryptography papers |
| Sci-Hub | ✅ | ✅ | ❌ | ❌ | ❌ | DOI-based paper lookup and PDF retrieval |
| ScienceDirect | ✅ | ❌ | ❌ | ✅ | ✅ Required | Elsevier metadata and abstracts |
| Springer Nature | ✅ | 🟡 Conditional | ❌ | ❌ | ✅ Required | Open-access records can be downloaded; metadata API requires a key |
| Wiley | ❌ Keyword search | ✅ | ✅ | ❌ | ✅ Required | TDM API, DOI-based PDF download only |
| Scopus | ✅ | ❌ | ❌ | ✅ | ✅ Required | Abstract and citation database |

Notes:

- In capability columns, `✅` means directly supported, `❌` means unsupported, and `🟡 Conditional` means support depends on record content or provider constraints, such as DOI-only lookup, available PDF/OA links, or open-access-only downloads.
- In the API Key column, `❌` means no configuration is needed, `🟡 Optional` means configuration improves limits or stability, and `✅ Required` means the key is required only when you use that platform, not that every new installation should configure it. Unpaywall requires an email rather than a traditional API key.
- Wiley does not support keyword search through the Wiley TDM API. Use `search_crossref` to find Wiley articles and then use `download_paper` with `platform=wiley` and the DOI.
- `platform=all` uses a curated fan-out across the more stable free/open/API sources: Crossref, OpenAlex, PubMed, PMC, Europe PMC, arXiv, bioRxiv, medRxiv, IACR, CORE, and OpenAIRE. It intentionally excludes Google Scholar, Sci-Hub, paid-key sources, DOI-only Unpaywall, and rate-limit-prone Semantic Scholar unless requested explicitly.
- `--sources` accepts a comma-separated source list, for example `--sources crossref,openalex,pmc`.
- `🟡 Optional*` for Semantic Scholar means optional for regular search; `search_semantic_snippets` body-snippet search requires `SEMANTIC_SCHOLAR_API_KEY`.

## Configuration

Most free metadata sources work without configuration. For API keys and emails, prefer the user-level config file so the CLI works from any directory:

```bash
paper-search setup
paper-search config set SEMANTIC_SCHOLAR_API_KEY your_semantic_scholar_api_key_here
paper-search config set PAPER_SEARCH_UNPAYWALL_EMAIL you@example.com
paper-search config list --pretty
paper-search config doctor --pretty
paper-search diagnostics --pretty
```

The default config path is:

```text
~/.config/paper-search-cli/config.json
```

The file is written with `0600` permissions. `config list` and `config doctor` mask secrets.

`paper-search setup` is the guided setup command. By default it asks for the recommended credentials only: Semantic Scholar, Unpaywall email, Crossref email, and CORE. Use `paper-search setup --all` to walk through every supported configuration key, or `paper-search setup --keys SEMANTIC_SCHOLAR_API_KEY,CORE_API_KEY` to configure a specific subset.

`paper-search diagnostics --pretty` lists every API-key or email-backed capability, the related config keys, whether the required keys are configured, common failure modes, and suggested next checks. Search commands also add a `diagnostic` field when a key-backed platform returns zero results or an auth/permission/rate-limit error.

### API Key Recommendation

`paper-search setup` asks only for the credentials that are most useful for ordinary new users. `✅ Required` in the platform table means "required for that platform", not "recommended for every installation".

| Level | Config keys | Recommended for new users | Notes |
| --- | --- | --- | --- |
| Default recommended | `SEMANTIC_SCHOLAR_API_KEY` | Yes | Enables Semantic Scholar body-snippet search for methodology details and improves request stability. |
| Default recommended | `PAPER_SEARCH_UNPAYWALL_EMAIL` or `UNPAYWALL_EMAIL` | Yes | Finds open-access PDFs from DOI records; this only needs an email, not an API key. |
| Default recommended | `CROSSREF_MAILTO` | Yes | Puts Crossref requests in the polite pool, which is better for long-running or frequent searches. |
| Default recommended | `CORE_API_KEY` or `PAPER_SEARCH_CORE_API_KEY` | Yes | CORE anonymous access is often rate-limited; a key makes open repository search more reliable. |
| Biomedical-heavy use | `PUBMED_API_KEY`, `NCBI_EMAIL`, `NCBI_TOOL` | Recommended if you use PubMed heavily | Raises NCBI E-utilities limits and identifies the client. |
| Institution entitlement | `WOS_API_KEY` | Configure only with Web of Science API access | Enables Web of Science search and citation data; requires Clarivate API entitlement. |
| Institution entitlement | `ELSEVIER_API_KEY` | Configure only with Scopus or ScienceDirect API access | One Elsevier key does not automatically grant both products; Scopus and ScienceDirect need separate entitlements. |
| Institution entitlement | `SPRINGER_API_KEY`, `SPRINGER_OPENACCESS_API_KEY` | Configure only when you need Springer | Used for Springer metadata and open-access records; 401 usually means an invalid key or missing product access. |
| Institution entitlement | `WILEY_TDM_TOKEN` | Configure only with Wiley TDM/institutional full-text access | DOI-based download only; availability depends on the token and institutional subscription. |
| Usually unnecessary | `PAPER_SEARCH_OPENAIRE_API_KEY` or `OPENAIRE_API_KEY` | Not recommended by default | OpenAIRE public search usually works without a key; configure only for account or quota requirements. |

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

# Semantic Scholar, required for body-snippet search and useful for higher request limits
SEMANTIC_SCHOLAR_API_KEY=your_semantic_scholar_api_key_here

# Elsevier, required for Scopus and ScienceDirect; each product still needs separate entitlement
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

## Agent Skill

This repository includes an optional agent skill at `skills/paper-search/SKILL.md`. Install it into your agent's skill directory if your agent supports skills.

For example:

```bash
mkdir -p ~/.agents/skills/paper-search
cp skills/paper-search/SKILL.md ~/.agents/skills/paper-search/SKILL.md
```

The skill only teaches the agent how to call the `paper-search` CLI. API keys are still configured through `paper-search setup`, `paper-search config`, `.env`, or shell environment variables. Do not store secrets in the skill file.

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

### `paper-search diagnostics`

Show API-key-backed capabilities and troubleshooting guidance. This does not print secrets.

```bash
paper-search diagnostics --pretty
```

When a command returns zero results from a configured key-backed source, or fails with 401, 403, 400, or 429, JSON output includes a `diagnostic` field with likely causes and next actions.

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

Use these commands for open metadata search, open full-text discovery, and fallback PDF lookup:

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

Search Semantic Scholar's Open Access snippet index for body-text snippets that can help locate methodological details. Requires `SEMANTIC_SCHOLAR_API_KEY`.

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

## Usage Boundaries

Some sources may be subject to platform terms, institutional subscriptions, or local law. Use restricted integrations only when you have the appropriate access rights and permission.

## Project Origin

This project acknowledges and thanks the [LinuxDo](https://linux.do) community.

The CLI + Skill direction and paper-search workflow refinements were shaped by community discussions and open-source sharing. This repository keeps the workflow focused on a one-command terminal tool and does not require an MCP runtime.

It also references ideas from [openags/paper-search-mcp](https://github.com/openags/paper-search-mcp) while adapting the workflow to a standalone CLI.

## License

MIT
