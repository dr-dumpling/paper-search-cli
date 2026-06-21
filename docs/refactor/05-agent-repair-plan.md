# 05 - Agent Repair Plan After Citation Expansion

状态：可执行。该文档用于指导 Agent 在 citation expansion 与 `DownloadTier` 小重构完成后，继续修复文档状态、契约测试和下一阶段架构债。

> 本任务不是新增文献功能。它的目标是把已完成的小重构收口，并为后续平台注册表 / HttpClient 重构建立安全边界。

---

## 目标

完成四类修复：

1. **文档状态收敛**：让当前架构文档、refactor 索引、README 版本和 Skill 契约一致。
2. **契约冻结**：先用测试固定 CLI 工具、schema、alias、capability profile、PDF fallback attempts，避免后续结构性重构破坏对外契约。
3. **DownloadTier 小修**：把当前文件内固定 fallback 重排升级成轻量可插拔扩展点，为未来 `institutional_access` 做接口准备，但不实现机构访问。
4. **下一阶段架构准备**：启动平台注册表派生、Searcher factory registry、统一 HttpClient 的最小安全改造路径。

---

## 总边界

Agent 执行本任务时必须遵守以下边界：

- 不新增 WebVPN、CARSI、EZProxy、机构登录、浏览器 profile、cookie 读取或账号密码处理。
- 不改变现有 CLI 工具名、命令名、JSON 输出结构和默认参数语义。
- 不把 `citation_expansion` 塞进 `metadata_search` 平台列表。
- 不把 `journal_metrics`、`body_snippet_search`、`download_with_fallback` 当作普通平台搜索工具生成。
- 不一次性迁移所有平台 HTTP 请求；先建立接口和策略表，再逐平台迁移。
- 不删除 Sci-Hub fallback；只允许保留现有 `useSciHub:false` 抑制行为。
- 不把任何 API key、token、cookie、账号、密码写入文档、Skill、测试或日志。

---

## 当前基线

执行前先确认当前基线：

```bash
npm test -- --runInBand
npm run build
paper-search tools --pretty
paper-search doctor --pretty
```

若本地没有全局安装 `paper-search`，使用：

```bash
npm run build
node dist/cli.js tools --pretty
node dist/cli.js doctor --pretty
```

如果测试或 build 已经失败，先记录失败项，不要直接开始架构迁移。

---

## Phase 0 - 文档状态收敛

### 0.1 更新 refactor 索引

修改 `docs/refactor/README.md`：

- 把 `01-citation-tools.md` 标为 `已完成`。
- 把 `02-download-tier-interface.md` 标为 `已完成`。
- 把 `03-skill-cli-contract-update.md` 标为 `已完成`。
- 把 `04-citation-tests-and-acceptance.md` 标为 `已完成`。
- 新增本文件 `05-agent-repair-plan.md`，状态为 `可执行`。
- 保留 `future-webvpn-carsi-ezproxy.md` 为 `未来执行`。

建议表格：

```markdown
| 文档 | 状态 | 执行结论 |
| --- | --- | --- |
| [01-citation-tools.md](./01-citation-tools.md) | 已完成 | `get_paper_citations` / `get_paper_references` 已接入 TOOLS、schema、handler 和 CitationService。 |
| [02-download-tier-interface.md](./02-download-tier-interface.md) | 已完成 | `download_with_fallback` 已改为 `DownloadTier` 顺序执行，默认 attempts 不包含 `institutional_access`。 |
| [03-skill-cli-contract-update.md](./03-skill-cli-contract-update.md) | 已完成 | Skill、README、`cli-contract.md` 已同步 citation expansion 契约。 |
| [04-citation-tests-and-acceptance.md](./04-citation-tests-and-acceptance.md) | 已完成 | 已补 citation schema / handler / Skill contract / fallback attempts 测试。 |
| [05-agent-repair-plan.md](./05-agent-repair-plan.md) | 可执行 | 收敛文档状态、冻结契约、修补 DownloadTier 插拔点，并启动下一阶段架构准备。 |
| [future-webvpn-carsi-ezproxy.md](./future-webvpn-carsi-ezproxy.md) | 未来执行 | 只能在 `DownloadTier` 稳定后，通过 `institutional_access` tier 显式启用。 |
```

### 0.2 同步 README 版本徽章

检查：

- `package.json` 的 `version`
- `README.md` 的 version badge
- `README.zh.md` 的 version badge

