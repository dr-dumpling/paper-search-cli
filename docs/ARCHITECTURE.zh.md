# paper-search-cli 项目架构总结（v0.3.1）

> 本文描述 `paper-search-cli` 在 citation expansion 与 `DownloadTier` 接口重排完成后的**当前架构**。  
> 目标态总览见 [`ARCHITECTURE_REFACTOR.zh.md`](./ARCHITECTURE_REFACTOR.zh.md)。  
> 下一步修复任务书见 [`refactor/05-agent-repair-plan.md`](./refactor/05-agent-repair-plan.md)。

---

## 1. 项目定位

`paper-search-cli` 是一个面向 AI Agent、终端用户和脚本的学术文献工作 CLI。

- 语言 / 运行时：TypeScript + Node.js `>=18`，ESM 模块。
- 入口可执行文件：`paper-search`，由 `package.json` 的 `bin` 指向 `dist/cli.js`。
- 默认输出：JSON，便于 Agent 解析；需要可读报告时显式使用 `--format text` 或 `--pretty`。
- 随包发布：`skills/paper-search/`，作为 Routing Skill，告诉 Agent 何时调用 CLI、如何处理证据、配置和下载边界。

当前 CLI 已经围绕五个文献主能力工作：

| 能力 | 稳定能力名 | 主要入口 | 说明 |
|---|---|---|---|
| 文献元数据检索 | `metadata_search` | `paper-search search` / `paper-search run search_*` | 多平台论文元数据检索、DOI/PMID/PMCID/arXiv ID 核验、文献初筛 |
| 引文扩展 | `citation_expansion` | `paper-search run get_paper_citations` / `paper-search run get_paper_references` | 基于 Semantic Scholar Graph API 查询已知论文的施引文献和参考文献 |
| 期刊指标 | `journal_metrics` | `paper-search journal-metrics` / `paper-search run query_journal_metrics` | EasyScholar 期刊影响因子、JCR/SSCI、中科院分区、JCI、ESI、预警和等级字段 |
| PDF 发现 / 下载 | `pdf_discovery` | `paper-search download` / `paper-search run download_with_fallback` | 源生下载、元数据 PDF URL、仓储、Unpaywall、Sci-Hub fallback |
| 正文片段检索 | `body_snippet_search` | `paper-search run search_semantic_snippets` | Semantic Scholar Open Access snippet 索引，用于查 Methods、参数、软件、模型和写法线索 |

`doctor`、`smoke`、`config`、`skills`、`tools` 属于 Friendly Management Layer，不是文献任务本身。

---

## 2. 当前重构完成状态

本轮小重构的核心目标已经落地：

| 任务 | 当前状态 | 架构影响 |
|---|---|---|
| `01-citation-tools.md` | 已完成 | `CitationService` 已暴露为两个 agent-facing 工具：`get_paper_citations` 与 `get_paper_references` |
| `02-download-tier-interface.md` | 已完成 | `download_with_fallback` 已改为 `DownloadTier` 顺序执行：`primary -> direct_pdf_url -> repositories -> unpaywall -> scihub` |
| `03-skill-cli-contract-update.md` | 已完成 | README、Skill、`cli-contract.md` 已同步 citation expansion 工具与能力地图 |
| `04-citation-tests-and-acceptance.md` | 已完成 | 已补 schema、handler、Skill contract、OpenAccessFallbackService 的相关测试 |

`docs/refactor/README.md` 已将 `01` 到 `04` 标为“已完成”，当前执行入口收敛到 `05-agent-repair-plan.md`，避免 Agent 重复执行已完成任务。

---

## 3. 顶层目录职责

