# Contract: JSON Output

本文记录 Agent 可依赖的 JSON 输出边界。改输出结构属于对外契约改动，必须同步测试、Skill 和文档。

---

## 1. `paper-search run` 包装结构

默认输出应保持机器可读 JSON，典型结构：

```json
{
  "ok": true,
  "tool": "tool_name",
  "message": "first human-readable line",
  "data": {}
}
```

`--include-text` 可包含原始工具文本；`--format text` 用于显式人类可读输出。

---

## 2. metadata_search 输出

多源搜索应保留：

```json
{
  "sources_used": [],
  "source_results": {},
  "errors": {},
  "failed_sources": [],
  "total": 0,
  "papers": []
}
```

`papers` 使用 `PaperFactory.toDict()` 的稳定字段。

---

## 3. citation_expansion 输出

必须保持：

```json
{
  "target": "DOI:10.xxxx/xxxxx",
  "relation": "citations",
  "provider": "semantic_scholar",
  "total": 0,
  "papers": []
}
```

`relation` 只能是：

- `citations`
- `references`

`total` 等于本次返回的 `papers.length`。

---

## 4. pdf_discovery 输出

`download_with_fallback` 应保持：

```json
{
  "status": "ok",
  "path": "...",
  "attempts": []
}
```

`attempts` item 只能包含：

```json
{
  "stage": "scihub",
  "status": "skipped",
  "message": "..."
}
```

默认顺序：

```text
primary -> direct_pdf_url -> repositories -> unpaywall -> scihub
```

默认 attempts 不包含 `institutional_access`。

---

## 5. journal_metrics 输出

`query_journal_metrics` 返回 rows。每行应包含期刊名、状态和可用指标字段。新增字段时必须说明默认输出还是 `includeRaw` 输出。

---

## 6. body_snippet_search 输出

Snippet 输出应保留可区分 `title`、`abstract`、`body` 等 snippet kind 的字段。只有 `snippetKind="body"` 可作为正文片段证据。

---

## 7. 错误和脱敏

错误输出不得包含：

- 未脱敏密钥；
- session 或 ticket；
- cookie；
- 带凭据的完整 URL；
- 用户本机敏感路径内容。

---

## 8. 测试要求

```bash
npm test -- --runInBand tests/core/handleToolCall.test.ts tests/services/OpenAccessFallbackService.test.ts
npm run build
```

如果改 `PaperFactory.toDict()`，还应检查所有 metadata search 输出测试。