若 `package.json` 是 `0.3.1`，README badge 不得继续显示 `0.3.0`。

### 0.3 检查未来能力表述

全仓搜索：

```bash
rg "WebVPN|CARSI|EZProxy|institutional login|browser profile|cookie|scansci|Camoufox|camofox" README.md README.zh.md skills docs
```

允许出现的位置：

- `docs/refactor/future-webvpn-carsi-ezproxy.md`
- `docs/ARCHITECTURE_REFACTOR.zh.md` 中明确标为未来能力的段落
- 本文中作为非目标或未来边界出现

不允许 README、Skill 或 CLI contract 把这些能力写成当前已实现功能。

---

## Phase 1 - 契约冻结测试

先补测试，再改结构。

### 1.1 工具清单和 schema 快照

新增或扩展测试：

```text
tests/core/toolsContract.test.ts
```

覆盖：

- `TOOLS.map(tool => tool.name)` 的稳定集合。
- 每个工具的 `inputSchema` 结构。
- `get_paper_citations` 与 `get_paper_references` 的 schema 包含 `paperId`、`doi`、`arxivId`、`limit`。
- `download_with_fallback` 的 schema 不包含 `institutional_access`、`useInstitutionalAccess` 或未来 provider 参数。

不要把测试写成只检查数量；必须检查关键名称和关键字段。

### 1.2 alias 契约测试

新增或扩展测试：

```text
tests/core/platformMetadata.test.ts
```

覆盖：

```ts
resolvePlatformId('wos') === 'webofscience'
resolvePlatformId('scholar') === 'googlescholar'
resolvePlatformId('google_scholar') === 'googlescholar'
resolvePlatformId('springerlink') === 'springer'
resolvePlatformId('pubmed_central') === 'pmc'
resolvePlatformId('europe_pmc') === 'europepmc'
```

同时覆盖：

- `getDefaultAllSources()` 不包含 alias。
- `getGenericSearchToolNames()` 只包含当前确认为 generic route 的工具名。

### 1.3 Capability Profile 契约测试

新增或扩展测试：

```text
tests/core/capabilityProfile.test.ts
```

覆盖能力名集合：

```text
metadata_search
citation_expansion
body_snippet_search
journal_metrics
pdf_discovery
entitled_access
```

必须确认：

- `citation_expansion` 独立存在。
- `metadata_search` 不把 `scihub` 当作 configured metadata source。
- `pdf_discovery` 把 Sci-Hub 放在 `scihub_sources`，而不是 `open_access_sources` 或 `entitled_access_sources`。
- `entitled_access` 缺少 key 时不影响 `metadata_search` 可用性。

### 1.4 PDF fallback attempts 契约测试

扩展：

```text
tests/services/OpenAccessFallbackService.test.ts
```

覆盖：

```text
primary -> direct_pdf_url -> repositories -> unpaywall -> scihub
```

并确认：

- `useSciHub:false` 时 `scihub` 仍出现在 attempts 中，状态为 `skipped`。
- 默认 attempts 不出现 `institutional_access`。
- 所有 attempts 只包含 `{ stage, status, message }`，不泄露 URL、cookie、token 或 session。

---

## Phase 2 - DownloadTier 小修

修改：

```text
src/services/OpenAccessFallbackService.ts
```

### 2.1 导出 tier factory

把文件内固定数组改为函数：

```ts
export function createDefaultDownloadTiers(): DownloadTier[] {
  return [
    createPrimaryTier(),
    createDirectPdfUrlTier(),
    createRepositoryTier(),
    createUnpaywallTier(),
    createSciHubTier()
  ];
}
```

`downloadWithFallback()` 接受可选 tiers：

```ts
export async function downloadWithFallback(
  searchers: Searchers,
  options: DownloadWithFallbackOptions,
  tiers: DownloadTier[] = createDefaultDownloadTiers()
): Promise<DownloadWithFallbackResult> {
  // same public output
}
```

这样测试可以注入自定义 tier，未来 `institutional_access` 也不必改主循环。

### 2.2 提供插入工具函数

新增：

```ts
export function insertDownloadTierBefore(
  tiers: DownloadTier[],
  beforeStage: string,
  tier: DownloadTier
): DownloadTier[] {
  const index = tiers.findIndex(item => item.stage === beforeStage);
  if (index < 0) return [...tiers, tier];
  return [...tiers.slice(0, index), tier, ...tiers.slice(index)];
}
```

