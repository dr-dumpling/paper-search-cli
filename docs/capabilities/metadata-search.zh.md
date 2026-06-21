# Capability: metadata_search

`metadata_search` 负责论文元数据检索、文献初筛和标识核验。它是构建论文列表的能力，不负责 PDF fallback、引文图扩展、期刊指标或正文片段检索。

---

## 1. 当前职责

- 按关键词检索论文元数据。
- 支持单源和多源检索。
- 解析 `--platform`、`--sources` 和 alias。
- 聚合多源结果并去重。
- 核验 DOI、PMID、PMCID、arXiv ID 等论文标识。
- 输出 Agent 可解析的 JSON 结果。

---

## 2. 不负责什么

- 不下载 PDF。
- 不执行 `DownloadTier` fallback。
- 不调用 citation expansion。
- 不查询期刊指标。
- 不查询 Semantic Scholar body snippets。
- 不把 Sci-Hub 当作 metadata source。

---

## 3. 用户入口

| 入口 | 类型 | 说明 |
|---|---|---|
| `paper-search search <query>` | top-level CLI | 集成 metadata search 入口 |
| `paper-search search <query> --platform NAME` | top-level CLI | 单平台检索 |
| `paper-search search <query> --sources a,b,c` | top-level CLI | 多源检索 |
| `paper-search run search_papers` | direct tool | `search` 背后的 direct tool |
| `paper-search run search_*` | direct tool | 精确平台检索工具 |
| `paper-search run get_paper_by_doi` | direct tool | DOI 定向元数据核验 |

---

## 4. 当前代码入口

| 文件 | 职责 |
|---|---|
| `src/services/MultiSourceSearchService.ts` | 多源检索、source 解析、并发、去重 |
| `src/core/tools.ts` | 注册 metadata search 相关工具 |
| `src/core/schemas.ts` | metadata search 参数校验 |
| `src/core/handleToolCall.ts` | search 工具分发 |
| `src/core/platformMetadata.ts` | 平台身份、alias、schemaKind、能力标签 |
| `src/core/platformFactories.ts` | 平台 Searcher 实例化 |
| `src/platforms/*.ts` | 各平台 Searcher |
| `src/models/Paper.ts` | 统一论文模型 |

---

## 5. 数据流

```text
paper-search search "query"
  → search_papers
  → SearchPapersSchema
  → searchMultipleSources(searchers, query, sources, options)
      → parse source list
      → resolve platform aliases
      → per-source search with timeout isolation
      → Promise.allSettled
      → dedupe by DOI / title+author / source id
  → { sources_used, source_results, errors, failed_sources, total, papers }
```

---

## 6. 消费的共享依赖

| 依赖 | 文档 | 使用方式 |
|---|---|---|
| 平台注册表 | `docs/dependencies/platform-registry.zh.md` | 获取平台身份、alias、schemaKind、capabilityGroups |
| 平台适配器 | `docs/dependencies/platform-adapters.zh.md` | 调用 `PaperSource.search()` 和 `getPaperByDoi()` |
| Paper 模型 | `docs/dependencies/paper-model.zh.md` | 统一返回 `Paper` 并序列化 |
| HTTP 基础设施 | `docs/dependencies/http-infrastructure.zh.md` | 平台请求逐步迁移到统一 HttpClient |
| CLI 工具契约 | `docs/contracts/cli-tools-contract.zh.md` | 维护 search 工具和 schema |
| JSON 输出契约 | `docs/contracts/json-output-contract.zh.md` | 保持多源结果输出结构 |

---

## 7. 不允许的依赖

- 不 import `pdf-discovery` 内部实现。
- 不 import `journal-metrics`。
- 不 import `citation-expansion`。
- 不 import `management-layer`。
- 不把 `search_scihub` 纳入 metadata search。

---

## 8. 扩展方式

### 新增普通平台

1. 新建 `src/platforms/XxxSearcher.ts`。
2. 在 `platformMetadata.ts` 新增平台描述。
3. 在 `platformFactories.ts` 新增 factory。
4. 判断 `schemaKind` 是否能使用 `generic`。
5. 更新平台测试和工具契约测试。

### 新增特殊平台参数

1. 保持该平台 `schemaKind` 为特殊类型或 `custom`。
2. 在 schema 中显式处理。
3. 更新 `TOOLS` inputSchema。
4. 更新 `toolsContract` 和 `schemas` 测试。

---

## 9. 测试要求

常规必跑：

```bash
npm test -- --runInBand tests/core/platformMetadata.test.ts tests/core/toolsContract.test.ts tests/core/handleToolCall.test.ts
npm run build
```

如果改 source parsing / dedupe / multi-source 行为，还应补充或更新 `MultiSourceSearchService` 相关测试。

---

## 10. Agent checklist

- [ ] 没有把 PDF 下载逻辑放进 metadata search。
- [ ] 没有把 Sci-Hub 当 metadata source。
- [ ] alias 仍由 platform registry 管理。
- [ ] 新平台有 metadata 和 factory。
- [ ] 特殊 schema 没有被 generic 化。
- [ ] 多源输出结构未破坏。
- [ ] 工具和 Skill 契约已同步。