```text
paper-search-cli/
├── src/
│   ├── cli.ts                  # CLI 入口：参数解析、命令分发、输出包装
│   ├── core/                   # 工具定义、schema、工具路由、能力画像、诊断、smoke
│   ├── platforms/              # 各数据源 Searcher，继承 PaperSource
│   ├── services/               # 跨平台能力服务：多源检索、PDF fallback、引用、期刊指标
│   ├── config/                 # 配置和密钥管理、结果上限
│   ├── utils/                  # HTTP/proxy、限流、缓存、错误、安全、PDF 下载与解析
│   ├── skills/                 # Bundled Skill 安装 / diff / update 逻辑
│   └── models/Paper.ts         # 统一论文数据模型
├── skills/paper-search/        # 随包发布的 Routing Skill 与 references
├── docs/                       # 架构、ADR、重构任务书
├── tests/                      # Jest 测试，目录结构大体镜像 src/
├── dist/                       # tsc 编译产物，发布用
└── package.json / tsconfig.json / .env.example
```

物理目录还没有完全切成 `capabilities/`、`registry/`、`infrastructure/`。当前架构仍然是“6 层代码骨架 + 三轴目标模型”的过渡形态。

---

## 4. 当前架构心智模型

当前代码仍可按 6 层理解，但后续演进应按三条轴收敛。

### 4.1 当前 6 层代码骨架

```text
① CLI 入口层        src/cli.ts
       │
       ▼
② 核心编排层        src/core/  (tools, schemas, handleToolCall, diagnostics, capabilityProfile)
       │
       ▼
③ 能力服务层        src/services/  (MultiSource, Citation, OpenAccessFallback, JournalMetrics)
       │
       ▼
④ 平台适配层        src/platforms/  (PaperSource + 各平台 Searcher)
       │
       ▼
⑤ 基础设施层        src/utils/  (HttpClient, RateLimiter, RequestCache, ErrorHandler, SecurityUtils, PdfDownload)
       │
       ▼
⑥ 配置与模型        src/config/ + src/models/Paper.ts
```

这套分层仍然有效，但不能再只按“自上而下 6 层”做架构判断。下一阶段应以三条正交轴为主。

### 4.2 三条正交轴

```text
       ③ 基础设施轴
       HttpClient · 限流 · 缓存 · 重试 · 超时 · 错误 · UA · 代理
              ▲
              │
① 能力域轴 ───┼────────────────────→ ② 数据源轴
metadata       │                       platformMetadata / factories / aliases
citation       │                       Crossref / PubMed / arXiv / OpenAlex / ...
journal        │
pdf            │
body snippets  │
management     │
```

判断规则：

- 是“用户可感知的功能”就归入能力域轴。
- 是“论文数据、PDF 候选或平台来源”就归入数据源轴。
- 是“所有常规 HTTP 请求都要共享的横切能力”就归入基础设施轴。

---

## 5. 能力域边界

| 能力域 | 当前实现位置 | 依赖 | 边界规则 |
|---|---|---|---|
| metadata search | `services/MultiSourceSearchService.ts` + `platforms/*` | `Searchers`、`PaperSource`、`platformMetadata` | 负责构建和核验论文元数据列表，不直接承担 PDF 下载策略 |
| citation expansion | `services/CitationService.ts` + `core/handleToolCall.ts` | Semantic Scholar Graph API | 不进入 `platformMetadata`，不是关键词检索，不属于普通 metadata source |
| pdf discovery | `services/OpenAccessFallbackService.ts` | `Searchers`、`DownloadTier`、`PdfDownload` | 只消费已知 `source / paperId / doi / title`，按 attempts 记录 fallback 过程 |
| journal metrics | `services/JournalMetricsService.ts` | EasyScholar | 独立于论文平台检索，不进入论文数据源注册表 |
| body snippet search | `SemanticScholarSearcher.searchSnippets()` + 私有 schema | Semantic Scholar OA snippet index | 使用 `limit`，不是 `maxResults`；返回 snippet 线索，不代表完整全文解析 |
| management layer | `core/diagnostics.ts`、`core/capabilityProfile.ts`、`core/liveSmoke.ts`、`src/skills/*`、`config/*` | 读取其它模块状态 | 只能读状态、给诊断和同步 Skill；功能模块不反向依赖管理层 |

