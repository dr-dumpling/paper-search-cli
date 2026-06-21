# paper-search-cli 当前架构（v0.3.1）

本文是 `paper-search-cli` 当前架构事实源，描述当前代码已经实现的能力、边界和仍存在的技术债。后续演进方向见 [`ROADMAP.zh.md`](./ROADMAP.zh.md)。

---

## 1. 项目定位

`paper-search-cli` 是一个面向 AI Agent、终端用户和脚本的学术文献工作 CLI。

- 语言 / 运行时：TypeScript + Node.js `>=18`，ESM 模块。
- 入口可执行文件：`paper-search`，由 `package.json` 的 `bin` 指向 `dist/cli.js`。
- 默认输出：JSON，便于 Agent 解析；需要可读报告时显式使用 `--format text` 或 `--pretty`。
- 随包发布：`skills/paper-search/`，作为 Routing Skill，告诉 Agent 何时调用 CLI、如何处理证据、配置和下载边界。

当前 CLI 围绕五个文献主能力工作：

| 能力 | 稳定能力名 | 主要入口 | 说明 |
|---|---|---|---|
| 文献元数据检索 | `metadata_search` | `paper-search search` / `paper-search run search_*` | 多平台论文元数据检索、DOI/PMID/PMCID/arXiv ID 核验、文献初筛 |
| 引文扩展 | `citation_expansion` | `paper-search run get_paper_citations` / `paper-search run get_paper_references` | 基于 Semantic Scholar Graph API 查询已知论文的施引文献和参考文献 |
| 期刊指标 | `journal_metrics` | `paper-search journal-metrics` / `paper-search run query_journal_metrics` | EasyScholar 期刊影响因子、JCR/SSCI、中科院分区、JCI、ESI、预警和等级字段 |
| PDF 发现 / 下载 | `pdf_discovery` | `paper-search download` / `paper-search run download_with_fallback` | 源生下载、元数据 PDF URL、仓储、Unpaywall、Sci-Hub fallback |
| 正文片段检索 | `body_snippet_search` | `paper-search run search_semantic_snippets` | Semantic Scholar Open Access snippet 索引，用于查 Methods、参数、软件、模型和写法线索 |

`doctor`、`smoke`、`config`、`skills`、`tools` 属于 Friendly Management Layer，不是文献任务本身。

---

## 2. 当前顶层目录职责

```text
paper-search-cli/
├── src/
│   ├── cli.ts                  # CLI 入口：参数解析、命令分发、输出包装
│   ├── core/                   # 工具定义、schema、工具路由、能力画像、诊断、smoke、平台 registry 辅助
│   ├── platforms/              # 各数据源 Searcher，继承 PaperSource
│   ├── services/               # 跨平台能力服务：多源检索、PDF fallback、引用、期刊指标
│   ├── config/                 # 配置和密钥管理、结果上限
│   ├── utils/                  # HTTP/proxy、限流、缓存、错误、安全、PDF 下载与解析
│   ├── skills/                 # Bundled Skill 安装 / diff / update 逻辑
│   └── models/Paper.ts         # 统一论文数据模型
├── skills/paper-search/        # 随包发布的 Routing Skill 与 references
├── docs/                       # 当前架构、ADR、roadmap
├── tests/                      # Jest 测试，目录结构大体镜像 src/
├── dist/                       # tsc 编译产物，发布用
└── package.json / tsconfig.json / .env.example
```

当前物理目录还没有完全拆成 `capabilities/`、`registry/`、`infrastructure/`。代码仍保留 `core/`、`services/`、`platforms/`、`utils/` 的分层，但内部已经开始向三轴模型收敛。

---

## 3. 当前架构心智模型

### 3.1 六层代码骨架

```text
① CLI 入口层        src/cli.ts
       │
       ▼
② 核心编排层        src/core/  (tools, schemas, handleToolCall, diagnostics, capabilityProfile, registry helpers)
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

### 3.2 三条正交轴

```text
       ③ 基础设施轴
       HttpClient · 限流 · 缓存 · 重试 · 超时 · 错误 · UA · 代理
              ▲
              │
① 能力域轴 ───┼────────────────────→ ② 数据源轴
metadata       │                       platformMetadata / platformFactories / aliases
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

## 4. 能力域边界

