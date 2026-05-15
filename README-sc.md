# Paper Search CLI

[English](README.md)

Paper Search CLI 是一个独立的 Node.js 命令行工具，用于跨多个学术来源检索论文、核验元数据和下载 PDF。它面向终端直接使用、自动化脚本和 agent 工作流，提供稳定命令入口和可预测的 JSON 输出。

它继承了之前 Paper Search 实现中的平台覆盖、统一数据模型、安全处理和详细功能说明，但运行方式已经收口为普通 CLI：每次调用执行一次命令，执行完即退出，不需要配置、启动或维护长期后台服务。

![Node.js](https://img.shields.io/badge/node.js->=18.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-^5.5.3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platforms](https://img.shields.io/badge/platforms-14-brightgreen.svg)
![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)

## 核心特性

- **14 个学术平台**：Crossref、arXiv、Web of Science、PubMed、Google Scholar、bioRxiv、medRxiv、Semantic Scholar、IACR ePrint、Sci-Hub、ScienceDirect、Springer Nature、Wiley、Scopus。
- **单一命令入口**：安装后通过 `paper-search` 调用，适合终端、脚本和 agent。
- **JSON 优先输出**：stdout 默认输出 JSON，stderr 保留给人类可读日志和错误。
- **统一论文数据模型**：标准化标题、作者、DOI、来源、日期、摘要、PDF 链接、引用数和平台扩展字段。
- **安全优先**：DOI 校验、查询清理、敏感信息脱敏、结构化错误处理。
- **限速与重试**：内置平台级限速和可重试 API 错误处理。
- **PDF 下载支持**：支持 arXiv、bioRxiv、medRxiv、Semantic Scholar、IACR、Sci-Hub、Springer 开放获取、Wiley DOI 下载等路径。
- **适合 agent 调用**：`tools`、`status`、`search`、`download`、`run` 覆盖简单检索和精确工具调用。

## 支持的平台

| 平台 | 搜索 | 下载 | 全文 | 被引统计 | API Key | 特色功能 |
| --- | --- | --- | --- | --- | --- | --- |
| Crossref | 支持 | 不支持 | 不支持 | 支持 | 不需要 | 默认搜索平台，广泛元数据覆盖 |
| arXiv | 支持 | 支持 | 支持 | 不支持 | 不需要 | 物理、计算机、数学等预印本 |
| Web of Science | 支持 | 不支持 | 不支持 | 支持 | 必需 | 引文数据库、日期排序、年份范围 |
| PubMed | 支持 | 不支持 | 不支持 | 不支持 | 可选 | NCBI E-utilities 生物医学文献 |
| Google Scholar | 支持 | 不支持 | 不支持 | 支持 | 不需要 | 广泛学术发现，基于页面解析 |
| bioRxiv | 支持 | 支持 | 支持 | 不支持 | 不需要 | 生物学预印本 |
| medRxiv | 支持 | 支持 | 支持 | 不支持 | 不需要 | 医学预印本 |
| Semantic Scholar | 支持 | 支持 | 不支持 | 支持 | 可选 | AI 语义检索 |
| IACR ePrint | 支持 | 支持 | 支持 | 不支持 | 不需要 | 密码学论文 |
| Sci-Hub | 支持 | 支持 | 不支持 | 不支持 | 不需要 | 基于 DOI 查询和下载 |
| ScienceDirect | 支持 | 不支持 | 不支持 | 支持 | 必需 | Elsevier 元数据和摘要 |
| Springer Nature | 支持 | 仅开放获取 | 不支持 | 不支持 | 必需 | Metadata API 和 OpenAccess API |
| Wiley | 不支持关键词搜索 | 支持 | 支持 | 不支持 | 必需 | TDM API，仅支持 DOI 下载 PDF |
| Scopus | 支持 | 不支持 | 不支持 | 支持 | 必需 | 摘要和引文数据库 |

说明：

- Wiley TDM API 不支持关键词搜索。应先用 `search_crossref` 找到 Wiley 文章 DOI，再用 `download_paper` 配合 `platform=wiley` 下载。
- `platform=all` 使用当前调度器逻辑，可能采用聚焦检索或降级路径，而不是无差别穷举所有来源。
- Google Scholar 和 Sci-Hub 可能存在法律、服务条款或限流风险，见 [合规说明](#合规说明)。

## 快速开始

### 系统要求

- Node.js >= 18.0.0
- npm

### 从 GitHub 安装

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

多数免费元数据来源无需配置。只有需要高级平台或更高限流时，才需要复制 `.env.example`。

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
```

### API Key 获取入口

- Web of Science: [Clarivate Developer Portal](https://developer.clarivate.com/apis)
- PubMed: [NCBI API Keys](https://ncbiinsights.ncbi.nlm.nih.gov/2017/11/02/new-api-keys-for-the-e-utilities/)
- Semantic Scholar: [Semantic Scholar API](https://www.semanticscholar.org/product/api)
- Elsevier: [Elsevier Developer Portal](https://dev.elsevier.com/apikey/manage)
- Springer Nature: [Springer Nature Developers](https://dev.springernature.com/)
- Wiley TDM: [Wiley Text and Data Mining](https://onlinelibrary.wiley.com/library-info/resources/text-and-datamining)

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
paper-search search "transformer neural networks" --platform arxiv --category cs.AI --year 2023 --pretty
paper-search search "COVID-19 vaccine efficacy" --platform pubmed --max-results 20 --year 2023 --pretty
paper-search search "CRISPR gene editing" --platform webofscience --journal Nature --max-results 15 --pretty
```

常用选项：

| 参数 | 说明 |
| --- | --- |
| `--platform` | 数据来源。默认 `crossref` |
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
iacr, googlescholar, scholar, scihub, sciencedirect, springer, scopus, all
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
arxiv, biorxiv, medrxiv, semantic, iacr, scihub, springer, wiley
```

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

如果某个平台显示 `missing`，把对应 key 加到 `.env` 后重试。

### 平台限流

减少 `--max-results`，避免反复实时验证，优先使用官方 API。PubMed 和 Semantic Scholar 可通过可选 key 提升限额。

### 脚本解析 JSON

默认解析 stdout 即可。人类可读诊断会写入 stderr。

## 合规说明

本项目包含的部分集成可能涉及法律、授权或服务条款限制。你需要确保使用方式符合当地法律、机构政策和第三方平台条款。

- Sci-Hub 在许多司法辖区可能涉及未经授权访问受版权保护内容。请仅在你有合法访问权的情况下使用。
- Google Scholar 自动化可能违反平台条款或触发封禁/限流。合规敏感任务应优先使用官方 API 或开放元数据来源。
- 平台 API key 可能受机构条款约束。不要分享或提交凭证。

## License

MIT
