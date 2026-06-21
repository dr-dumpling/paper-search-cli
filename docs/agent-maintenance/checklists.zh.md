# Agent Maintenance Checklists

本文用于所有 Agent 改动的收尾检查。不要只依赖 `npm test`；先判断改动类型，再执行对应 checklist。

---

## 1. 通用 checklist

所有改动都必须检查：

- [ ] 已阅读 `docs/ARCHITECTURE.zh.md`。
- [ ] 已根据任务读取对应 `docs/capabilities/*.zh.md`。
- [ ] 如果改共享依赖，已读取对应 `docs/dependencies/*.zh.md`。
- [ ] 如果改对外行为，已读取对应 `docs/contracts/*.zh.md`。
- [ ] 没有写入真实 secret、cookie、token、账号、密码。
- [ ] 没有把 future-only 能力写成当前能力。
- [ ] PR 描述写明 scope、non-goals、tests。

---

## 2. 修改工具或 schema

适用：`TOOLS`、`core/tools.ts`、`schemas.ts`、capability schema、工具 inputSchema。

- [ ] 工具名集合是否变化？若变化，更新 `docs/contracts/cli-tools-contract.zh.md`。
- [ ] inputSchema 是否变化？若变化，更新 README / Skill / cli-contract 中对应说明。
- [ ] 特殊工具是否仍保留特殊 schema？例如 CORE、Scopus、Google Scholar、Semantic snippets。
- [ ] `tests/core/toolsContract.test.ts` 已更新并通过。
- [ ] `tests/core/schemas.test.ts` 已更新并通过。
- [ ] `tests/skills/SkillContract.test.ts` 已更新并通过。

必跑：

```bash
npm test -- --runInBand tests/core/toolsContract.test.ts tests/core/schemas.test.ts tests/skills/SkillContract.test.ts
npm run build
```

---

## 3. 修改 tool handler / 输出结构

适用：`handleToolCall.ts`、capability handler、service result mapping。

- [ ] JSON 输出结构是否变化？若变化，更新 `docs/contracts/json-output-contract.zh.md`。
- [ ] `paper-search run` 包装结构是否保持 `{ ok, tool, message, data }`。
- [ ] 错误路径是否不泄露 secret、URL token、cookie。
- [ ] `tests/core/handleToolCall.test.ts` 已更新并通过。
- [ ] 相关 capability 测试已通过。

必跑：

```bash
npm test -- --runInBand tests/core/handleToolCall.test.ts
npm run build
```

---

## 4. 修改 metadata search

适用：多源检索、source 解析、去重、普通平台搜索路由。

- [ ] 没有引入 PDF 下载策略。
- [ ] 没有把 Sci-Hub 当 metadata source。
- [ ] alias 仍由 platform registry 解析。
- [ ] default all sources 不包含 alias。
- [ ] 单源失败不应阻塞其它源。
- [ ] JSON 输出仍包含 `sources_used`、`source_results`、`errors`、`failed_sources`、`total`、`papers`。

必跑：

```bash
npm test -- --runInBand tests/core/platformMetadata.test.ts tests/core/handleToolCall.test.ts
npm run build
```

---

## 5. 修改 citation expansion

适用：`get_paper_citations`、`get_paper_references`、CitationService、citation schema。

- [ ] 仍要求 `paperId`、`doi`、`arxivId` 至少一个。
- [ ] target 优先级仍为 `paperId > doi > arxivId`。
- [ ] `doi` 转为 `DOI:<doi>`。
- [ ] `arxivId` 转为 `ARXIV:<id>`。
- [ ] `limit` 默认为 100，范围 1–100。
- [ ] 输出仍为 `{ target, relation, provider, total, papers }`。
- [ ] 没有把 citation expansion 写成关键词搜索。

必跑：

```bash
npm test -- --runInBand tests/core/schemas.test.ts tests/core/handleToolCall.test.ts tests/core/toolsContract.test.ts
npm run build
```

---

## 6. 修改 PDF discovery / DownloadTier

适用：`OpenAccessFallbackService.ts`、DownloadTier、PDF fallback、Sci-Hub 抑制。

