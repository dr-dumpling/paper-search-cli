# Contract: CLI Tools

本文记录 direct run tools 和 schema 的维护契约。实际工具列表以 `src/core/tools.ts` 的 `TOOLS` 和 `tests/core/toolsContract.test.ts` 为准。

---

## 1. 工具所有权

| 能力 | 工具 |
|---|---|
| metadata_search | `search_papers`, `search_*`, `get_paper_by_doi` |
| citation_expansion | `get_paper_citations`, `get_paper_references` |
| pdf_discovery | `download_paper`, `download_with_fallback`, `search_scihub`, `check_scihub_mirrors` |
| journal_metrics | `query_journal_metrics` |
| body_snippet_search | `search_semantic_snippets` |
| management_layer | `get_platform_status` 和 top-level management commands |

---

## 2. Generic platform tools

Generic platform tools 只能来自：

- `platformMetadata.directTool === true`
- `platformMetadata.toolName` 存在
- `platformMetadata.schemaKind === 'generic'`

Generic tools 使用通用搜索 schema。特殊工具不得被 generic 化。

---

## 3. 特殊工具

以下工具必须保留特殊 schema 或 capability 私有 schema：

- `search_papers`
- `search_arxiv`
- `search_webofscience`
- `search_pubmed`
- `search_semantic_scholar`
- `search_semantic_snippets`
- `get_paper_citations`
- `get_paper_references`
- `download_paper`
- `get_paper_by_doi`
- `search_google_scholar`
- `search_scihub`
- `query_journal_metrics`
- `search_sciencedirect`
- `search_springer`
- `search_wiley`
- `search_scopus`
- `search_crossref`
- `search_openalex`
- `search_unpaywall`
- `search_pmc`
- `search_europepmc`
- `search_core`
- `search_openaire`
- `download_with_fallback`

---

## 4. 新增工具流程

1. 明确工具属于哪个 capability。
2. 在对应 capability 文档中增加入口说明。
3. 更新 `TOOLS`。
4. 更新 schema。
5. 更新 handler。
6. 更新 Skill CLI contract。
7. 更新 README 示例，如面向用户。
8. 更新 `toolsContract`、`schemas`、`handleToolCall` 和 `SkillContract` 测试。

---

## 5. 禁止事项

- 不无测试地改工具名。
- 不让 future-only 参数出现在当前工具 schema 中。
- 不把 `institutional_access`、`useInstitutionalAccess`、provider login 参数加入当前 `download_with_fallback`。
- 不把 `search_semantic_snippets` 的 `limit` 改成 `maxResults`。

---

## 6. 测试要求

```bash
npm test -- --runInBand tests/core/toolsContract.test.ts tests/core/schemas.test.ts tests/core/handleToolCall.test.ts tests/skills/SkillContract.test.ts
npm run build
```
