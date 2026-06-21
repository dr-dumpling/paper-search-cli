# Dependency: Platform Registry

平台注册表是数据源轴的事实源，负责记录平台身份、alias、schema 类型、能力标签和实例化入口。它不属于某个单独 capability。

---

## 1. 职责

- 记录平台 canonical id。
- 记录 alias 并解析到 canonical id。
- 记录平台是否进入 default all sources。
- 记录普通 direct tool 名称。
- 区分 generic schema 和特殊 schema。
- 标记 capabilityGroups、supportsDoiLookup、isRepository。
- 配合 `platformFactories` 初始化 Searcher。

---

## 2. 主要代码

| 文件 | 职责 |
|---|---|
| `src/core/platformMetadata.ts` | 平台 metadata、alias、generic tool helper |
| `src/core/platformFactories.ts` | Searcher factory registry |
| `src/core/searchers.ts` | 初始化 Searchers 字典和 alias 实例 |
| `src/core/tools.ts` | 消费 generic platform tool descriptors |
| `src/core/schemas.ts` | 对 generic tools 使用 generic schema，对特殊工具保留显式 schema |

---

## 3. 核心字段

| 字段 | 说明 |
|---|---|
| `id` | canonical platform id |
| `aliases` | alias 列表，不进入 default all sources |
| `displayName` | 展示名 |
| `sourceKind` | `official-api` / `metadata-proxy` / `html` / `alias` |
| `defaultInAll` | 是否进入 `--sources all` |
| `directTool` | 是否有直接平台工具 |
| `toolName` | direct tool 名称 |
| `schemaKind` | schema 分类；只有 `generic` 可走 generic schema |
| `configKeys` / `optionalConfigKeys` | 配置依赖 |
| `capabilityGroups` | 能力分组标签 |
| `supportsDoiLookup` | 是否可用于 DOI 定向查询 |
| `isRepository` | 是否可用于 repository fallback |

---

## 4. Generic 与特殊 schema

只有满足以下条件的平台才能走 generic schema：

- `directTool: true`
- `toolName` 存在
- `schemaKind: 'generic'`
- 参数可以用通用字段表达

不得 generic 化：

- `search_core`
- `search_google_scholar`
- `search_scopus`
- `search_semantic_snippets`
- `search_scihub`
- `search_wiley`
- `query_journal_metrics`
- `download_with_fallback`
- `get_paper_citations` / `get_paper_references`

---

## 5. 新增平台流程

1. 新建 `platforms/XxxSearcher.ts`。
2. 在 `PLATFORM_METADATA` 新增 entry。
3. 在 `PLATFORM_FACTORIES` 新增 factory。
4. 如需 alias，写入 `aliases`，不要创建独立 platform entry。
5. 判断是否 `defaultInAll`。
6. 判断 `schemaKind`。
7. 设置 `capabilityGroups`、`supportsDoiLookup`、`isRepository`。
8. 更新 `platformMetadata.test.ts` 和 `toolsContract.test.ts`。

---

## 6. 不变量

- Alias 解析必须稳定：如 `wos -> webofscience`、`scholar -> googlescholar`、`springerlink -> springer`。
- Alias 不得出现在 default all sources。
- Generic tool names 只能来自 `schemaKind: 'generic'` 的 descriptors，加上显式兼容 alias。
- 新平台不能只加 Searcher，不加 metadata / factory / tests。
- `citation_expansion`、`journal_metrics`、`pdf_discovery`、`body_snippet_search` 不属于普通平台注册表。

---

## 7. 测试要求

```bash
npm test -- --runInBand tests/core/platformMetadata.test.ts tests/core/toolsContract.test.ts
npm run build
```
