# Capability: body_snippet_search

`body_snippet_search` 负责在 Semantic Scholar Open Access snippet 索引中查找标题、摘要和正文片段线索，尤其用于 Methods、参数、软件、模型和写法定位。

---

## 1. 当前职责

- 查询 Semantic Scholar Open Access snippet index。
- 支持自然语言 query。
- 支持 `limit`、year、fieldsOfStudy、paperIds、authors、venue、minCitationCount、publicationDateOrYear、fields 等参数。
- 返回 snippet 结果，帮助 Agent 定位方法学线索。

---

## 2. 不负责什么

- 不做完整全文解析。
- 不下载 PDF。
- 不替代 metadata search。
- 不保证所有 snippet 都来自正文；只有 `snippetKind="body"` 可作为正文片段证据。
- 不使用 `maxResults`。
- 不被普通 platform schema 泛化。

---

## 3. 用户入口

| 入口 | 类型 | 说明 |
|---|---|---|
| `paper-search run search_semantic_snippets` | direct tool | Semantic Scholar snippet 检索 |

---

## 4. 当前代码入口

| 文件 | 职责 |
|---|---|
| `src/platforms/SemanticScholarSearcher.ts` | 当前 snippet search 实现位置 |
| `src/core/schemas.ts` | `SearchSemanticSnippetsSchema` |
| `src/core/tools.ts` | `search_semantic_snippets` 工具定义 |
| `src/core/handleToolCall.ts` | snippet handler 分发 |
| `tests/core/toolsContract.test.ts` | snippet schema surface 契约 |

后续可将 snippet 实现拆到 `src/capabilities/body-snippet-search/` 私有 service，但必须保持当前 CLI 工具和输出不变。

---

## 5. 数据流

```text
paper-search run search_semantic_snippets --arg query="..." --arg limit=5
  → SearchSemanticSnippetsSchema
  → searchers.semantic.searchSnippets(args)
  → Semantic Scholar OA snippet index
  → snippet results
```

---

## 6. 消费的共享依赖

| 依赖 | 文档 | 使用方式 |
|---|---|---|
| 配置与密钥 | `docs/dependencies/config-and-secrets.zh.md` | `SEMANTIC_SCHOLAR_API_KEY` 必需 |
| HTTP 基础设施 | `docs/dependencies/http-infrastructure.zh.md` | 未来可迁移请求层 |
| 平台适配器 | `docs/dependencies/platform-adapters.zh.md` | 当前挂在 SemanticScholarSearcher 上 |
| CLI 工具契约 | `docs/contracts/cli-tools-contract.zh.md` | 维护 `limit` 等 schema |
| JSON 输出契约 | `docs/contracts/json-output-contract.zh.md` | 维护 snippet 输出说明 |

---

## 7. 不允许的依赖

- 不 import pdf-discovery。
- 不 import journal-metrics。
- 不 import citation-expansion。
- 不 import management layer。
- 不作为普通 metadata platform tool 泛化。

---

## 8. 扩展方式

### 新增 snippet 参数

1. 更新 `SearchSemanticSnippetsSchema`。
2. 更新 `TOOLS` inputSchema。
3. 更新 `toolsContract` 测试。
4. 更新 Skill capability routing 示例。
5. 保持参数名与 Semantic Scholar API 语义一致。

### 拆出独立 service

建议顺序：

1. 新建 `src/capabilities/body-snippet-search/`。
2. 先 re-export 或 wrapper 当前 `searchers.semantic.searchSnippets()`。
3. 补测试确认工具输出不变。
4. 再考虑从 `SemanticScholarSearcher` 拆出请求实现。

---

## 9. 测试要求

必跑：

```bash
npm test -- --runInBand tests/core/toolsContract.test.ts tests/core/schemas.test.ts tests/core/handleToolCall.test.ts
npm run build
```

不得在测试中调用真实 Semantic Scholar snippet API。

---

## 10. Agent checklist

- [ ] 使用 `limit`，不是 `maxResults`。
- [ ] schema 未被 generic platform schema 替代。
- [ ] 明确 snippet 不是完整全文。
- [ ] `SEMANTIC_SCHOLAR_API_KEY` 不泄露。
- [ ] 只有 `snippetKind="body"` 被写成正文片段证据。
- [ ] README / Skill 示例与 schema 一致。