未来机构访问的插入方式必须是：

```ts
insertDownloadTierBefore(
  createDefaultDownloadTiers(),
  'scihub',
  institutionalAccessTier
)
```

### 2.3 修正 direct metadata DOI lookup

当前 direct metadata stage 不应只使用 `paperId`。应优先使用 DOI：

```ts
const lookupId = context.doi || context.paperId;
const paper = await searcher.getPaperByDoi(lookupId);
```

原因：`paperId` 可能是源内 ID，而 direct metadata fallback 通常需要 DOI。

### 2.4 增加 Unpaywall 缺失保护

在 Unpaywall tier 开头增加：

```ts
const unpaywall = context.searchers.unpaywall as UnpaywallSearcher | undefined;
if (!unpaywall?.resolveBestPdfUrl) {
  return { status: 'skipped', message: 'Unpaywall searcher unavailable.' };
}
```

不要让测试环境或未来轻量构建因为缺少 `unpaywall` 而抛运行时异常。

### 2.5 验收

```bash
npm test -- --runInBand tests/services/OpenAccessFallbackService.test.ts
npm test -- --runInBand
npm run build
```

---

## Phase 3 - 平台注册表派生准备

本阶段目标不是一次性生成所有工具，而是先把“哪些平台可以 generic 生成、哪些必须保留手写 schema”标清楚。

### 3.1 扩展 PlatformMetadata 类型

修改：

```text
src/core/platformMetadata.ts
```

建议增加。以下代码块是接口草案，执行时必须补齐新增类型定义，不能直接留下未定义的 `CapabilityGroup` 一类占位符：

```ts
export type PlatformSchemaKind =
  | 'generic'
  | 'arxiv'
  | 'webofscience'
  | 'pubmed'
  | 'semantic-scholar'
  | 'google-scholar'
  | 'core'
  | 'springer'
  | 'sciencedirect'
  | 'scopus'
  | 'wiley-deprecated'
  | 'custom';

export interface PlatformMetadata {
  // existing fields
  schemaKind?: PlatformSchemaKind;
  optionCaps?: { maxResults?: number };
  capabilityGroups?: CapabilityGroup[];
  supportsDoiLookup?: boolean;
  isRepository?: boolean;
}
```

不要只靠 `directTool: true` 判断是否 generic。`search_core`、`search_google_scholar`、`search_scopus`、`search_semantic_snippets` 等都有特殊 schema 或特殊行为。

### 3.2 新增派生函数，但不急着替换全部手写代码

可以新增：

```ts
export function getPlatformToolDescriptors(): PlatformMetadata[] {
  return PLATFORM_METADATA.filter(platform => platform.directTool && platform.toolName);
}

export function getGenericPlatformToolDescriptors(): PlatformMetadata[] {
  return getPlatformToolDescriptors().filter(platform => platform.schemaKind === 'generic');
}
```

然后逐步让 `tools.ts` 和 `schemas.ts` 使用这些函数。

### 3.3 禁止的错误迁移

不要做：

```ts
if (platform.directTool) return GenericPlatformSearchSchema.parse(args)
```

这会破坏特殊工具 schema。

正确做法：

```ts
if (getGenericSearchToolPlatform(String(toolName))) {
  return GenericPlatformSearchSchema.parse(args);
}

switch (toolName) {
  // special tools keep explicit schema
}
```

---

## Phase 4 - Searcher Factory Registry 准备

当前 `initializeSearchers()` 手写实例化所有 searcher，并手写 alias。下一阶段应新增：

```text
src/core/platformFactories.ts
```

建议接口。执行时可以在此基础上加入轻量 context 参数以复用已创建实例，例如 `USENIXSearcher` 依赖 `DBLPSearcher`，不要为追求伪代码一致而重复创建共享 searcher：

```ts
export interface PlatformFactoryContext {
  env: NodeJS.ProcessEnv;
  instances: Record<string, PaperSource>;
}

export type PlatformFactory = (context: PlatformFactoryContext) => PaperSource;

export const PLATFORM_FACTORIES: Record<string, PlatformFactory> = {
  arxiv: () => new ArxivSearcher(),
  crossref: ({ env }) => new CrossrefSearcher(env.CROSSREF_MAILTO),
  pubmed: ({ env }) => new PubMedSearcher(env.PUBMED_API_KEY),
  // ...
};
```