关键约束：

1. `metadata_search` 与 `pdf_discovery` 通过 `Paper`、DOI、title、source 解耦。
2. `citation_expansion` 是独立能力，不塞进 `metadata_search` 平台列表。
3. `journal_metrics` 只处理期刊，不处理论文元数据。
4. `body_snippet_search` 保持 Semantic Scholar 私有 schema，不被普通平台 schema 泛化。
5. management layer 是友好管理支线，不参与文献任务主流程。

---

## 6. 主要数据流

### 6.1 CLI 启动

```text
cli.ts
  → dotenv.config()
  → loadUserConfigIntoEnv()
  → setupGlobalProxy()
  → parseCli(argv)
  → run(parsed)
```

密钥只来自环境变量、`.env` 或用户配置文件。Skill、README、测试和日志不得写入真实密钥。

### 6.2 `paper-search run <tool>`

```text
cli.ts
  → parseJsonArgs / parseArgFlags / flagsToArgs
  → assertToolName(tool)
  → initializeSearchers()
  → handleToolCall(tool, args, searchers)
      → parseToolArgs(tool, args)
      → route to capability or platform searcher
  → extract text / JSON payload
  → diagnoseToolResult()
  → JSON output
```

`TOOLS`、`parseToolArgs()`、`handleToolCall()` 是当前最重要的 CLI 契约三角。下一阶段任何注册表派生都必须保持三者输出不变。

### 6.3 metadata search

```text
paper-search search "query"
  → search_papers
  → SearchPapersSchema
  → searchMultipleSources(searchers, query, sources, options)
      → parse source list / alias normalize
      → per-source search with timeout isolation
      → Promise.allSettled
      → dedupe by DOI, title+author, source id
  → { sources_used, source_results, errors, failed_sources, total, papers }
```

特点：多源并发、单源失败不阻塞整体、结果去重、默认 JSON 输出。

### 6.4 citation expansion

```text
paper-search run get_paper_citations / get_paper_references
  → CitationLookupSchema
  → resolveCitationTarget(paperId > doi > arxivId)
  → CitationService.getCitations() / getReferences()
  → Semantic Scholar Graph API
  → { target, relation, provider, total, papers }
```

`doi` 会转换成 `DOI:<doi>`；`arxivId` 会转换成 `ARXIV:<id>`；`limit` 默认为 100，范围 1–100。

### 6.5 PDF fallback

```text
download_with_fallback
  → build DownloadTierContext
  → run DEFAULT_DOWNLOAD_TIERS in order
      1. primary
      2. direct_pdf_url
      3. repositories
      4. unpaywall
      5. scihub
  → first ok path returns success
  → otherwise returns error with attempts
```

当前 `DownloadTier` 接口已经存在，但 tier 列表仍是文件内固定数组。下一步应把 tier factory、插入函数和可注入 tiers 明确化，方便未来 `institutional_access` 在 Unpaywall 之后、Sci-Hub 之前插入。

### 6.6 management layer

```text
doctor/status/smoke/skills/config/tools
  → 读取配置、能力画像、平台状态、Skill 安装状态
  → 输出脱敏 JSON 或显式 text report
```

这条支线的目标是让工具“可被正确使用”，而不是替代文献检索实现。

---

## 7. 核心抽象现状

### 7.1 `PaperSource`

所有平台 Searcher 继承 `PaperSource`，统一暴露：

- `search(query, options)`
- `downloadPdf(paperId, options)`
- `readPaper(paperId, options)`
- `getCapabilities()`
- `getPaperByDoi(doi)` 等公共能力

新增普通平台的算法适配主要应写在新的 `platforms/XxxSearcher.ts`。

### 7.2 `platformMetadata`

`core/platformMetadata.ts` 是数据源注册表雏形，已记录：

