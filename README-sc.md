# Paper Search CLI

[English](README.md)

Paper Search CLI 是一个独立的 Node.js 命令行工具，用于跨多个学术来源检索论文、核验元数据和下载 PDF。它面向终端直接使用、自动化脚本和 agent 工作流，提供稳定命令入口和可预测的 JSON 输出。

它继承了之前 Paper Search 实现中的平台覆盖、统一数据模型、安全处理和详细功能说明，但运行方式已经收口为普通 CLI：每次调用执行一次命令，执行完即退出，不需要配置、启动或维护长期后台服务。

![Node.js](https://img.shields.io/badge/node.js->=18.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-^5.5.3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platforms](https://img.shields.io/badge/platforms-20-brightgreen.svg)
![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)

## 当前状态

| 项目 | 状态 |
| --- | --- |
| 运行方式 | 独立 Node.js CLI |
| 主命令 | `paper-search` |
| 当前平台数量 | 已实现 20 个来源/平台 |
| 输出方式 | 默认 JSON，可选文本输出 |
| 配置方式 | shell 环境变量/当前目录 `.env`，以及 `~/.config/paper-search-cli/config.json` 用户级配置 |
| 当前推荐默认源 | `crossref` + `openalex` 用于广泛元数据，`pubmed` + `pmc`/`europepmc` 用于生物医学检索，`arxiv` 用于预印本 |
| 已吸纳的上游思路 | `--sources` 多源检索、DOI/标题去重、开放获取优先 `download_with_fallback` |

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
- **开放获取优先下载链**：`download_with_fallback` 会先尝试原生下载、结果里的 PDF URL、PMC/Europe PMC/CORE/OpenAIRE、Unpaywall DOI 解析，只有显式开启时才把 Sci-Hub 作为最后兜底。
- **安全优先**：DOI 校验、查询清理、敏感信息脱敏、结构化错误处理。
- **限速与重试**：内置平台级限速和可重试 API 错误处理。
- **PDF 下载支持**：支持 arXiv、bioRxiv、medRxiv、Semantic Scholar、IACR、Sci-Hub、Springer 开放获取、Wiley DOI 下载等路径。
- **适合 agent 调用**：`tools`、`status`、`search`、`download`、`run` 覆盖简单检索和精确工具调用。

## 支持的平台

| 平台 | 搜索 | 下载 | 全文 | 被引统计 | API Key | 特色功能 |
| --- | --- | --- | --- | --- | --- | --- |
| Crossref | 支持 | 不支持 | 不支持 | 支持 | 不需要 | 默认搜索平台，广泛元数据覆盖 |
| OpenAlex | 支持 | 通过回退 URL | 不支持 | 支持 | 不需要 | 广泛免费元数据、概念标签、开放获取位置发现 |
| arXiv | 支持 | 支持 | 支持 | 不支持 | 不需要 | 物理、计算机、数学等预印本 |
| Web of Science | 支持 | 不支持 | 不支持 | 支持 | 必需 | 引文数据库、日期排序、年份范围 |
| PubMed | 支持 | 不支持 | 不支持 | 不支持 | 可选 | NCBI E-utilities 生物医学文献 |
| PubMed Central | 支持 | 支持 | 支持 | 不支持 | 不需要 | 生物医学开放全文和 PMC PDF |
| Europe PMC | 支持 | 支持 | 支持 | 不支持 | 不需要 | 生物医学元数据和开放全文链接 |
| Google Scholar | 支持 | 不支持 | 不支持 | 支持 | 不需要 | 广泛学术发现，基于页面解析 |
| bioRxiv | 支持 | 支持 | 支持 | 不支持 | 不需要 | 生物学预印本 |
| medRxiv | 支持 | 支持 | 支持 | 不支持 | 不需要 | 医学预印本 |
| Semantic Scholar | 支持 | 支持 | 不支持 | 支持 | 可选 | AI 语义检索 |
| CORE | 支持 | 取决于记录 | 取决于记录 | 不支持 | 可选 | 开放仓储元数据和 PDF 候选 |
| OpenAIRE | 支持 | 通过回退 URL | 不支持 | 不支持 | 可选 | 开放仓储发现源 |
| Unpaywall | 仅 DOI | 通过回退 URL | 不支持 | 不支持 | 需要 email | 基于 DOI 的开放获取解析 |
| IACR ePrint | 支持 | 支持 | 支持 | 不支持 | 不需要 | 密码学论文 |
| Sci-Hub | 支持 | 支持 | 不支持 | 不支持 | 不需要 | 基于 DOI 查询和下载 |
| ScienceDirect | 支持 | 不支持 | 不支持 | 支持 | 必需 | Elsevier 元数据和摘要 |
| Springer Nature | 支持 | 仅开放获取 | 不支持 | 不支持 | 必需 | Metadata API 和 OpenAccess API |
| Wiley | 不支持关键词搜索 | 支持 | 支持 | 不支持 | 必需 | TDM API，仅支持 DOI 下载 PDF |
| Scopus | 支持 | 不支持 | 不支持 | 支持 | 必需 | 摘要和引文数据库 |

说明：

- Wiley TDM API 不支持关键词搜索。应先用 `search_crossref` 找到 Wiley 文章 DOI，再用 `download_paper` 配合 `platform=wiley` 下载。
- `platform=all` 使用整理过、相对稳定的免费/开放/API 来源：Crossref、OpenAlex、PubMed、PMC、Europe PMC、arXiv、bioRxiv、medRxiv、IACR、CORE、OpenAIRE。它默认不包含 Google Scholar、Sci-Hub、付费 key 平台、DOI-only 的 Unpaywall，以及容易触发限流的 Semantic Scholar。
- `--sources` 接受逗号分隔来源，例如 `--sources crossref,openalex,pmc`。
- Google Scholar 和 Sci-Hub 可能存在法律、服务条款或限流风险，见 [合规说明](#合规说明)。

## 已吸纳的上游思路

上游实现里真正适合独立 CLI 的部分已经迁移进来。这里的目标不是照搬所有来源，而是在保持默认行为稳定、合规风险更低的前提下，提高召回和开放 PDF 发现能力。

| 能力 | 当前 CLI 状态 | 说明 |
| --- | --- | --- |
| 更广的开放元数据 | 已实现 | `search_openalex`，也可通过 `--sources openalex` 和整理过的 `platform=all` 使用 |
| DOI 开放获取解析 | 已实现 | `search_unpaywall` 和 `download_with_fallback`；需要 `PAPER_SEARCH_UNPAYWALL_EMAIL` 或 `UNPAYWALL_EMAIL` |
| 生物医学开放全文 | 已实现 | `search_pmc` 和 `search_europepmc`，可参与回退下载链 |
| 仓储型 PDF 发现 | 已实现第一批 | `search_core` 和 `search_openaire`；CORE 配 key 更稳定，OpenAIRE 作为发现型元数据来源 |
| 多来源并发检索与去重 | 已实现 | `--sources crossref,openalex,pmc` 或 `platform=all`；按 DOI、标题+作者去重 |
| 开放获取优先下载链 | 已实现 | `download_with_fallback` 依次尝试原生下载、结果 PDF URL、PMC/Europe PMC/CORE/OpenAIRE、Unpaywall，最后才是显式开启的 Sci-Hub |

仍作为候选的能力：

| 候选项 | 建议状态 | 原因 |
| --- | --- | --- |
| Zenodo、HAL、DOAJ、dblp | 后续推荐纳入 | 有开放元数据/仓储价值，但优先级低于 OpenAlex/PMC/Europe PMC |
| SSRN、CiteSeerX、BASE | 可选或实验 | 特定领域有用，但访问稳定性和返回格式不够统一 |
| IEEE、ACM | 可选付费 key 连接器 | 应隔离在显式 API key 或机构访问之后 |
| Semantic Scholar 默认 fan-out | 仅显式使用 | 该来源有用，但免费额度容易返回 HTTP 429；需要时直接调用或写入 `--sources` |
| Google Scholar 自动化 | 仅 best-effort | 现有页面解析来源保留为显式调用，不进入整理过的 `platform=all` |
| Sci-Hub 回退 | 仅显式 opt-in | 不会静默使用；`download_with_fallback` 必须设置 `useSciHub=true` |

## 快速开始

### 系统要求

- Node.js >= 18.0.0
- npm

### 从 GitHub 安装

全局一键安装：

```bash
npm install -g github:dr-dumpling/paper-search-cli
paper-search setup
paper-search status --pretty
```

GitHub 安装会运行 package 的 `prepare` 脚本，因此安装过程中会自动构建 `dist/cli.js`。package 也包含安装后提示；如果 npm 当前配置隐藏生命周期脚本输出，第一次运行 `paper-search status --pretty` 仍会提示用户使用 `paper-search setup` 配置 API key。

本地开发安装：

```bash
git clone https://github.com/dr-dumpling/paper-search-cli.git
cd paper-search-cli
npm install
npm run build
```

### 直接运行

```bash
node dist/cli.js status --pretty
node dist/cli.js search "large language model evaluation" --platform crossref --max-results 5 --pretty
```

### 注册为本机命令

```bash
npm link
paper-search status --pretty
paper-search search "osteoarthritis occupational exposure" --platform pubmed --max-results 3 --pretty
```

`npm link` 会把当前 checkout 注册成本机命令。代码变更后重新运行 `npm run build`。

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

这些工具对应本轮吸纳的开放发现链：

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

搜索 Semantic Scholar 的 Open Access snippet 索引。它检索题名、摘要和正文片段；只有 `snippet.snippetKind="body"` 才能当作正文证据。需要 `SEMANTIC_SCHOLAR_API_KEY`。

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

## 开发

### 构建

```bash
npm run build
```

### 测试

```bash
npm test -- --runInBand
```

### 类型检查

```bash
npm exec tsc -- --noEmit
```

### 安全审计

```bash
npm audit --omit=dev
```

### 打包与发布

当前 package 已支持一键安装：

- `build` 会先清理 `dist/` 再编译，避免过期构建产物进入发布包。
- `prepare` 为 GitHub 安装构建 `dist/cli.js`，例如 `npm install -g github:dr-dumpling/paper-search-cli`，也会用于 `npm pack`。
- `postinstall` 在 npm 生命周期输出可见时打印 API key 配置入口；安装阶段不直接索要密钥。
- `prepublishOnly` 在 `npm publish` 前运行测试和构建。
- `files` 限制发布包只包含 `dist/`、postinstall 脚本、文档、许可证和 `.env.example`。

发布检查清单：

```bash
npm test -- --runInBand
npm run build
npm pack --dry-run
npm publish --access public
```

正式发布到 npm 后，用户可以这样安装：

```bash
npm install -g paper-search-cli
paper-search setup
paper-search status --pretty
```

### 目录结构

```text
src/cli.ts               CLI 入口
src/core/                工具注册、参数 schema、调度器、搜索器初始化
src/platforms/           各平台检索和下载实现
src/models/              统一论文数据模型
src/services/            共享上层服务
src/utils/               日志、限速、配额、缓存、安全、PDF 工具
tests/                   单元测试和集成测试
```

### 新增平台

1. 在 `src/platforms/` 创建新的 searcher。
2. 继承 `PaperSource`，实现 `search`、`downloadPdf`、`readPaper` 和 `getCapabilities`。
3. 在 `src/core/searchers.ts` 注册 searcher。
4. 在 `src/core/schemas.ts` 添加参数 schema。
5. 在 `src/core/tools.ts` 添加工具定义。
6. 在 `src/core/handleToolCall.ts` 添加调度逻辑。
7. 在 `tests/platforms/` 添加测试。
8. 运行构建、测试和审计。

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

## 合规说明

本项目包含的部分集成可能涉及法律、授权或服务条款限制。你需要确保使用方式符合当地法律、机构政策和第三方平台条款。

- Sci-Hub 在许多司法辖区可能涉及未经授权访问受版权保护内容。请仅在你有合法访问权的情况下使用。
- Google Scholar 自动化可能违反平台条款或触发封禁/限流。合规敏感任务应优先使用官方 API 或开放元数据来源。
- `platform=all` 默认避开 Google Scholar、Sci-Hub、付费 key 平台、DOI-only 的 Unpaywall 和容易限流的 Semantic Scholar。需要使用这些来源时应显式指定。
- 平台 API key 可能受机构条款约束。不要分享或提交凭证。

## License

MIT