`initializeSearchers()` 后续应从：

```ts
const arxivSearcher = new ArxivSearcher();
const wosSearcher = new WebOfScienceSearcher(...);
```

收敛到：

```ts
for (const platform of PLATFORM_METADATA) {
  const factory = PLATFORM_FACTORIES[platform.id];
  if (!factory) continue;
  const instance = factory({ env: process.env, instances: searchers });
  searchers[platform.id] = instance;
  for (const alias of platform.aliases || []) {
    searchers[alias] = instance;
  }
}
```

注意：TypeScript 类型可以先用 `Record<string, PaperSource>` 过渡，不要为了强类型一次性大改所有调用方。

---

## Phase 5 - 统一 HttpClient 准备

当前 `utils/HttpClient.ts` 主要做 proxy。下一阶段先建立接口，不要一次性迁移全部平台。

### 5.1 定义 HttpPolicy

建议：

```ts
export interface HttpPolicy {
  rateLimit?: { rps: number; burst?: number };
  cache?: { ttlMs: number; maxSize?: number };
  timeoutMs?: number;
  retry?: { maxRetries: number };
  userAgent?: string;
  validateStatus?: (status: number) => boolean;
}
```

### 5.2 定义 HttpClient

```ts
export class HttpClient {
  constructor(policy: HttpPolicy = {}) {}

  async request<T>(config: HttpRequestConfig): Promise<T> {
    // rate limit -> cache -> axios/fetch -> retry -> error classification
  }
}
```

`HttpRequestConfig` 需要在 `utils/HttpClient.ts` 中显式定义或从 axios config 类型收窄导出，不要留下未定义类型。

保留 `setupGlobalProxy()`，避免破坏 CLI 启动流程。

### 5.3 建立 httpPolicies

新增：

```text
src/core/httpPolicies.ts
```

先声明少量平台策略即可，例如：

```ts
export const HTTP_POLICIES: Record<string, HttpPolicy> = {
  crossref: { rateLimit: { rps: 1 }, cache: { ttlMs: 3600_000 } },
  openalex: { rateLimit: { rps: 1 }, cache: { ttlMs: 3600_000 } },
  arxiv: { rateLimit: { rps: 0.33 }, timeoutMs: 10_000 }
};
```

不要在同一个 PR 里迁移全部平台。优先迁移 1–3 个免费、稳定、测试容易 mock 的平台。

---

## 验收标准

完成本任务后，必须满足：

```bash
npm test -- --runInBand
npm run build
```

并人工检查：

```bash
node dist/cli.js tools --pretty
node dist/cli.js doctor --pretty
node dist/cli.js run get_paper_citations --arg doi="10.1038/nature12373" --arg limit=1 --pretty
node dist/cli.js run download_with_fallback --json-args '{"source":"crossref","paperId":"not-a-real-doi-for-contract-check","useSciHub":false}' --pretty
```

允许 citation live call 因网络、429 或外部 API 失败而失败，但 schema、路由和输出包装必须正确。
`download_with_fallback` 的人工检查应使用不会命中真实 PDF 的占位 ID，避免验收命令产生下载副作用；该命令应返回 `scihub` stage 且状态为 `skipped`。

---

## 最终检查清单

- [ ] `docs/ARCHITECTURE.zh.md` 已描述 v0.3.1 当前架构。
- [ ] `docs/refactor/README.md` 已把 01–04 标为已完成。
- [ ] README / README.zh 版本 badge 与 `package.json` 一致。
- [ ] Skill / README 不声称机构访问已经实现。
- [ ] 新增或更新契约测试覆盖 tools schema、alias、capability profile、fallback attempts。
- [ ] `DownloadTier` 支持可注入 tiers。
- [ ] direct metadata fallback 优先用 `doi || paperId`。
- [ ] Unpaywall tier 对 searcher 缺失做 skipped 保护。
- [ ] 平台注册表迁移前区分 generic schema 与特殊 schema。
- [ ] build 和测试通过。

---

## 非目标

- 不实现机构访问 provider。
- 不新增 top-level citation command。
- 不改默认 Sci-Hub fallback 行为。
- 不改 Agent-facing JSON 输出结构。
- 不把所有平台一次性迁移到统一 HttpClient。
- 不删除现有兼容 alias。