| 能力域 | 当前实现位置 | 依赖 | 边界规则 |
|---|---|---|---|
| metadata search | `services/MultiSourceSearchService.ts` + `platforms/*` | `Searchers`、`PaperSource`、`platformMetadata` | 负责构建和核验论文元数据列表，不直接承担 PDF 下载策略 |
| citation expansion | `services/CitationService.ts` + `core/handleToolCall.ts` | Semantic Scholar Graph API | 不进入普通平台搜索工具生成，不等同于关键词检索 |
| pdf discovery | `services/OpenAccessFallbackService.ts` | `Searchers`、`DownloadTier`、`PdfDownload` | 消费已知 `source / paperId / doi / title`，按 attempts 记录 fallback 过程 |
| journal metrics | `services/JournalMetricsService.ts` | EasyScholar | 独立于论文平台检索，不进入论文数据源注册表 |
| body snippet search | `SemanticScholarSearcher.searchSnippets()` + 私有 schema | Semantic Scholar OA snippet index | 使用 `limit`，不是 `maxResults`；返回 snippet 线索，不代表完整全文解析 |
| management layer | `core/diagnostics.ts`、`core/capabilityProfile.ts`、`core/liveSmoke.ts`、`src/skills/*`、`config/*` | 读取其它模块状态 | 只能读状态、给诊断和同步 Skill；功能模块不反向依赖管理层 |

关键约束：

1. `metadata_search` 与 `pdf_discovery` 通过 `Paper`、DOI、title、source 解耦。
2. `citation_expansion` 是独立能力，不塞进普通 metadata platform search。
3. `journal_metrics` 只处理期刊，不处理论文元数据。
4. `body_snippet_search` 保持 Semantic Scholar 私有 schema，不被普通平台 schema 泛化。
5. management layer 是友好管理支线，不参与文献任务主流程。

---

## 5. 主要数据流

### 5.1 CLI 启动

```text
cli.ts
  → dotenv.config()
  → loadUserConfigIntoEnv()
  → setupGlobalProxy()
  → parseCli(argv)
  → run(parsed)
```

密钥只来自环境变量、`.env` 或用户配置文件。Skill、README、测试和日志不得写入真实密钥。

### 5.2 `paper-search run <tool>`

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

`TOOLS`、`parseToolArgs()`、`handleToolCall()` 是当前最重要的 CLI 契约三角。后续任何注册表派生都必须保持三者对外输出不变。

### 5.3 metadata search

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

### 5.4 citation expansion

```text
paper-search run get_paper_citations / get_paper_references
  → CitationLookupSchema
  → resolveCitationTarget(paperId > doi > arxivId)
  → CitationService.getCitations() / getReferences()
  → Semantic Scholar Graph API
  → { target, relation, provider, total, papers }
```

`doi` 会转换成 `DOI:<doi>`；`arxivId` 会转换成 `ARXIV:<id>`；`limit` 默认为 100，范围 1–100。

### 5.5 PDF fallback

当前 `download_with_fallback` 已经通过 `DownloadTier` 执行默认下载层：

```text
download_with_fallback
  → build DownloadTierContext
  → createDefaultDownloadTiers()
      1. primary
      2. direct_pdf_url
      3. repositories
      4. unpaywall
      5. scihub
  → first ok path returns success
  → otherwise returns error with attempts
```

当前已支持：

- `createDefaultDownloadTiers()` 生成默认下载层。
- `insertDownloadTierBefore()` 在指定 stage 前插入未来 tier。
- `downloadWithFallback(searchers, options, tiers)` 注入自定义 tiers。
- direct metadata fallback 优先使用 `doi || paperId`。
- Unpaywall searcher 缺失时返回 `skipped`。
- 默认 attempts 不包含 `institutional_access`。

### 5.6 management layer

```text
doctor/status/smoke/skills/config/tools
  → 读取配置、能力画像、平台状态、Skill 安装状态
  → 输出脱敏 JSON 或显式 text report
```

这条支线的目标是让工具“可被正确使用”，而不是替代文献检索实现。

---

## 6. 核心抽象现状

### 6.1 `PaperSource`

所有平台 Searcher 继承 `PaperSource`，统一暴露：

- `search(query, options)`
- `downloadPdf(paperId, options)`
- `readPaper(paperId, options)`
- `getCapabilities()`
- `getPaperByDoi(doi)` 等公共能力

新增普通平台的算法适配主要写在新的 `platforms/XxxSearcher.ts`。

### 6.2 `platformMetadata`

`core/platformMetadata.ts` 是当前数据源注册表事实源，记录：

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
- `schemaKind`
- `optionCaps`
- `capabilityGroups`
- `supportsDoiLookup`
- `isRepository`
- `description`