- `id`
- `aliases`
- `displayName`
- `sourceKind`
- `defaultInAll`
- `directTool`
- `toolName`
- `configKeys`
- `optionalConfigKeys`
- `supportedOptions`
- `description`

但它还不是完整单一事实源。工具 schema、Searcher 实例化、能力画像分组、DOI lookup source、repository source、HTTP policy 仍有多处手写清单。

### 7.3 `Searchers`

`initializeSearchers()` 仍然逐个 import、逐个 `new`，并手写 alias 字段。下一阶段应拆出 `PlatformFactoryRegistry`，让 canonical source 和 alias 从 metadata 派生。

### 7.4 `HttpClient`

`utils/HttpClient.ts` 当前主要负责全局 proxy 设置，并没有成为统一请求包装层。多数平台仍直接使用 axios。下一阶段应把常规 HTTP 请求收敛到统一 `HttpClient`，并通过 `HttpPolicyRegistry` 声明平台策略。

### 7.5 `DownloadTier`

`DownloadTier` 已经存在，当前默认顺序已经稳定。但它仍需要从“文件内重排”升级为“可注入 / 可插入”的轻量扩展点。

---

## 8. 当前技术债清单

| 债务 | 当前表现 | 下一步处理 |
|---|---|---|
| 平台事实源仍未完全收敛 | `tools.ts`、`schemas.ts`、`handleToolCall.ts`、`searchers.ts`、`capabilityProfile.ts` 仍有手写平台清单 | 先加契约快照，再做平台工具 / schema / factory 派生 |
| `HttpClient` 名不副实 | 只做 proxy，平台直接用 axios | 建 `HttpPolicyRegistry`，逐平台迁移常规请求 |
| `DownloadTier` 插拔性不足 | 默认 tiers 是文件内常量，未来插入仍需改核心文件 | 导出 tier factory、插入函数、可注入 tiers 参数 |
| 文档状态收敛 | `docs/refactor/README.md` 已将 01–04 标为“已完成”，当前执行入口为 05 | 后续只维护 05 与未来专项文档，不重复执行历史任务 |
| README badge 同步 | package 与 README / README.zh badge 均应保持 0.3.1 | 发布前把版本徽章纳入固定检查 |

---

## 9. 稳定契约

后续重构必须保持以下契约不变：

- `paper-search tools --pretty` 工具名集合。
- 每个工具的 `inputSchema`、`required`、enum、默认参数语义。
- `paper-search run` 的 unknown tool 错误行为。
- `search_papers`、`get_paper_by_doi`、`download_with_fallback`、`query_journal_metrics` 的 JSON 输出结构。
- `download_with_fallback` attempts 顺序和字段结构。
- alias 解析：如 `wos -> webofscience`、`scholar -> googlescholar`、`springerlink -> springer`。
- Capability Profile 的能力名和状态判定边界。
- Skill / README 不声称 WebVPN、CARSI、EZProxy、institutional login 已实现。

推荐把这些契约固化为测试，再做结构性重构。

---

## 10. 下一阶段架构调整方向

下一阶段不应继续扩展 citation expansion，而应进入结构性修复：

1. 文档收敛：标记 01–04 已完成；同步 README badge；让当前架构、目标架构、执行任务书一致。
2. `DownloadTier` 小修：让 tier 列表可注入，修正 direct metadata DOI lookup，增强 Unpaywall 缺失保护。
3. 契约测试：冻结 tools schema、alias、capability profile、fallback attempts。
4. 数据源注册表派生：从 generic 平台工具开始，逐步减少手写平台清单。
5. Searcher factory registry：把 `initializeSearchers()` 从手写对象改成 metadata + factory 派生。
6. 统一 HttpClient：先建接口和 policy registry，再逐平台迁移。

完整执行指引见 [`refactor/05-agent-repair-plan.md`](./refactor/05-agent-repair-plan.md)。
