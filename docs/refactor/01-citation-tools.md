# 01 - Citation Tools

状态：已完成。`get_paper_citations` 和 `get_paper_references` 已接入 `TOOLS`、schema、handler 和 `CitationService`；本文保留为历史执行依据。

## 目标

接入现有 `CitationService`，把施引文献和参考文献查询变成正式的 `paper-search run` 工具。

新增工具：

- `get_paper_citations`: 查询 citing papers / 施引文献，即哪些论文引用了当前论文。
- `get_paper_references`: 查询 cited references / 参考文献，即当前论文引用了哪些文献。

默认数据来源为 Semantic Scholar Graph API。无 `SEMANTIC_SCHOLAR_API_KEY` 时使用免费层；配置 key 后自动使用 key。

## 改动点

- `src/core/tools.ts`: 注册 `get_paper_citations` 和 `get_paper_references`。
- `src/core/schemas.ts`: 增加共享 citation lookup schema，并把两个工具名加入 `ToolName`。
- `src/core/handleToolCall.ts`: 分发两个工具，调用 `CitationService.getCitations()` 和 `CitationService.getReferences()`。
- `src/services/CitationService.ts`: 扩展 citations/references 请求字段，保证返回论文包含 DOI、URL、referenceCount 中可用字段。

## 入参契约

两个工具使用同一入参：

- `paperId`: Semantic Scholar paper id 或带前缀的外部 id。
- `doi`: DOI；实现时转换为 `DOI:<doi>`。
- `arxivId`: arXiv id；实现时转换为 `ARXIV:<id>`。
- `limit`: 返回数量，默认 100，范围 1 到 100。

当多个标识同时出现时，优先级固定为：`paperId` > `doi` > `arxivId`。
三种目标标识必须至少提供一种；缺失时由 schema 报错。

## 输出契约

两个工具返回同一结构：

```json
{
  "target": "DOI:10.xxxx/xxxxx",
  "relation": "citations",
  "provider": "semantic_scholar",
  "total": 5,
  "papers": []
}
```

`relation` 对 `get_paper_citations` 为 `citations`，对 `get_paper_references` 为 `references`。`total` 等于本次返回的 `papers.length`。`papers` 使用 `CitationData` 字段，包含 `paperId`、`title`、`citationCount`、`referenceCount`、`year`、`authors`、`venue`、`doi`、`url` 中可用字段。

## 执行步骤

1. 在 `src/core/schemas.ts` 定义 `citationLookupSchema`，用 `refine` 校验 `paperId`、`doi`、`arxivId` 至少一个存在。
2. 在 `src/core/tools.ts` 添加两个工具定义，inputSchema 与 `citationLookupSchema` 保持一致。
3. 在 `src/core/handleToolCall.ts` 增加 `resolveCitationTarget(args)` 小函数，只负责按优先级返回 `paperId` / `DOI:<doi>` / `ARXIV:<id>`。
4. 在 `handleToolCall` 中新增两个 case，实例化 `CitationService`，调用对应方法，并返回上面的 JSON。
5. 在 `src/services/CitationService.ts` 的 citations/references fields 中加入 `referenceCount`、`externalIds`、`url`。

## 非目标

- 不实现 Zotero 写入或 Zotero 菜单集成。
- 不批量拉取所有分页；第一版只按 `limit` 获取单页结果。
- 不把 citation 工具塞进 `platformMetadata` 平台注册表。

## 验收标准

- `paper-search tools --pretty` 能列出两个新工具。
- `paper-search run get_paper_citations --arg doi=10.1038/nature12373 --arg limit=5 --pretty` 返回 `relation: "citations"`。
- `paper-search run get_paper_references --arg doi=10.1038/nature12373 --arg limit=5 --pretty` 返回 `relation: "references"`。
- 缺少 `paperId`、`doi`、`arxivId` 时 schema 明确报错。
