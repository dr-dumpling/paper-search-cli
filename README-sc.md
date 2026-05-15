# Paper Search CLI

[English](README.md)

Paper Search CLI 是一个独立的 Node.js 命令行工具，用于跨多个学术来源检索论文、核验元数据和下载 PDF。它面向终端直接使用、自动化脚本和 agent 工作流，提供稳定命令入口和可预测的 JSON 输出。

它继承了之前 Paper Search 实现中的平台覆盖、统一数据模型和详细功能说明，但运行方式已经收口为普通 CLI：每次调用执行一次命令，执行完即退出，不需要配置、启动或维护长期后台服务。

![Node.js](https://img.shields.io/badge/node.js->=18.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-^5.5.3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platforms](https://img.shields.io/badge/platforms-20-brightgreen.svg)
![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)

[快速开始](#快速开始) · [配置](#配置) · [Agent Skill](#agent-skill) · [支持的平台](#支持的平台) · [命令](#命令) · [工具参考](#工具参考) · [排障](#排障)

## 设计目标

- **免费来源优先**：优先使用公开元数据和开放获取全文路径，再考虑受限或不稳定来源。
- **单一命令入口**：检索、状态检查、下载和精确工具调用都收口到同一个可执行命令。
- **适合 agent 解析**：默认输出稳定 JSON，避免让调用方解析终端文本。
- **来源能力透明**：明确区分哪些平台只能提供元数据、哪些能下载 PDF、哪些需要 API key。
- **无后台服务负担**：每次调用只执行一个命令，返回结果后退出。

## 核心特性

- **20 个学术来源/平台**：Crossref、OpenAlex、PubMed、PubMed Central、Europe PMC、arXiv、bioRxiv、medRxiv、Semantic Scholar、CORE、OpenAIRE、Web of Science、Google Scholar、IACR ePrint、Sci-Hub、ScienceDirect、Springer Nature、Wiley、Scopus、Unpaywall。
- **单一命令入口**：安装后通过 `paper-search` 调用，适合终端、脚本和 agent。
- **JSON 优先输出**：stdout 默认输出 JSON，stderr 保留给人类可读日志和错误。
- **统一论文数据模型**：标准化标题、作者、DOI、来源、日期、摘要、PDF 链接、引用数和平台扩展字段。
- **多源检索与去重**：用 `--sources crossref,openalex,pmc` 选择来源，或用整理过的 `platform=all`，再按 DOI、标题+作者合并重复结果。
- **Semantic Scholar 正文片段检索**：`search_semantic_snippets` 用于检索 Semantic Scholar Open Access snippet 索引中的正文片段，适合查找论文中的方法学细节。该功能需要 `SEMANTIC_SCHOLAR_API_KEY`。
- **开放获取优先下载链**：`download_with_fallback` 会先尝试原生下载、结果里的 PDF URL、PMC/Europe PMC/CORE/OpenAIRE、Unpaywall DOI 解析，只有显式开启时才把 Sci-Hub 作为最后兜底。
- **限速与重试**：内置平台级限速和可重试 API 错误处理。
- **PDF 下载支持**：支持 arXiv、bioRxiv、medRxiv、Semantic Scholar、IACR、Sci-Hub、Springer 开放获取、Wiley DOI 下载等路径。
- **适合 agent 调用**：`tools`、`status`、`search`、`download`、`run` 覆盖简单检索和精确工具调用。

## 快速开始

### 安装

要求 Node.js >= 18.0.0 和 npm。

```bash
npm install -g github:dr-dumpling/paper-search-cli
paper-search setup
paper-search search "machine learning" --platform crossref --max-results 3 --pretty
```

GitHub 安装会运行 package 的 `prepare` 脚本并自动构建 CLI。若 npm 隐藏安装阶段提示，首次运行 `paper-search status --pretty` 仍会提示配置入口。

### 常用检查

```bash
paper-search status --pretty
paper-search tools --pretty
paper-search config doctor --pretty
```

## 支持的平台

| 平台 | 搜索 | 下载 | 全文 | 被引统计 | API Key | 特色功能 |
| --- | --- | --- | --- | --- | --- | --- |
| Crossref | ✅ | ❌ | ❌ | ✅ | ❌ | 默认搜索平台，广泛元数据覆盖 |
| OpenAlex | ✅ | 🟡 条件支持 | ❌ | ✅ | ❌ | 广泛免费元数据；记录含开放链接时可用于回退下载 |
| arXiv | ✅ | ✅ | ✅ | ❌ | ❌ | 物理、计算机、数学等预印本 |
| Web of Science | ✅ | ❌ | ❌ | ✅ | ✅ 必需 | 引文数据库、日期排序、年份范围 |
| PubMed | ✅ | ❌ | ❌ | ❌ | 🟡 可选 | NCBI E-utilities 生物医学文献 |
| PubMed Central | ✅ | ✅ | ✅ | ❌ | ❌ | 生物医学开放全文和 PMC PDF |
| Europe PMC | ✅ | ✅ | ✅ | ❌ | ❌ | 生物医学元数据和开放全文链接 |
| Google Scholar | ✅ | ❌ | ❌ | ✅ | ❌ | 广泛学术发现，基于页面解析 |
| bioRxiv | ✅ | ✅ | ✅ | ❌ | ❌ | 生物学预印本 |
| medRxiv | ✅ | ✅ | ✅ | ❌ | ❌ | 医学预印本 |
| Semantic Scholar | ✅ | ✅ | ✅ 正文片段 | ✅ | 🟡 可选* | AI 语义检索 + OA 正文片段 |
| CORE | ✅ | 🟡 条件支持 | 🟡 条件支持 | ❌ | 🟡 可选 | 记录含 PDF 或全文链接时可下载 |
| OpenAIRE | ✅ | 🟡 条件支持 | ❌ | ❌ | 🟡 可选 | 记录含开放链接时可用于回退下载 |
| Unpaywall | 🟡 条件支持 | 🟡 条件支持 | ❌ | ❌ | ✅ 需要 email | 仅支持 DOI 查询；发现 OA PDF 时可下载 |
| IACR ePrint | ✅ | ✅ | ✅ | ❌ | ❌ | 密码学论文 |
| Sci-Hub | ✅ | ✅ | ❌ | ❌ | ❌ | 基于 DOI 查询和下载 |
| ScienceDirect | ✅ | ❌ | ❌ | ✅ | ✅ 必需 | Elsevier 元数据和摘要 |
| Springer Nature | ✅ | 🟡 条件支持 | ❌ | ❌ | ✅ 必需 | 开放获取记录可下载；元数据 API 需要 key |
| Wiley | ❌ 关键词搜索 | ✅ | ✅ | ❌ | ✅ 必需 | TDM API，仅支持 DOI 下载 PDF |
| Scopus | ✅ | ❌ | ❌ | ✅ | ✅ 必需 | 摘要和引文数据库 |

说明：

- 能力列中，`✅` 表示直接支持，`❌` 表示不支持，`🟡 条件支持` 表示只在满足条件时可用，例如记录里含 PDF/开放获取链接、只能按 DOI 查询，或只能下载开放获取记录。
- API Key 列中，`❌` 表示不需要配置，`🟡 可选` 表示不配置也能用但限额或稳定性较弱，`✅ 必需` 表示必须配置。Unpaywall 需要的是 email，不是传统 API key。
- Wiley TDM API 不支持关键词搜索。应先用 `search_crossref` 找到 Wiley 文章 DOI，再用 `download_paper` 配合 `platform=wiley` 下载。
- `platform=all` 使用整理过、相对稳定的免费/开放/API 来源：Crossref、OpenAlex、PubMed、PMC、Europe PMC、arXiv、bioRxiv、medRxiv、IACR、CORE、OpenAIRE。它默认不包含 Google Scholar、Sci-Hub、付费 key 平台、DOI-only 的 Unpaywall，以及容易触发限流的 Semantic Scholar。
- `--sources` 接受逗号分隔来源，例如 `--sources crossref,openalex,pmc`。
- Semantic Scholar 正文片段检索通过 `search_semantic_snippets` 提供，适合查找方法学细节，需要配置 `SEMANTIC_SCHOLAR_API_KEY`。

## 配置

多数免费元数据来源无需配置。API key 和 email 推荐写入用户级配置文件，这样 CLI 在任意目录运行都能读取：

```bash
paper-search setup
paper-search config set SEMANTIC_SCHOLAR_API_KEY your_semantic_scholar_api_key_here
paper-search config set PAPER_SEARCH_UNPAYWALL_EMAIL you@example.com
paper-search config list --pretty
paper-search config doctor --pretty
```

默认配置路径：

```text
~/.config/paper-search-cli/config.json
```

配置文件权限会写成 `0600`。`config list` 和 `config doctor` 会自动脱敏。

`paper-search setup` 是引导式配置命令。默认只询问推荐配置：Semantic Scholar、Unpaywall email、Crossref email 和 CORE。需要遍历所有支持项时使用 `paper-search setup --all`；只想配置指定项时使用 `paper-search setup --keys SEMANTIC_SCHOLAR_API_KEY,CORE_API_KEY`。

也可以从现有 `.env` 导入：

```bash
paper-search config import-env .env --pretty
```

配置优先级：

1. shell 环境变量。
2. 当前工作目录 `.env`。
3. 用户级配置文件。
4. 免费来源的内置默认值。

仓库本地开发时，继续复制 `.env.example` 也可以：

```bash
cp .env.example .env
```

### 环境变量

```bash
# Web of Science，搜索 Web of Science 时必需
WOS_API_KEY=your_web_of_science_api_key_here
WOS_API_VERSION=v1

# PubMed，可选；从 3 requests/sec 提升到 10 requests/sec
PUBMED_API_KEY=your_ncbi_api_key_here
NCBI_EMAIL=you@example.com
NCBI_TOOL=paper-search-cli

# Semantic Scholar，可选；提升请求限额
SEMANTIC_SCHOLAR_API_KEY=your_semantic_scholar_api_key_here

# Elsevier，ScienceDirect 和 Scopus 必需
ELSEVIER_API_KEY=your_elsevier_api_key_here

# Springer Nature，Springer 检索和开放获取下载必需
SPRINGER_API_KEY=your_springer_api_key_here
SPRINGER_OPENACCESS_API_KEY=your_openaccess_api_key_here

# Wiley TDM，Wiley DOI 下载必需
WILEY_TDM_TOKEN=your_wiley_tdm_token_here

# Crossref polite pool，可选但推荐
CROSSREF_MAILTO=you@example.com

# Unpaywall，DOI 开放获取解析必需
PAPER_SEARCH_UNPAYWALL_EMAIL=you@example.com
UNPAYWALL_EMAIL=you@example.com

# CORE，可选但推荐；匿名访问经常被强限流
PAPER_SEARCH_CORE_API_KEY=your_core_api_key_here
CORE_API_KEY=your_core_api_key_here

# OpenAIRE，可选；公开搜索无需 key
PAPER_SEARCH_OPENAIRE_API_KEY=your_openaire_api_key_here
OPENAIRE_API_KEY=your_openaire_api_key_here
```

### API Key 获取入口

- Web of Science: [Clarivate Developer Portal](https://developer.clarivate.com/apis)
- PubMed: [NCBI API Keys](https://ncbiinsights.ncbi.nlm.nih.gov/2017/11/02/new-api-keys-for-the-e-utilities/)
- Semantic Scholar: [Semantic Scholar API](https://www.semanticscholar.org/product/api)
- Elsevier: [Elsevier Developer Portal](https://dev.elsevier.com/apikey/manage)
- Springer Nature: [Springer Nature Developers](https://dev.springernature.com/)
- Wiley TDM: [Wiley Text and Data Mining](https://onlinelibrary.wiley.com/library-info/resources/text-and-datamining)
- Unpaywall: [Unpaywall Data Format and API](https://unpaywall.org/products/api)
- CORE: [CORE API](https://core.ac.uk/services/api)
- OpenAIRE: [OpenAIRE APIs](https://develop.openaire.eu/)

`.env` 已被 git 忽略。不要提交 API key 或 token。

## Agent Skill

本仓库提供一个可选的 agent skill，位置是 `skills/paper-search/SKILL.md`。如果你的 agent 支持 skills，可以把它安装到对应的 skill 目录。

例如：

```bash
mkdir -p ~/.agents/skills/paper-search
cp skills/paper-search/SKILL.md ~/.agents/skills/paper-search/SKILL.md
```

这个 skill 只负责告诉 agent 如何调用 `paper-search` CLI。API key 仍然通过 `paper-search setup`、`paper-search config`、`.env` 或 shell 环境变量配置。不要把密钥写进 skill 文件。

## 输出约定

默认所有命令都向 stdout 输出 JSON。

```json
{
  "ok": true,
  "tool": "search_papers",
  "message": "Found 1 papers.",
  "data": []
}
```

使用 `--pretty` 输出格式化 JSON：

```bash
paper-search search "machine learning" --platform crossref --max-results 1 --pretty
```

需要原始文本响应时使用 `--format text`：

```bash
paper-search search "machine learning" --platform crossref --max-results 1 --format text
```

需要在 JSON 中保留原始响应文本时使用 `--include-text`：

```bash
paper-search run search_crossref --arg query="machine learning" --arg maxResults=3 --include-text --pretty
```

## 命令

### `paper-search search`

统一检索入口。

```bash
paper-search search <query> [options]
```

示例：

```bash
paper-search search "machine learning" --platform crossref --max-results 10 --pretty
paper-search search "machine learning" --sources crossref,openalex --max-results 2 --pretty
paper-search search "cancer immunotherapy" --platform all --max-results 2 --pretty
paper-search search "transformer neural networks" --platform arxiv --category cs.AI --year 2023 --pretty
paper-search search "COVID-19 vaccine efficacy" --platform pubmed --max-results 20 --year 2023 --pretty
paper-search search "CRISPR gene editing" --platform webofscience --journal Nature --max-results 15 --pretty
```

常用选项：

| 参数 | 说明 |
| --- | --- |
| `--platform` | 数据来源。默认 `crossref` |
| `--sources` | 逗号分隔的多源检索列表，例如 `crossref,openalex,pmc` |
| `--max-results` | 最大返回数量 |
| `--year` | 年份过滤，例如 `2024`、`2020-2024`、`2020-` |
| `--author` | 作者过滤 |
| `--journal` | 期刊过滤 |
| `--category` | 分类过滤，主要用于 arXiv/bioRxiv/medRxiv |
| `--days` | bioRxiv/medRxiv 回溯天数 |
| `--sort-by` | `relevance`、`date` 或 `citations` |
| `--sort-order` | `asc` 或 `desc` |

### `paper-search run`

按内部工具名执行。这个入口最适合 agent 精确调用。

```bash
paper-search run <tool-name> --arg key=value --arg key=value
paper-search run <tool-name> --json-args '{"key":"value"}'
paper-search run <tool-name> --json-args @args.json
```

示例：

```bash
paper-search run search_crossref --arg query="machine learning" --arg maxResults=5 --pretty
paper-search run search_papers --json-args '{"query":"machine learning","sources":"crossref,openalex","maxResults":2}' --pretty
paper-search run search_pubmed --json-args '{"query":"osteoarthritis","maxResults":5,"sortBy":"date"}' --pretty
paper-search run get_paper_by_doi --arg doi="10.1038/nature12373" --pretty
```

### `paper-search tools`

列出全部可用工具名、说明和输入 schema。

```bash
paper-search tools --pretty
```

### `paper-search status`

查看平台能力和 API key 状态。不会打印密钥内容。

```bash
paper-search status --pretty
paper-search status --validate --pretty
```

`--validate` 可能会向平台发起实时请求，只在确实需要验证凭证时使用。

### `paper-search config`

管理用户级配置文件。

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

从支持下载的平台下载论文 PDF。

```bash
paper-search download <paper-id-or-doi> --platform <platform> [--save-path ./downloads]
```

示例：

```bash
paper-search download 2301.00001 --platform arxiv --save-path ./downloads
paper-search download 10.1000/example --platform scihub --save-path ./downloads
paper-search download 10.1111/jtsb.12390 --platform wiley --save-path ./downloads
paper-search run download_with_fallback --arg source=arxiv --arg paperId=1201.0490 --arg doi=10.48550/arxiv.1201.0490 --arg savePath=./downloads --pretty
```

## 工具参考

以下工具名可用于 `paper-search run`。

### `search_papers`

通过统一调度器检索。

```bash
paper-search run search_papers --json-args '{"query":"machine learning","platform":"crossref","maxResults":10,"year":"2023","sortBy":"date"}' --pretty
```

支持的平台：

```text
crossref, arxiv, webofscience, wos, pubmed, biorxiv, medrxiv, semantic,
iacr, googlescholar, scholar, scihub, sciencedirect, springer, scopus,
openalex, unpaywall, pmc, europepmc, core, openaire, all
```

多源检索使用 `sources`：

```bash
paper-search run search_papers --json-args '{"query":"machine learning","sources":"crossref,openalex,pmc","maxResults":2}' --pretty
```

### `search_crossref`

搜索 Crossref，默认免费元数据来源。

```bash
paper-search run search_crossref --arg query="machine learning" --arg maxResults=10 --arg year=2023 --arg sortBy=relevance --arg sortOrder=desc --pretty
```

### `search_arxiv`

搜索 arXiv 预印本。

```bash
paper-search run search_arxiv --arg query="transformer neural networks" --arg maxResults=10 --arg category=cs.AI --arg year=2023 --arg sortBy=date --arg sortOrder=desc --pretty
```

### `search_pubmed`

搜索 PubMed/MEDLINE 生物医学文献。

```bash
paper-search run search_pubmed --json-args '{"query":"COVID-19 vaccine efficacy","maxResults":20,"year":"2023","journal":"New England Journal of Medicine","publicationType":["Journal Article","Clinical Trial"],"sortBy":"date"}' --pretty
```

### 开放元数据与全文来源

这些命令用于开放元数据检索、开放全文发现和 PDF 回退查找：

```bash
paper-search run search_openalex --arg query="machine learning" --arg maxResults=3 --pretty
paper-search run search_unpaywall --arg query="10.48550/arxiv.1201.0490" --pretty
paper-search run search_pmc --arg query="cancer immunotherapy" --arg maxResults=3 --pretty
paper-search run search_europepmc --arg query="cancer genomics" --arg maxResults=3 --pretty
paper-search run search_core --arg query="machine learning" --arg maxResults=3 --pretty
paper-search run search_openaire --arg query="machine learning" --arg maxResults=3 --pretty
```

Unpaywall 只支持 DOI，且需要配置 email。CORE 匿名访问可能很快返回空结果或被限流，长期使用建议配置 API key。

### `search_webofscience`

搜索 Web of Science。需要 `WOS_API_KEY`。

```bash
paper-search run search_webofscience --arg query="CRISPR gene editing" --arg maxResults=15 --arg year=2022 --arg journal=Nature --pretty
```

### `search_google_scholar`

搜索 Google Scholar。

```bash
paper-search run search_google_scholar --arg query="deep learning" --arg maxResults=10 --arg yearLow=2020 --arg yearHigh=2024 --pretty
```

### `search_biorxiv` 和 `search_medrxiv`

按最近天数窗口和可选分类搜索预印本。

```bash
paper-search run search_biorxiv --arg query="genomics" --arg maxResults=10 --arg days=30 --pretty
paper-search run search_medrxiv --arg query="epidemiology" --arg maxResults=10 --arg days=60 --pretty
```

### `search_semantic_scholar`

搜索 Semantic Scholar，可附加领域过滤。

```bash
paper-search run search_semantic_scholar --json-args '{"query":"graph neural networks","maxResults":10,"fieldsOfStudy":["Computer Science"]}' --pretty
```

### `search_semantic_snippets`

搜索 Semantic Scholar 的 Open Access snippet 索引，用于定位论文正文中的方法学细节片段。需要 `SEMANTIC_SCHOLAR_API_KEY`。

```bash
paper-search run search_semantic_snippets --arg query="CMAverse mediation bootstrap confidence interval" --arg limit=5 --arg fieldsOfStudy=Medicine --pretty
```

### `search_iacr`

搜索 IACR ePrint Archive。

```bash
paper-search run search_iacr --arg query="zero knowledge proof" --arg maxResults=10 --arg fetchDetails=true --pretty
```

### `search_sciencedirect`

搜索 ScienceDirect。需要 `ELSEVIER_API_KEY`。

```bash
paper-search run search_sciencedirect --arg query="materials science" --arg maxResults=10 --arg openAccess=true --pretty
```

### `search_scopus`

搜索 Scopus。需要 `ELSEVIER_API_KEY`。

```bash
paper-search run search_scopus --arg query="citation analysis" --arg maxResults=10 --arg documentType=ar --pretty
```

### `search_springer`

搜索 Springer Nature。需要 `SPRINGER_API_KEY`。

```bash
paper-search run search_springer --arg query="machine learning" --arg maxResults=10 --arg type=Journal --arg openAccess=true --pretty
```

### `search_scihub`

通过 DOI 或文章 URL 查询 Sci-Hub，并可选择下载 PDF。

```bash
paper-search run search_scihub --arg doiOrUrl="10.1038/nature12373" --arg downloadPdf=false --pretty
paper-search run search_scihub --arg doiOrUrl="10.1038/nature12373" --arg downloadPdf=true --arg savePath=./downloads --pretty
```

### `check_scihub_mirrors`

查看 Sci-Hub 镜像状态。

```bash
paper-search run check_scihub_mirrors --pretty
paper-search run check_scihub_mirrors --arg forceCheck=true --pretty
```

### `get_paper_by_doi`

按 DOI 查询元数据。

```bash
paper-search run get_paper_by_doi --arg doi="10.1038/nature12373" --arg platform=all --pretty
paper-search run get_paper_by_doi --arg doi="10.1038/nature12373" --arg platform=arxiv --pretty
```

### `download_paper`

从支持的平台下载 PDF。

```bash
paper-search run download_paper --arg paperId="2301.00001" --arg platform=arxiv --arg savePath=./downloads --pretty
```

支持下载的平台：

```text
arxiv, biorxiv, medrxiv, semantic, iacr, scihub, springer, wiley,
pmc, europepmc, core
```

### `download_with_fallback`

按开放获取优先顺序尝试下载：

```bash
paper-search run download_with_fallback --arg source=arxiv --arg paperId=1201.0490 --arg doi=10.48550/arxiv.1201.0490 --arg savePath=./downloads --pretty
paper-search run download_with_fallback --arg source=crossref --arg paperId="10.1038/nature12373" --arg doi="10.1038/nature12373" --arg savePath=./downloads --arg useSciHub=false --pretty
```

`useSciHub` 默认为 `false`；只有明确选择该最后兜底路径时才设置为 `true`。

### `search_wiley`

Wiley TDM API 不支持关键词搜索。应先用 Crossref 检索，再按 DOI 下载：

```bash
paper-search run search_crossref --arg query="site:wiley.com machine learning" --arg maxResults=10 --pretty
paper-search run download_paper --arg paperId="10.1111/example" --arg platform=wiley --pretty
```

### `get_platform_status`

等价于 `paper-search status`。

```bash
paper-search run get_platform_status --pretty
paper-search run get_platform_status --arg validate=true --pretty
```

## 排障

### 找不到命令

直接从项目运行：

```bash
node dist/cli.js status --pretty
```

或注册为本机命令：

```bash
npm link
paper-search status --pretty
```

### 缺少 API Key

运行：

```bash
paper-search status --pretty
```

如果某个平台显示 `missing`，通过 `paper-search setup`、用户级配置或 `.env` 添加对应 key 后重试。

全局安装时推荐写入用户级配置：

```bash
paper-search setup
paper-search config set SEMANTIC_SCHOLAR_API_KEY your_key
paper-search config doctor --pretty
```

### 平台限流

减少 `--max-results`，避免反复实时验证，优先使用官方 API。PubMed、Semantic Scholar 和 CORE 可通过可选 key 提升限额。CORE 匿名访问可能返回 HTTP 429；如果要稳定使用，建议配置 `PAPER_SEARCH_CORE_API_KEY`。

### 脚本解析 JSON

默认解析 stdout 即可。人类可读诊断会写入 stderr。

## 使用边界

部分来源可能受平台条款、机构订阅或当地法律限制。请只在你具备相应访问权限、并符合所在机构和平台规则的前提下使用相关功能。

## 项目来源

本项目是参考 [openags/paper-search-mcp](https://github.com/openags/paper-search-mcp) 的独立 CLI 改写版本。当前定位是单命令终端工具，不需要 MCP 运行时。

## License

MIT
