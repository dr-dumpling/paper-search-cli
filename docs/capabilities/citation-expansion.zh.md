# Capability: citation_expansion

`citation_expansion` 负责对已知论文进行引文图扩展：查询哪些论文引用了目标论文，以及目标论文引用了哪些参考文献。它不是关键词检索，也不是普通 metadata platform search。

---

## 1. 当前职责

- 根据 Semantic Scholar paperId、DOI 或 arXiv ID 定位目标论文。
- 查询施引文献：`get_paper_citations`。
- 查询参考文献：`get_paper_references`。
- 返回稳定 JSON：`target`、`relation`、`provider`、`total`、`papers`。
- 在无 API key 时使用 Semantic Scholar 免费层；有 key 时使用配置 key。

---

## 2. 不负责什么

- 不做关键词检索。
- 不进入普通平台搜索工具生成。
- 不替代 `metadata_search`。
- 不下载 PDF。
- 不查询期刊指标。
- 不管理 Zotero、Obsidian 或其它文献库。

---

## 3. 用户入口

| 入口 | 类型 | 说明 |
|---|---|---|
| `paper-search run get_paper_citations` | direct tool | 查询 citing papers / 施引文献 |
| `paper-search run get_paper_references` | direct tool | 查询 cited references / 参考文献 |

共享入参：

- `paperId`
- `doi`
- `arxivId`
- `limit`

目标优先级固定为：

```text
paperId > doi > arxivId
```

---

## 4. 当前代码入口

| 文件 | 职责 |
|---|---|
| `src/services/CitationService.ts` | Semantic Scholar Graph API 请求、解析 citation data |
| `src/core/schemas.ts` | `CitationLookupSchema` |
| `src/core/tools.ts` | `get_paper_citations` / `get_paper_references` 工具定义 |
| `src/core/handleToolCall.ts` | citation target 解析、handler 分发、JSON 包装 |
| `tests/core/schemas.test.ts` | citation 入参校验测试 |
| `tests/core/handleToolCall.test.ts` | citation handler 测试 |
| `tests/core/toolsContract.test.ts` | citation 工具 schema 契约测试 |

---

## 5. 数据流

```text
paper-search run get_paper_citations --arg doi="10.xxxx/xxxxx"
  → CitationLookupSchema
  → resolveCitationTarget(args)
      paperId → paperId
      doi → DOI:<doi>
      arxivId → ARXIV:<id>
  → CitationService.getCitations(target, limit)
  → Semantic Scholar Graph API
  → citationResponse(target, 'citations', papers)
```

`get_paper_references` 同理，只是 relation 为 `references`。

---

## 6. 消费的共享依赖

| 依赖 | 文档 | 使用方式 |
|---|---|---|
| HTTP 基础设施 | `docs/dependencies/http-infrastructure.zh.md` | 当前 service 仍可逐步迁移到统一 HttpClient |
| 配置与密钥 | `docs/dependencies/config-and-secrets.zh.md` | 读取 `SEMANTIC_SCHOLAR_API_KEY`，不得泄露 |
| CLI tools contract | `docs/contracts/cli-tools-contract.zh.md` | 维护工具名和 schema |
| JSON output contract | `docs/contracts/json-output-contract.zh.md` | 维护 citation result 结构 |

---

## 7. 不允许的依赖

- 不 import metadata-search 内部实现。
- 不 import pdf-discovery。
- 不 import journal-metrics。
- 不 import management layer。
- 不把 citation tool 放入 `platformMetadata.directTool` generic path。

---

## 8. 扩展方式

### 新增返回字段

1. 在 `CitationData` 中增加字段。
2. 在 Semantic Scholar `fields` 参数中请求字段。
3. 在 parser 中解析字段。
4. 更新 JSON contract 和测试。

### 新增入参

1. 更新 `CitationLookupSchema`。
2. 更新 `TOOLS` inputSchema。
3. 更新 `skills/paper-search/references/cli-contract.md`。
4. 更新 schema 和 handler 测试。

---

## 9. 测试要求

必跑：

```bash
npm test -- --runInBand tests/core/schemas.test.ts tests/core/handleToolCall.test.ts tests/core/toolsContract.test.ts tests/skills/SkillContract.test.ts
npm run build
```

测试不得调用真实 Semantic Scholar API；service 应 mock。

---

## 10. Agent checklist

- [ ] 目标标识至少一个仍被 schema 强制。
- [ ] 优先级仍为 `paperId > doi > arxivId`。
- [ ] `doi` 仍转换为 `DOI:<doi>`。
- [ ] `arxivId` 仍转换为 `ARXIV:<id>`。
- [ ] `limit` 默认 100，范围 1–100。
- [ ] 输出结构仍为 `{ target, relation, provider, total, papers }`。
- [ ] 没有把 citation expansion 写成关键词检索。
