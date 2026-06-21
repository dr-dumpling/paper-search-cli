# paper-search-cli Roadmap

本文记录当前架构之外的后续演进方向。当前事实源是 [`ARCHITECTURE.zh.md`](./ARCHITECTURE.zh.md)。维护入口是 [`MAINTENANCE.zh.md`](./MAINTENANCE.zh.md)。本文不是当前实现说明，也不是 Agent 必须立即执行的任务书。

---

## 当前状态

当前版本已经完成：

- citation expansion 工具接入。
- `DownloadTier` 扩展点和默认下载层顺序。
- `PlatformMetadata` 字段扩展。
- `PlatformFactoryRegistry` 初步拆分。
- `HttpClient` / `HttpPolicy` 最小 scaffold。
- 工具 schema、alias、capability profile、fallback attempts 的契约测试。
- Agent 维护文档体系：capabilities、dependencies、contracts、agent-maintenance。

当前文档策略：

- `ARCHITECTURE.zh.md` 只描述当前架构。
- `MAINTENANCE.zh.md` 是维护文档入口。
- 已完成的 refactor 任务书不再保留。
- 未来机构访问放入 `docs/roadmap/`。

---

## 1. 能力目录独立维护

当前业务能力边界已经清楚，但代码物理结构仍处于过渡态。后续可以逐步迁移到：

```text
src/capabilities/
src/registry/
src/infrastructure/
src/management/
```

推荐顺序：

1. `journal-metrics`
2. `citation-expansion`
3. `pdf-discovery`
4. `body-snippet-search`
5. `metadata-search`
6. `management-layer`

约束：

- 迁移目录时不改变工具名、schema、JSON 输出和 Skill contract。
- 不把 `platforms/`、registry、HttpClient、Paper 模型放进某个 capability。
- 每次只迁移一个能力，保持 PR 可回滚。

详细路线见 [`agent-maintenance/code-organization-upgrade.zh.md`](./agent-maintenance/code-organization-upgrade.zh.md)。

---

## 2. 数据源注册表继续收敛

当前 `platformMetadata.ts` 已经记录平台身份、别名、schema 类型、能力分组、DOI lookup 支持和 repository 标记。后续可以继续把以下手写清单收敛到注册表派生：

- DOI lookup source 列表。
- repository fallback source 列表。
- capability profile 的 source group。
- diagnostics 里的 direct tool / platform 映射。
- 普通平台工具 schema 的生成逻辑。

约束：

- 只有 `schemaKind: 'generic'` 的平台可以走 generic schema。
- `search_core`、`search_google_scholar`、`search_scopus`、`search_semantic_snippets` 等特殊工具必须保留特殊 schema。
- `citation_expansion`、`journal_metrics`、`pdf_discovery`、`body_snippet_search` 不应被当作普通平台搜索源。

---

## 3. Searcher factory registry 完整化

当前 `PLATFORM_FACTORIES` 已经集中实例化平台 Searcher，`initializeSearchers()` 已经基于 `PLATFORM_METADATA` 和 alias 自动组装实例。

后续可以继续优化：

- 减少 `Searchers` 接口中的手写字段。
- 为平台实例化补充契约测试，确认 canonical id 和 alias 指向同一实例。
- 为依赖其它 Searcher 的平台保留 factory context，例如 USENIX 复用 DBLP。
- 让新增普通平台只需要新增 Searcher class、metadata、factory 和必要测试。

---

## 4. 统一 HttpClient 落地

当前 `HttpClient` 只是最小 scaffold，尚未完整执行 rate limit、cache、retry 和统一错误分类。

后续目标：

- 在 `HttpClient.request()` 中实现：
  - rate limit；
  - cache；
  - retry；
  - timeout；
  - user-agent；
  - validateStatus；
  - proxy；
  - error classification；
  - 脱敏日志。
- 让平台常规 HTTP 请求逐步停止直接 `import axios`。
- 先迁移少量免费、稳定、易 mock 的平台，例如 Crossref、OpenAlex、arXiv。
- 避免一次性迁移全部平台。

验收方向：

- 迁移平台的测试能 mock `HttpClient`。
- 未迁移平台行为不变。
- `setupGlobalProxy()` 继续兼容现有 CLI 启动流程。

---

## 5. DownloadTier 后续增强

当前 PDF fallback 顺序为：

```text
primary -> direct_pdf_url -> repositories -> unpaywall -> scihub
```

当前已经支持：

- `createDefaultDownloadTiers()`。
- `insertDownloadTierBefore()`。
- `downloadWithFallback(..., tiers)` 注入自定义 tier。
- 默认 attempts 不包含 `institutional_access`。

后续可以增强：

- 将 repository sources 从 `platformMetadata.isRepository` 派生。
- 对 attempts message 做更统一的错误分类和脱敏。
- 在未来机构访问实现时，把 `institutional_access` 插入到 `scihub` 前。

未来机构访问详见 [`roadmap/FUTURE_INSTITUTIONAL_ACCESS.zh.md`](./roadmap/FUTURE_INSTITUTIONAL_ACCESS.zh.md)。

---

## 6. Skill 与 CLI 契约持续同步

继续保持：

- `skills/paper-search/references/cli-contract.md` 与 `TOOLS` 同步。
- `SkillContract.test.ts` 校验 Direct Run Tools 与源码工具注册表一致。
- README 不声称未来能力已经实现。
- Skill 不保存私密配置值。

---

## 非目标

本文不要求立即执行任何代码改造。

本文不定义：

- WebVPN / CARSI / EZProxy 当前能力；
- 新的 top-level citation command；
- 默认启用机构访问；
- 删除 Sci-Hub fallback；
- 改变当前 Agent-facing JSON 输出结构。