- [ ] 默认顺序仍为 `primary -> direct_pdf_url -> repositories -> unpaywall -> scihub`。
- [ ] `useSciHub:false` 时 `scihub` 仍出现在 attempts，状态为 `skipped`。
- [ ] 默认 attempts 不包含 `institutional_access`。
- [ ] attempts item 只包含 `{ stage, status, message }`。
- [ ] direct metadata fallback 优先使用 `doi || paperId`。
- [ ] Unpaywall 缺失时返回 `skipped`，不抛运行时异常。
- [ ] 没有接收账号、密码、cookie、token 参数。

必跑：

```bash
npm test -- --runInBand tests/services/OpenAccessFallbackService.test.ts tests/core/toolsContract.test.ts
npm run build
```

---

## 7. 修改 journal metrics

适用：EasyScholar、期刊指标查询、batch journal lookup。

- [ ] 不返回论文 metadata 列表。
- [ ] 不进入 `platformMetadata` 论文数据源注册表。
- [ ] `EASYSCHOLAR_KEY` 不被写入文档、测试、日志。
- [ ] 批量查询不引入并行风控风险。
- [ ] `query_journal_metrics` schema 与 CLI 示例同步。

必跑：

```bash
npm test -- --runInBand tests/core/schemas.test.ts tests/core/handleToolCall.test.ts
npm run build
```

---

## 8. 修改 body snippet search

适用：`search_semantic_snippets`、Semantic Scholar snippet API、snippet schema。

- [ ] 使用 `limit`，不是 `maxResults`。
- [ ] 不被普通 platform schema 泛化。
- [ ] 明确 snippet 不是完整全文。
- [ ] `SEMANTIC_SCHOLAR_API_KEY` 不写入文档、测试、日志。
- [ ] 只把 `snippetKind='body'` 当作正文片段证据。

必跑：

```bash
npm test -- --runInBand tests/core/toolsContract.test.ts tests/core/schemas.test.ts
npm run build
```

---

## 9. 修改平台注册表 / 平台适配器

适用：`platformMetadata.ts`、`platformFactories.ts`、`platforms/*.ts`。

- [ ] 新平台有 metadata entry。
- [ ] 新平台有 factory entry。
- [ ] alias 不进入 default all sources。
- [ ] `schemaKind` 正确，特殊平台不走 generic schema。
- [ ] `capabilityGroups`、`supportsDoiLookup`、`isRepository` 根据实际能力填写。
- [ ] `PaperSource.getCapabilities()` 与 metadata 描述不冲突。
- [ ] 新平台返回标准 `Paper`。

必跑：

```bash
npm test -- --runInBand tests/core/platformMetadata.test.ts tests/core/toolsContract.test.ts
npm run build
```

---

## 10. 修改 HttpClient / HTTP policy

适用：`HttpClient.ts`、`httpPolicies.ts`、RateLimiter、RequestCache、ErrorHandler。

- [ ] 保留 `setupGlobalProxy()` 兼容 CLI 启动流程。
- [ ] 不一次性迁移所有平台。
- [ ] 新增 policy 不改变未迁移平台行为。
- [ ] 错误和日志脱敏。
- [ ] rate limit/cache/retry 行为有测试或明确非目标说明。
- [ ] 迁移平台可 mock HttpClient。

必跑：

```bash
npm test -- --runInBand
npm run build
```

---

## 11. 修改 Skill / README / docs

- [ ] 当前能力与未来能力分开。
- [ ] README 不声称 WebVPN/CARSI/EZProxy 已实现。
- [ ] Skill Direct Run Tools 与 `TOOLS` 同步。
- [ ] `skills/paper-search/references/cli-contract.md` 与实际 CLI 一致。
- [ ] 已完成任务书不保留为“可执行”。

必跑：

```bash
npm test -- --runInBand tests/skills/SkillContract.test.ts
```

---

## 12. 最终验收

发布或合并前建议执行：

```bash
npm test -- --runInBand
npm run build
```

如不能运行测试，PR 必须明确写出未运行原因和潜在风险。