当前已实现的派生辅助：

- `resolvePlatformId()`
- `getDefaultAllSources()`
- `getAliasMap()`
- `getPlatformToolDescriptors()`
- `getGenericPlatformToolDescriptors()`
- `getGenericSearchToolPlatform()`
- `getGenericSearchToolNames()`

当前仍有部分清单尚未完全从 metadata 派生，例如 capability profile source group、DOI lookup source、repository fallback source 等。

### 6.3 `PlatformFactoryRegistry`

`core/platformFactories.ts` 集中维护平台实例化：

```text
PLATFORM_FACTORIES: Record<string, PlatformFactory>
```

`initializeSearchers()` 当前基于 `PLATFORM_METADATA` 遍历平台，使用 factory 创建 canonical instance，并自动为 `aliases` 写入同一实例。

当前仍保留 `Searchers` 手写接口作为过渡类型，避免一次性改动所有调用方。

### 6.4 `HttpClient` 与 `HttpPolicy`

`utils/HttpClient.ts` 当前已经定义最小 scaffold：

- `HttpPolicy`
- `HttpRequestConfig`
- `HttpClient.request<T>()`
- `setupGlobalProxy()`

`core/httpPolicies.ts` 当前已有少量平台策略示例，例如 Crossref、OpenAlex、arXiv。

需要注意：当前 `HttpClient` 还不是完整统一请求层。它已经处理 timeout、validateStatus、userAgent 的最小包装，但尚未完整执行 rate limit、cache、retry、统一错误分类和平台迁移。

### 6.5 `DownloadTier`

`DownloadTier` 是当前 PDF fallback 的下载层接口：

```ts
export interface DownloadTier {
  id: string;
  stage: string;
  run(context: DownloadTierContext): Promise<DownloadTierResult>;
}
```

默认下载层顺序已经稳定，未来如果实现机构访问，应通过 `insertDownloadTierBefore(createDefaultDownloadTiers(), 'scihub', institutionalAccessTier)` 显式插入，并保持默认不启用。

---

## 7. 稳定契约

后续重构必须保持以下契约不变：

- `paper-search tools --pretty` 工具名集合。
- 每个工具的 `inputSchema`、`required`、enum、默认参数语义。
- `paper-search run` 的 unknown tool 错误行为。
- `search_papers`、`get_paper_by_doi`、`download_with_fallback`、`query_journal_metrics` 的 JSON 输出结构。
- `download_with_fallback` attempts 顺序和字段结构。
- alias 解析：如 `wos -> webofscience`、`scholar -> googlescholar`、`springerlink -> springer`。
- Capability Profile 的能力名和状态判定边界。
- Skill / README 不声称 WebVPN、CARSI、EZProxy、institutional login 已实现。

当前已有契约测试覆盖：

- tools schema surface；
- platform alias；
- capability profile；
- fallback attempts；
- Skill Direct Run Tools 与 `TOOLS` 同步。

---

## 8. 当前技术债

| 债务 | 当前表现 | 后续方向 |
|---|---|---|
| 数据源事实源未完全收敛 | `platformMetadata` 已扩展，但 capability profile、DOI lookup、repository fallback 仍有部分手写清单 | 继续从 `capabilityGroups`、`supportsDoiLookup`、`isRepository` 派生 |
| HttpClient 仍是最小 scaffold | 已有 `HttpPolicy` / `HttpClient.request()`，但尚未实现完整 rate limit/cache/retry/error 分类，也未迁移所有平台 | 先迁移少量免费稳定平台，再逐步扩展 |
| Searchers 类型仍手写 | 实例化已由 factory registry 驱动，但 `Searchers` 接口仍显式列出字段 | 后续可用更宽的 registry 类型过渡，减少手写字段 |
| DownloadTier 未来机构访问未实现 | 当前只支持插入扩展点，默认无 `institutional_access` | 未来按 roadmap 通过显式启用 tier 接入 |
| 文档需要持续约束未来能力 | README / Skill 当前不应宣称机构访问已实现 | 未来能力只写入 roadmap，不进入当前能力表 |

---

## 9. 后续路线

后续工作不再放在 `docs/refactor/` 任务书中。当前路线见：

- [`ROADMAP.zh.md`](./ROADMAP.zh.md)
- [`roadmap/FUTURE_INSTITUTIONAL_ACCESS.zh.md`](./roadmap/FUTURE_INSTITUTIONAL_ACCESS.zh.md)
