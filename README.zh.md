# Paper Search CLI

简体中文 | [English](README.md)

Paper Search CLI 是一个面向 AI agent 的 Skill + CLI 包，基于独立的 Node.js 命令行工具构建，用于学术文献工作。它为 AI agent、终端用户和脚本提供一个可复现的命令层，并通过 agent 友好的 JSON 输出覆盖文献元数据检索、期刊指标检索、PDF 获取/下载和论文正文片段检索。

![Node.js](https://img.shields.io/badge/node.js->=18.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-^5.5.3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platforms](https://img.shields.io/badge/platforms-25-brightgreen.svg)
![Version](https://img.shields.io/badge/version-0.3.0-blue.svg)
[![LinuxDo](https://img.shields.io/badge/LinuxDo-community-1f6feb)](https://linux.do)

[快速开始](#快速开始) | [架构说明](#架构说明) | [配置](#配置) | [Agent Skill](#agent-skill) | [支持平台](#支持平台) | [命令](#命令) | [排障](#排障)

## 核心功能

| 功能 | 主要命令 | 返回内容 |
| --- | --- | --- |
| 文献元数据检索 | `paper-search search`, `paper-search run search_*` | 题名、作者、年份、期刊、DOI、PMID/PMCID、arXiv ID、URL、摘要和来源元数据 |
| 期刊指标检索 | `paper-search journal-metrics`, `paper-search run query_journal_metrics` | 影响因子、5 年 IF、JCR/SSCI 分区、中科院分区、JCI、ESI、预警和等级字段 |
| PDF 获取和下载 | `paper-search download`, `paper-search run download_with_fallback` | 通过原生来源、开放获取、已配置权限来源和启用时的 Sci-Hub fallback 获取 PDF |
| 正文片段检索 | `paper-search run search_semantic_snippets` | Semantic Scholar Open Access 正文片段，用于查方法、参数和写法线索 |

## 架构说明

`paper-search` 不是 MCP Server，而是普通 CLI。AI 工具可以通过随包发布的 Skill 调用它，终端用户和脚本也可以直接调用同一个 `paper-search` 命令。

| 层 | 负责什么 |
| --- | --- |
| CLI 本体 | 执行文献检索、期刊指标检索、PDF 获取/下载、正文片段检索和稳定 JSON 输出 |
| Bundled Skill | 随包发布 `skills/paper-search`，提供 agent 路由规则和 focused references；不保存密钥、cookie 或账号信息 |
| Friendly Management Layer | 围绕四个主要能力 `metadata_search`、`journal_metrics`、`pdf_discovery`、`body_snippet_search` 提供 `doctor`、`smoke`、`skills`、`config`、`tools`。`doctor` 健康报告包含脱敏配置、Capability Profile、平台/来源状态、缺失项和降级项；`smoke` 检查命令入口连通性和 live 可用性；`skills` 负责同步随包发布的 Skill |

四个主要能力由 CLI 本体执行，由管理层报告和检查。Capability Profile 也会报告 `entitled_access`，让用户看到出版商 API key、数据库 key、TDM token 或机构权限是否已配置。某一个能力缺少配置或降级，不会导致其他独立能力不可用。

## 快速开始

要求 Node.js >= 18.0.0 和 npm。

```bash
npm install -g paper-search-cli
paper-search setup
paper-search doctor --pretty
```

尝试四个主要功能：

```bash
paper-search search "machine learning clinical prediction" --platform crossref --max-results 3 --pretty
paper-search journal-metrics "Nature" "BMJ" --pretty
paper-search download 10.48550/arxiv.1201.0490 --platform arxiv --save-path ./downloads
paper-search run search_semantic_snippets --arg query="propensity score matching" --arg maxResults=3 --pretty
```

常用检查：

```bash
paper-search tools --pretty
paper-search doctor --format text
paper-search smoke --mock --pretty
paper-search skills status --pretty
```

## 支持平台

平台组表适合快速选来源；下面的能力矩阵用于更清楚地判断每个平台实际能做什么。

### 平台组

| 平台组 | 平台 | 主要用途 |
| --- | --- | --- |
| 综合学术元数据 | Crossref, OpenAlex, Semantic Scholar, Google Scholar | 广覆盖发现、DOI 元数据、引用线索、文献初筛 |
| 期刊指标 | EasyScholar | 影响因子、JCR/SSCI 分区、中科院分区、JCI、ESI、预警 |
| 生物医学和生命科学 | PubMed, PubMed Central, Europe PMC | 生物医学元数据、PMID/PMCID 核验、开放全文 |
| 预印本和会议稿 | arXiv, bioRxiv, medRxiv, OpenReview, IACR ePrint | 预印本、AI/ML 投稿、密码学 ePrint |
| 计算机和工程 | DBLP, ACM metadata, IEEE Xplore, USENIX | CS 目录、工程元数据、会议论文 |
| 开放获取和仓储 | CORE, OpenAIRE, Unpaywall | 仓储发现和开放获取 PDF fallback |
| 引文库和出版商 | Web of Science, Scopus, ScienceDirect, Springer Nature/SpringerLink, Wiley | 机构权限元数据、出版商记录、entitled access |
| DOI 定向 fallback | Sci-Hub | 启用时作为 DOI 定向 PDF fallback |

### 能力矩阵

#### 综合学术元数据

| 平台 | 元数据检索 | PDF 路径 | 正文/全文 | 被引统计 | 配置 | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| Crossref | ✅ 支持 | ❌ 不支持 | ❌ 不支持 | ✅ 支持 | ❌ 不需要 | 默认广覆盖元数据来源 |
| OpenAlex | ✅ 支持 | 🟡 条件支持 | ❌ 不支持 | ✅ 支持 | ❌ 不需要 | 免费元数据；记录含 OA 链接时可帮助 PDF fallback |
| Semantic Scholar | ✅ 支持 | 🟡 条件支持 | ✅ 正文片段 | ✅ 支持 | 🟡 可选；正文片段需要 `SEMANTIC_SCHOLAR_API_KEY` | 适合 AI/CS 和正文片段线索 |
| Google Scholar | ✅ 支持 | ❌ 不支持 | ❌ 不支持 | ✅ 支持 | ❌ 不需要 | 基于页面解析的广覆盖发现 |

#### 期刊指标

| 平台 | 元数据检索 | PDF 路径 | 正文/全文 | 被引统计 | 配置 | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| EasyScholar | 🟡 仅期刊指标 | ❌ 不支持 | ❌ 不支持 | ❌ 不支持 | ✅ 必需 `EASYSCHOLAR_KEY` | 影响因子、JCR/SSCI 分区、中科院分区、JCI、ESI、预警和等级字段 |

#### 生物医学和生命科学

| 平台 | 元数据检索 | PDF 路径 | 正文/全文 | 被引统计 | 配置 | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| PubMed | ✅ 支持 | ❌ 不支持 | ❌ 不支持 | ❌ 不支持 | 🟡 可选 `PUBMED_API_KEY`, `NCBI_EMAIL`, `NCBI_TOOL` | NCBI E-utilities 生物医学元数据 |
| PubMed Central | ✅ 支持 | ✅ 支持 | ✅ 支持 | ❌ 不支持 | ❌ 不需要 | 生物医学开放全文和 PMC PDF |
| Europe PMC | ✅ 支持 | 🟡 条件支持 | 🟡 条件支持 | ❌ 不支持 | ❌ 不需要 | 生物医学元数据和开放全文链接 |

#### 预印本和会议稿

| 平台 | 元数据检索 | PDF 路径 | 正文/全文 | 被引统计 | 配置 | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| arXiv | ✅ 支持 | ✅ 支持 | ✅ 支持 | ❌ 不支持 | ❌ 不需要 | 物理、计算机、数学等预印本 |
| bioRxiv | ✅ 支持 | ✅ 支持 | ✅ 支持 | ❌ 不支持 | ❌ 不需要 | 生物学预印本 |
| medRxiv | ✅ 支持 | ✅ 支持 | ✅ 支持 | ❌ 不支持 | ❌ 不需要 | 医学预印本 |
| OpenReview | ✅ 支持 | ❌ 不支持 | ❌ 不支持 | ❌ 不支持 | ❌ 不需要 | 公开 OpenReview notes、评审和投稿记录 |
| IACR ePrint | ✅ 支持 | ✅ 支持 | ✅ 支持 | ❌ 不支持 | ❌ 不需要 | 密码学 ePrint 论文 |

#### 计算机和工程

| 平台 | 元数据检索 | PDF 路径 | 正文/全文 | 被引统计 | 配置 | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| DBLP | ✅ 支持 | ❌ 不支持 | ❌ 不支持 | ❌ 不支持 | ❌ 不需要 | 官方 DBLP 计算机文献目录 |
| ACM metadata | ✅ 支持 | ❌ 不支持 | ❌ 不支持 | ✅ 支持 | ❌ 不需要 | 通过 Crossref 的 ACM DOI 前缀元数据检索；不抓取 ACM 页面 |
| USENIX | ✅ 支持 | ❌ 不支持 | ❌ 不支持 | ❌ 不支持 | ❌ 不需要 | 基于 DBLP 的 USENIX 元数据；不抓取 USENIX 搜索页 |
| IEEE Xplore | ✅ 支持 | ❌ 不支持 | ❌ 不支持 | ✅ 支持 | ✅ 必需 `IEEE_API_KEY` | 官方 IEEE Xplore Metadata API |

#### 开放获取和仓储

| 平台 | 元数据检索 | PDF 路径 | 正文/全文 | 被引统计 | 配置 | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| CORE | ✅ 支持 | 🟡 条件支持 | 🟡 条件支持 | ❌ 不支持 | 🟡 可选 `CORE_API_KEY` | 仓储记录可能暴露 PDF 或全文链接 |
| OpenAIRE | ✅ 支持 | 🟡 条件支持 | ❌ 不支持 | ❌ 不支持 | 🟡 可选 `OPENAIRE_API_KEY` | 公开检索通常不需要 key |
| Unpaywall | 🟡 仅 DOI 查询 | 🟡 条件支持 | ❌ 不支持 | ❌ 不支持 | ✅ 必需 `UNPAYWALL_EMAIL` 或 `PAPER_SEARCH_UNPAYWALL_EMAIL` | DOI 开放获取 PDF 定位；需要邮箱，不是 API key |

#### 引文库和出版商

| 平台 | 元数据检索 | PDF 路径 | 正文/全文 | 被引统计 | 配置 | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| Web of Science | ✅ 支持 | ❌ 不支持 | ❌ 不支持 | ✅ 支持 | ✅ 必需 `WOS_API_KEY` | 引文数据库元数据、日期排序、年份范围 |
| ScienceDirect | ✅ 支持 | 🟡 条件支持 | ❌ 不支持 | ✅ 支持 | ✅ 必需 `ELSEVIER_API_KEY` | Elsevier 元数据；ScienceDirect 和 Scopus 产品权限需要分别开通 |
| Springer Nature / SpringerLink | ✅ 支持 | 🟡 条件支持 | ❌ 不支持 | ❌ 不支持 | ✅ 必需 `SPRINGER_API_KEY`；🟡 可选 `SPRINGER_OPENACCESS_API_KEY` | `springerlink` 是现有 Springer 集成的别名 |
| Wiley | ❌ 不支持关键词搜索 | ✅ DOI 下载 | ✅ 支持 | ❌ 不支持 | ✅ 必需 `WILEY_TDM_TOKEN` | TDM API；先通过其他元数据来源找到 DOI 再下载 |
| Scopus | ✅ 支持 | 🟡 条件元数据 | ❌ 不支持 | ✅ 支持 | ✅ 必需 `ELSEVIER_API_KEY` | 摘要和引文数据库；ScienceDirect 和 Scopus 产品权限需要分别开通 |

#### DOI 定向 fallback

| 平台 | 元数据检索 | PDF 路径 | 正文/全文 | 被引统计 | 配置 | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| Sci-Hub | ❌ 不支持 | ✅ 支持 | ❌ 不支持 | ❌ 不支持 | ❌ 不需要 | DOI/URL 定向查询；启用时作为 PDF 最后 fallback |

说明：

- 元数据检索指发现和初筛论文，不等于 PDF 下载或正文证据。
- `pdf_discovery` 会区分开放获取来源、已配置权限来源，以及单独标识的 Sci-Hub 最后 fallback。
- EasyScholar 是期刊指标来源，不是论文检索来源。
- Sci-Hub 不属于 `metadata_search`，只作为 DOI/URL 定向 PDF fallback。
- `🟡 条件支持` 表示只有记录暴露 DOI、开放获取链接、PDF URL，或用户配置了相应权限时才可用。
- API key 只在使用对应 key-backed 来源或工作流时才需要。

## 配置

多数免费元数据来源无需配置。为了稳定支持 agent 工作流，建议先运行 setup，把凭证写入用户级配置：

```bash
paper-search setup
paper-search config list --pretty
paper-search doctor --pretty
```

默认配置路径：

```text
~/.config/paper-search-cli/config.json
```

配置文件权限会写成 `0600`。`config list`、`doctor` 和相关命令都会脱敏密钥。

### API Key 分级

| 等级 | 配置项 | 用途 | 什么时候配置 |
| --- | --- | --- | --- |
| 多数用户推荐 | `SEMANTIC_SCHOLAR_API_KEY` | 正文片段检索，以及更稳定的 Semantic Scholar 请求 | 需要查方法细节或高频使用 Semantic Scholar 时配置 |
| 多数用户推荐 | `UNPAYWALL_EMAIL` 或 `PAPER_SEARCH_UNPAYWALL_EMAIL` | DOI 开放获取 PDF 解析 | setup 时配置；需要的是邮箱，不是 API key |
| 多数用户推荐 | `CROSSREF_MAILTO` | Crossref polite pool | 长任务或高频元数据检索时配置 |
| 多数用户推荐 | `CORE_API_KEY` | CORE 仓储检索 | 依赖 CORE 或遇到匿名限流时配置 |
| 期刊指标 | `EASYSCHOLAR_KEY` | EasyScholar 影响因子、JCR/SSCI、中科院分区、JCI、ESI、预警 | 需要期刊指标时配置；建议用 `paper-search setup EASYSCHOLAR_KEY` 隐藏输入 |
| 生物医学高频 | `PUBMED_API_KEY`, `NCBI_EMAIL`, `NCBI_TOOL` | NCBI E-utilities 稳定性和更高限额 | 高频使用 PubMed 时配置 |
| 机构或出版商权限 | `WOS_API_KEY`, `IEEE_API_KEY`, `ELSEVIER_API_KEY`, `SPRINGER_API_KEY`, `SPRINGER_OPENACCESS_API_KEY`, `WILEY_TDM_TOKEN` | Web of Science、IEEE、Scopus、ScienceDirect、Springer、Wiley 元数据或权限访问 | 只有具备对应 API 或机构权限时配置 |
| 通常可选 | `OPENAIRE_API_KEY` | OpenAIRE 账号或配额场景 | 公开检索通常不需要 |

常用申请入口：

| 服务 | 链接 |
| --- | --- |
| EasyScholar | [EasyScholar Open API](https://www.easyscholar.cc/console/user/open) |
| Semantic Scholar | [Semantic Scholar API](https://www.semanticscholar.org/product/api) |
| Unpaywall | [Unpaywall API](https://unpaywall.org/products/api) |
| CORE | [CORE API](https://core.ac.uk/services/api) |
| PubMed | [NCBI API Keys](https://ncbiinsights.ncbi.nlm.nih.gov/2017/11/02/new-api-keys-for-the-e-utilities/) |
| Web of Science | [Clarivate Developer Portal](https://developer.clarivate.com/apis) |
| IEEE Xplore | [IEEE Xplore Metadata API](https://developer.ieee.org/docs/read/Searching_the_IEEE_Xplore_Metadata_API) |
| Elsevier | [Elsevier Developer Portal](https://dev.elsevier.com/apikey/manage) |
| Springer Nature | [Springer Nature Developers](https://dev.springernature.com/) |
| Wiley TDM | [Wiley Text and Data Mining](https://onlinelibrary.wiley.com/library-info/resources/text-and-datamining) |
| OpenAIRE | [OpenAIRE APIs](https://develop.openaire.eu/) |

## Agent Skill

npm 包会随包发布 agent Skill，位置是 `skills/paper-search/SKILL.md`。终端用户可以只用 CLI；AI agent 工作流应安装或同步 Skill，让 agent 正确路由四个主要功能。

```bash
paper-search setup --install-skills agents
paper-search skills status --pretty
paper-search skills diff --targets agents --format text
paper-search skills update --targets agents --pretty
```

支持的 target 包括 `agents`、`codex`、`claude`、`cursor`、`gemini`、`antigravity` 和 `all`。Skill 更新会覆盖 package-managed Skill 文件，同时保留 installed Skill 目录里的 extra files。

Skill 只告诉 agent 如何调用 `paper-search` CLI。API key 仍然应通过 `paper-search setup`、`paper-search config`、`.env` 或 shell 环境变量配置。

## 命令

| 命令 | 用途 |
| --- | --- |
| `paper-search search` | 集成式元数据检索 |
| `paper-search journal-metrics` | EasyScholar 期刊指标检索 |
| `paper-search download` | 对已核验 paper ID 或 DOI 下载 PDF |
| `paper-search run` | 用 `--arg` 或 `--json-args` 精确调用工具 |
| `paper-search tools` | 运行时工具名和 schema |
| `paper-search doctor` | 脱敏配置、Capability Profile 和平台状态 |
| `paper-search smoke` | mock 或 live 自检 |
| `paper-search skills` | Bundled Skill 状态、diff 和同步 |
| `paper-search config` | 用户级配置管理 |

完整命令和工具 schema：运行 `paper-search tools --pretty`，或查看 [`skills/paper-search/references/cli-contract.md`](skills/paper-search/references/cli-contract.md)。

## 输出

命令默认返回 JSON。需要格式化 JSON 时使用 `--pretty`；需要可读报告时再使用 `--format text`。

```bash
paper-search search "machine learning" --platform crossref --max-results 1 --pretty
paper-search doctor --format text
```

## 排障

| 问题 | 首先检查 |
| --- | --- |
| 找不到命令 | 用 `npm install -g paper-search-cli` 重新全局安装 |
| 能力缺失 | 运行 `paper-search doctor --pretty`，再用 `paper-search setup` 配置缺失 key |
| 平台限流 | 降低 `--max-results`，配置对应 key，或切换来源 |
| Skill 似乎过期 | 运行 `paper-search skills status --pretty`，再运行 `paper-search skills update --targets agents --pretty` |
| 需要完整 CLI 细节 | 运行 `paper-search tools --pretty` |

## 使用边界

部分来源可能受平台条款、机构订阅或本地法律约束。只有在具备相应访问权和授权时才使用受限集成。

## 项目来源

本项目感谢 [LinuxDo](https://linux.do) 社区。CLI + Skill 路线和 paper-search 工作流改进来自社区交流与开源分享。

本项目也参考了 [openags/paper-search-mcp](https://github.com/openags/paper-search-mcp) 的思路，并将工作流调整为独立 CLI。

## License

MIT
