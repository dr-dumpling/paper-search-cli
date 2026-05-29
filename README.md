# Paper Search CLI

[English](README-en.md)

Paper Search CLI 是一个独立的 Node.js 命令行工具，用于跨多个学术来源检索论文、核验元数据、EasyScholar 检索影响因子和期刊分区等信息、下载 PDF。它面向终端直接使用、自动化脚本和 agent 工作流，提供稳定命令入口和可预测的 JSON 输出。

![Node.js](https://img.shields.io/badge/node.js->=18.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-^5.5.3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platforms](https://img.shields.io/badge/platforms-25-brightgreen.svg)
![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)
[![LinuxDo](https://img.shields.io/badge/LinuxDo-community-1f6feb)](https://linux.do)

感谢真诚、友善、团结、专业的 [LinuxDo](https://linux.do) 社区。本项目的 CLI + Skill 路线和论文检索工作流改进，来自社区交流与开源分享的启发。

[快速开始](#快速开始) · [配置](#配置) · [Agent Skill](#agent-skill) · [支持的平台](#支持的平台) · [命令](#命令) · [工具参考](#工具参考) · [排障](#排障)

## 设计目标

- **免费来源优先**：优先使用公开元数据和开放获取全文路径，再考虑受限或不稳定来源。
- **单一命令入口**：检索、状态检查、下载和精确工具调用都收口到同一个可执行命令。
- **适合 agent 解析**：默认输出稳定 JSON，避免让调用方解析终端文本。
- **来源能力透明**：明确区分哪些平台只能提供元数据、哪些能下载 PDF、哪些需要 API key。
- **无后台服务负担**：每次调用只执行一个命令，返回结果后退出。

## 核心特性

- **25 个学术来源/平台**：Crossref、OpenAlex、PubMed、PubMed Central、Europe PMC、arXiv、bioRxiv、medRxiv、Semantic Scholar、CORE、OpenAIRE、DBLP、ACM Digital Library 元数据、USENIX 元数据、OpenReview、Web of Science、Google Scholar、IACR ePrint、Sci-Hub、IEEE Xplore、ScienceDirect、Springer Nature/SpringerLink、Wiley、Scopus、Unpaywall。
- **影响因子与期刊分区检索**：通过 EasyScholar，检索影响因子、5 年影响因子、JCR/SSCI 分区、中科院分区、JCI、ESI、预警字段，以及可选的官方/自定义原始等级字段等。
- **PDF 下载支持**：支持 arXiv、bioRxiv、medRxiv、Semantic Scholar、IACR、Sci-Hub、Springer 开放获取、Wiley DOI 下载等路径。
- **正文片段检索**：用于检索论文正文片段，数据来源于 Semantic Scholar 中，适合查找论文中的方法学细节等。
- **适合 agent 调用**：`tools`、`status`、`search`、`journal-metrics`、`download`、`run` 覆盖简单检索和精确工具调用。

## 快速开始

### 安装

要求 Node.js >= 18.0.0 和 npm。

```bash
npm install -g paper-search-cli
paper-search setup
paper-search search "machine learning" --platform crossref --max-results 3 --pretty
```

安装后运行 `paper-search setup`，即可把可选 API key 和 email 写入用户级配置。
其中 Unpaywall 和 Crossref 的邮箱项可以直接回车跳过，CLI 会自动写入一个随机前缀的 Gmail 格式邮箱；如果你想使用自己的邮箱，后续再用 `paper-search config set` 覆盖即可。

如果你需要本地开发版，或要验证尚未发布的改动，可以从源码安装：

```bash
git clone git@github.com:dr-dumpling/paper-search-cli.git
cd paper-search-cli
npm install
npm run build
npm install -g .
```

### 常用检查

```bash
paper-search status --pretty
paper-search tools --pretty
paper-search config doctor --pretty
```

## 支持的平台

### 平台类型

下面的能力表仍然是平台能力的准确信息来源。除 25 个论文检索/获取来源外，CLI 还提供 EasyScholar 影响因子、期刊分区等检索；EasyScholar 不参与 `platform=all` 或 `--sources`，应使用 `journal-metrics` / `query_journal_metrics` 调用。

如果只是快速选择检索来源或查询工具，可以先按这些类型判断：

| 类型 | 平台 | 适合场景 |
| --- | --- | --- |
| 综合检索 | Crossref、OpenAlex、Semantic Scholar、Google Scholar | 广覆盖发现、DOI 元数据、引用线索、文献初筛 |
| 影响因子/期刊分区 | EasyScholar | 影响因子、5 年影响因子、JCR/SSCI 分区、中科院分区、JCI、ESI、预警和等级信息 |
| 医学/生命科学 | PubMed、PubMed Central、Europe PMC | 临床、生物医学、公卫、生物医学元数据和开放全文 |
| 预印本/会议稿 | arXiv、bioRxiv、medRxiv、OpenReview、IACR ePrint | 跨学科预印本、生命科学/医学预印本、AI/ML 投稿和密码学 ePrint |
| 计算机/工程 | DBLP、ACM Digital Library 元数据、IEEE Xplore、USENIX | CS 文献目录、工程数据库、系统/安全会议论文 |
| 开放全文/仓储 | CORE、OpenAIRE、Unpaywall | 跨学科仓储发现和开放获取 PDF 回退路径 |
| 引文库/出版商 | Web of Science、Scopus、ScienceDirect、Springer Nature/SpringerLink、Wiley | 机构权限型元数据、引文数据库、出版商记录和下载 |
| DOI 定向获取 | Sci-Hub | DOI 定向获取，并作为 PDF 下载漏斗的最后自动兜底；除非传入 `useSciHub=false` |

部分平台会跨多个实际工作流。例如 Semantic Scholar 既适合广覆盖检索，也常用于 CS/AI；arXiv 覆盖计算机、数学、物理和部分定量学科。这里按主要使用方式归类；做计算机方向检索时，通常会同时用“计算机/工程”和“预印本/会议稿”两组。

### 能力矩阵

#### 综合检索

| 平台 | 搜索 | 下载 | 全文 | 被引统计 | API Key | 特色功能 |
| --- | --- | --- | --- | --- | --- | --- |
| Crossref | ✅ | ❌ | ❌ | ✅ | ❌ | 默认搜索平台，广泛元数据覆盖 |
| OpenAlex | ✅ | 🟡 条件支持 | ❌ | ✅ | ❌ | 广泛免费元数据；记录含开放链接时可用于回退下载 |
| Semantic Scholar | ✅ | ✅ | ✅ 正文片段 | ✅ | 🟡 可选* | AI 语义检索 + OA 正文片段 |
| Google Scholar | ✅ | ❌ | ❌ | ✅ | ❌ | 广泛学术发现，基于页面解析 |

#### 影响因子与期刊分区

| 平台 | 搜索 | 下载 | 全文 | 被引统计 | API Key | 特色功能 |
| --- | --- | --- | --- | --- | --- | --- |
| EasyScholar | ✅ 影响因子/分区检索 | ❌ | ❌ | ❌ | ✅ 必需 | 影响因子、5 年影响因子、JCR/SSCI 分区、中科院分区、JCI、ESI、预警字段，以及可选的官方/自定义原始等级字段 |

#### 医学/生命科学

| 平台 | 搜索 | 下载 | 全文 | 被引统计 | API Key | 特色功能 |
| --- | --- | --- | --- | --- | --- | --- |
| PubMed | ✅ | ❌ | ❌ | ❌ | 🟡 可选 | NCBI E-utilities 生物医学文献 |
| PubMed Central | ✅ | ✅ | ✅ | ❌ | ❌ | 生物医学开放全文和 PMC PDF |
| Europe PMC | ✅ | ✅ | ✅ | ❌ | ❌ | 生物医学元数据和开放全文链接 |

#### 计算机/工程

| 平台 | 搜索 | 下载 | 全文 | 被引统计 | API Key | 特色功能 |
| --- | --- | --- | --- | --- | --- | --- |
| DBLP | ✅ | ❌ | ❌ | ❌ | ❌ | 通过官方 DBLP search API 检索计算机文献目录 |
| ACM Digital Library | ✅ | ❌ | ❌ | ✅ | ❌ | 通过 Crossref 的 ACM DOI 前缀元数据检索；不抓取 ACM 页面 |
| USENIX | ✅ | ❌ | ❌ | ❌ | ❌ | 基于 DBLP 的 USENIX 会议元数据；不抓取 USENIX 搜索页 |
| IEEE Xplore | ✅ | ❌ | ❌ | ✅ | ✅ 必需 | 通过官方 IEEE Xplore Metadata API 检索 IEEE 元数据 |

#### 开放全文/仓储

| 平台 | 搜索 | 下载 | 全文 | 被引统计 | API Key | 特色功能 |
| --- | --- | --- | --- | --- | --- | --- |
| CORE | ✅ | 🟡 条件支持 | 🟡 条件支持 | ❌ | 🟡 可选 | 记录含 PDF 或全文链接时可下载 |
| OpenAIRE | ✅ | 🟡 条件支持 | ❌ | ❌ | 🟡 可选 | 记录含开放链接时可用于回退下载 |
| Unpaywall | 🟡 条件支持 | 🟡 条件支持 | ❌ | ❌ | ✅ 必需 | 仅支持 DOI 查询；需要 email；发现 OA PDF 时可下载 |

#### 预印本/会议稿

| 平台 | 搜索 | 下载 | 全文 | 被引统计 | API Key | 特色功能 |
| --- | --- | --- | --- | --- | --- | --- |
| arXiv | ✅ | ✅ | ✅ | ❌ | ❌ | 物理、计算机、数学等预印本 |
| bioRxiv | ✅ | ✅ | ✅ | ❌ | ❌ | 生物学预印本 |
| medRxiv | ✅ | ✅ | ✅ | ❌ | ❌ | 医学预印本 |
| OpenReview | ✅ | ❌ | ❌ | ❌ | ❌ | 通过公开 OpenReview notes search 检索会议投稿、评审和预印本 |
| IACR ePrint | ✅ | ✅ | ✅ | ❌ | ❌ | 密码学论文 |

#### 引文库/出版商

| 平台 | 搜索 | 下载 | 全文 | 被引统计 | API Key | 特色功能 |
| --- | --- | --- | --- | --- | --- | --- |
| Web of Science | ✅ | ❌ | ❌ | ✅ | ✅ 必需 | 引文数据库、日期排序、年份范围 |
| ScienceDirect | ✅ | ❌ | ❌ | ✅ | ✅ 必需 | Elsevier 元数据和摘要 |
| Springer Nature / SpringerLink | ✅ | 🟡 条件支持 | ❌ | ❌ | ✅ 必需 | `springerlink` 是现有 Springer Nature 集成的别名 |
| Wiley | ❌ 关键词搜索 | ✅ | ✅ | ❌ | ✅ 必需 | TDM API，仅支持 DOI 下载 PDF |
| Scopus | ✅ | ❌ | ❌ | ✅ | ✅ 必需 | 摘要和引文数据库 |

#### DOI 定向获取

| 平台 | 搜索 | 下载 | 全文 | 被引统计 | API Key | 特色功能 |
| --- | --- | --- | --- | --- | --- | --- |
| Sci-Hub | ✅ | ✅ | ❌ | ❌ | ❌ | 基于 DOI 查询和下载 |

说明：

- 能力列中，`✅` 表示直接支持，`❌` 表示不支持，`🟡 条件支持` 表示只在满足条件时可用，例如记录里含 PDF/开放获取链接、只能按 DOI 查询，或只能下载开放获取记录。
- API Key 列中，`❌` 表示不需要配置，`🟡 可选` 表示不配置也能用但限额或稳定性较弱，`✅ 必需` 表示只在启用该平台时必须配置，不代表新用户默认都要配置。Unpaywall 需要的是 email，不是传统 API key。
- Wiley TDM API 不支持关键词搜索。应先用 `search_crossref` 找到 Wiley 文章 DOI，再用 `download_paper` 配合 `platform=wiley` 下载。
- ACM 和 USENIX 检索刻意走元数据后端，不抓取平台搜索页，以遵守 robots.txt 并降低 IP 被封风险。
- `platform=all` 会尝试所有已注册检索来源，但不包含 Wiley 这类只支持 DOI 下载、不能关键词搜索的平台。未配置 key、超时或请求失败的来源会写入 `failed_sources` / `errors`，其他来源继续返回。
- `--sources` 接受逗号分隔来源，例如 `--sources crossref,openalex,pmc`。
- `🟡 可选*` 对 Semantic Scholar 的含义是：普通检索可选；`search_semantic_snippets` 正文片段检索必需配置 `SEMANTIC_SCHOLAR_API_KEY`。
- EasyScholar 是影响因子、期刊分区等检索工具，不是论文检索来源；使用 `paper-search journal-metrics "Nature"` 或 `paper-search run query_journal_metrics`。

## 配置

多数免费元数据来源无需配置。API key 和 email 推荐写入用户级配置文件，这样 CLI 在任意目录运行都能读取：

```bash
paper-search setup
paper-search config set SEMANTIC_SCHOLAR_API_KEY your_semantic_scholar_api_key_here
paper-search setup EASYSCHOLAR_KEY  # 隐藏输入；更适合配置 EasyScholar SecretKey
paper-search config set PAPER_SEARCH_UNPAYWALL_EMAIL you@example.com  # 可选：手动覆盖 setup 自动生成的邮箱
paper-search config list --pretty
paper-search config doctor --pretty
paper-search diagnostics --pretty
```

默认配置路径：

```text
~/.config/paper-search-cli/config.json
```

配置文件权限会写成 `0600`。`config list` 和 `config doctor` 会自动脱敏。

`paper-search setup` 是引导式配置命令。默认只询问推荐配置：Semantic Scholar、Unpaywall email、Crossref email、CORE 和 EasyScholar。需要遍历所有支持项时使用 `paper-search setup --all`；只想配置指定项时使用 `paper-search setup --keys SEMANTIC_SCHOLAR_API_KEY,CORE_API_KEY`。

为降低首次配置成本，如果 `PAPER_SEARCH_UNPAYWALL_EMAIL` / `UNPAYWALL_EMAIL` / `CROSSREF_MAILTO` 尚未配置，setup 时直接回车会自动写入一个随机前缀的 Gmail 格式邮箱，例如 `paper.search.xxxxxx@gmail.com`，用于让 Unpaywall 和 Crossref 的基础请求能直接运行。

`paper-search diagnostics --pretty` 会列出所有依赖 API key 或 email 的能力、相关配置项、当前是否已配置、常见失败原因和建议排查动作。检索命令在 key-backed 平台返回 0 结果，或遇到 401、403、400、429 时，也会在 JSON 输出里附带 `diagnostic` 字段。

### API key 推荐策略

`paper-search setup` 默认只询问最适合普通新用户先配置的项目。平台表里的 `✅ 必需` 是“使用该平台必需”，不是“所有安装都建议配置”。

| 等级 | 配置项 | 是否建议新用户配置 | 说明 |
| --- | --- | --- | --- |
| 默认推荐 | `SEMANTIC_SCHOLAR_API_KEY` | 建议配置 | 开启 Semantic Scholar 正文片段检索，适合方法学细节检索，也能提高请求稳定性。 |
| 默认推荐 | `PAPER_SEARCH_UNPAYWALL_EMAIL` 或 `UNPAYWALL_EMAIL` | 建议配置 | 用 DOI 查找开放获取 PDF；只需要邮箱，不需要申请 API key。`setup` 直接回车会自动生成随机 Gmail 格式邮箱，也可以手动换成自己的邮箱。 |
| 默认推荐 | `CROSSREF_MAILTO` | 建议配置 | 让 Crossref 请求进入 polite pool，适合长期或高频检索。`setup` 直接回车会复用自动生成的邮箱，也可以手动换成自己的邮箱。 |
| 默认推荐 | `CORE_API_KEY` 或 `PAPER_SEARCH_CORE_API_KEY` | 建议配置 | CORE 匿名访问容易限流；配置 key 后更适合开放仓储检索。 |
| 默认推荐 | `EASYSCHOLAR_KEY` 或 `PAPER_SEARCH_EASYSCHOLAR_KEY` | 需要检索影响因子、期刊分区等时建议配置 | 开启 EasyScholar 检索影响因子、JCR 分区、中科院分区、JCI、ESI 和预警字段等能力。建议用 `paper-search setup EASYSCHOLAR_KEY` 通过隐藏输入配置 SecretKey。 |
| 生物医学高频 | `PUBMED_API_KEY`、`NCBI_EMAIL`、`NCBI_TOOL` | 经常用 PubMed 时建议配置 | 提高 NCBI E-utilities 限额，并让请求带上明确客户端信息。 |
| 机构权限型 | `WOS_API_KEY` | 有 Web of Science API 权限再配置 | 用于 Web of Science 检索和引文数据；需要 Clarivate API 权限。 |
| 机构权限型 | `IEEE_API_KEY` | 有 IEEE Xplore API 权限再配置 | 用于 IEEE Xplore 元数据检索；IEEE 可能要求注册 API 访问和产品权限。 |
| 机构权限型 | `ELSEVIER_API_KEY` | 有 Scopus 或 ScienceDirect API 权限再配置 | 同一个 Elsevier key 不等于自动拥有两个产品权限，Scopus 和 ScienceDirect 需要分别开通。 |
| 机构权限型 | `SPRINGER_API_KEY`、`SPRINGER_OPENACCESS_API_KEY` | 需要 Springer 平台时再配置 | 用于 Springer 元数据和开放获取记录；401 通常表示 key 无效或产品权限未开通。 |
| 机构权限型 | `WILEY_TDM_TOKEN` | 有 Wiley TDM/机构全文权限再配置 | 仅支持 DOI 下载；能否下载取决于 token 和机构订阅权限。 |
| 通常不用 | `PAPER_SEARCH_OPENAIRE_API_KEY` 或 `OPENAIRE_API_KEY` | 不建议默认配置 | OpenAIRE 公开检索通常无需 key；只有账号或配额要求时再配置。 |

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

# IEEE Xplore，IEEE 元数据检索必需
IEEE_API_KEY=your_ieee_api_key_here

# PubMed，可选；从 3 requests/sec 提升到 10 requests/sec
PUBMED_API_KEY=your_ncbi_api_key_here
NCBI_EMAIL=you@example.com
NCBI_TOOL=paper-search-cli

# Semantic Scholar，正文片段检索必需，也可提升请求限额
SEMANTIC_SCHOLAR_API_KEY=your_semantic_scholar_api_key_here

# EasyScholar，检索影响因子、JCR 分区和中科院分区等信息时必需
EASYSCHOLAR_KEY=your_easyscholar_secret_key_here

# Elsevier，Scopus 和 ScienceDirect 必需；两个产品仍需要分别开通权限
ELSEVIER_API_KEY=your_elsevier_api_key_here

# Springer Nature，Springer 检索和开放获取下载必需
SPRINGER_API_KEY=your_springer_api_key_here
SPRINGER_OPENACCESS_API_KEY=your_openaccess_api_key_here

# Wiley TDM，Wiley DOI 下载必需
WILEY_TDM_TOKEN=your_wiley_tdm_token_here

# Crossref polite pool，可选但推荐；setup 直接回车会自动生成/复用随机 Gmail 格式邮箱
CROSSREF_MAILTO=you@example.com

# Unpaywall，DOI 开放获取解析必需；setup 直接回车会自动生成随机 Gmail 格式邮箱
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
- IEEE Xplore: [IEEE Xplore Metadata API](https://developer.ieee.org/docs/read/Searching_the_IEEE_Xplore_Metadata_API)
- PubMed: [NCBI API Keys](https://ncbiinsights.ncbi.nlm.nih.gov/2017/11/02/new-api-keys-for-the-e-utilities/)
- Semantic Scholar: [Semantic Scholar API](https://www.semanticscholar.org/product/api)
- EasyScholar: [EasyScholar Open API](https://www.easyscholar.cc/console/user/open)
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
paper-search run query_journal_metrics --json-args '{"journals":["Nature","BMJ"],"includeRaw":true}' --pretty
```

### `paper-search journal-metrics`

通过 EasyScholar 检索影响因子、期刊分区等信息。需要配置 `EASYSCHOLAR_KEY` 或 `PAPER_SEARCH_EASYSCHOLAR_KEY`。

```bash
paper-search journal-metrics "Nature" "BMJ" --pretty
paper-search journal-metrics --file journals.txt --include-raw --pretty
```

标准化返回字段包括 `impact_factor`、`impact_factor_5y`、`jcr_quartile`、`ssci_quartile`、`jci`、`cas_base`、`cas_upgraded`、`cas_small`、`cas_top`、`cas_zone`、`esi`、`warning`、`pku`、`cssci`、`cscd`、`ahci`、`ccf`、`ei` 和 `china_st_core`，具体以 EasyScholar 对该期刊实际返回字段为准。加 `--include-raw` 会额外保留 `official_all`、`official_select` 和 `custom_rank`。

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

### `paper-search diagnostics`

查看依赖 API key / email 的能力和排障建议。不会打印密钥内容。

```bash
paper-search diagnostics --pretty
```

当命令在已配置 key 的平台返回 0 结果，或遇到 401、403、400、429 时，JSON 输出会包含 `diagnostic` 字段，说明可能原因和下一步操作。

### `paper-search config`

管理用户级配置文件。

```bash
paper-search config init --pretty
paper-search config set SEMANTIC_SCHOLAR_API_KEY your_key --pretty
paper-search config set PAPER_SEARCH_UNPAYWALL_EMAIL you@example.com --pretty  # 可选：手动覆盖 setup 自动生成的邮箱
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
iacr, googlescholar, scholar, scihub, ieee, sciencedirect, springer,
springerlink, scopus, openalex, unpaywall, pmc, europepmc, core,
openaire, dblp, acm, usenix, openreview, all
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

### 注册表驱动的平台检索

这些偏元数据检索的工具由平台注册表生成；后续接入新平台时，只需要增加新的 searcher 和平台注册信息：

```bash
paper-search run search_dblp --arg query="graph neural networks" --arg maxResults=5 --pretty
paper-search run search_acm --arg query="software testing" --arg maxResults=5 --pretty
paper-search run search_usenix --arg query="file systems" --arg maxResults=5 --pretty
paper-search run search_openreview --arg query="large language models" --arg maxResults=5 --pretty
paper-search run search_springerlink --arg query="machine learning" --arg maxResults=5 --pretty
```

`search_ieee` 使用同一套通用参数，但需要配置 `IEEE_API_KEY`：

```bash
paper-search run search_ieee --arg query="wireless networks" --arg maxResults=5 --arg articleTitle="wireless" --pretty
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

### `search_semantic_snippets`

搜索 Semantic Scholar 的 Open Access snippet 索引，用于定位论文正文中的方法学细节片段。需要 `SEMANTIC_SCHOLAR_API_KEY`。

```bash
paper-search run search_semantic_snippets --arg query="CMAverse mediation bootstrap confidence interval" --arg limit=5 --arg fieldsOfStudy=Medicine --pretty
```

### `query_journal_metrics`

检索 EasyScholar 影响因子、期刊分区等信息。它不是论文检索来源，而是影响因子与期刊分区检索工具，适合投稿规划、目标期刊筛选和投稿前检查。需要配置 `EASYSCHOLAR_KEY` 或 `PAPER_SEARCH_EASYSCHOLAR_KEY`。

```bash
paper-search run query_journal_metrics --json-args '{"journals":["Nature","BMJ"]}' --pretty
paper-search run query_journal_metrics --json-args '{"journal":"Journal of Medical Internet Research","includeRaw":true}' --pretty
```

标准化的 `core` 对象只返回 EasyScholar 对该期刊实际存在的字段，例如影响因子、JCR/SSCI 分区、中科院分区、JCI、ESI、预警字段和中文/学科等级信息。需要完整官方和自定义等级数据时，使用 `includeRaw=true` 保留 `officialRank.all`、`officialRank.select` 和 `customRank`。

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

从指定平台下载 PDF。如果该平台没有原生下载器，或原生下载失败，会进入与 `download_with_fallback` 相同的下载漏斗。

```bash
paper-search run download_paper --arg paperId="2301.00001" --arg platform=arxiv --arg savePath=./downloads --pretty
```

原生下载平台：

```text
arxiv, biorxiv, medrxiv, semantic, iacr, scihub, springer, wiley,
pmc, europepmc, core
```

其他已注册来源，例如 `crossref`、`openalex`、`dblp`、`acm`、`usenix`、`openreview`，也可以传给 `download_paper`；它们会直接进入元数据/仓储/Unpaywall/Sci-Hub 回退漏斗。

### `download_with_fallback`

按完整下载漏斗尝试下载。顺序是原生下载、元数据 PDF URL、仓储发现、Unpaywall DOI 解析，最后默认使用 Sci-Hub 兜底：

```bash
paper-search run download_with_fallback --arg source=arxiv --arg paperId=1201.0490 --arg doi=10.48550/arxiv.1201.0490 --arg savePath=./downloads --pretty
paper-search run download_with_fallback --arg source=crossref --arg paperId="10.1038/nature12373" --arg doi="10.1038/nature12373" --arg savePath=./downloads --pretty
```

`useSciHub` 默认为 `true`；只有需要关闭该最后兜底路径时才设置为 `false`。`download_paper` 在指定平台下载失败或平台不支持直接下载时，也会进入同一条漏斗。

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

本项目认可并感谢 [LinuxDo](https://linux.do) 社区。

本项目的 CLI + Skill 路线和论文检索工作流改进，来自社区交流与开源分享的启发。当前定位是单命令终端工具，不需要 MCP 运行时。

项目也参考了 [openags/paper-search-mcp](https://github.com/openags/paper-search-mcp) 的相关思路，并将工作流适配为独立 CLI。

## License

MIT
