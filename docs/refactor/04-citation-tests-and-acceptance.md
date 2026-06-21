# 04 - Citation Tests And Acceptance

状态：已完成。citation schema / handler / Skill contract / fallback attempts 测试已补齐；本文保留为历史执行依据。

## 目标

为 citation expansion 和 `DownloadTier` 接口重排补齐测试，并执行最终验收。

## 改动点

- `tests/core/schemas.test.ts`: 覆盖 citation 入参校验。
- `tests/core/handleToolCall.test.ts`: 覆盖 citation 工具分发和 JSON 返回。
- `tests/skills/SkillContract.test.ts`: 覆盖 Direct Run Tools 与 `TOOLS` 同步。
- `tests/services/OpenAccessFallbackService.test.ts`: 覆盖 `DownloadTier` 顺序与 fallback 行为。

## 执行步骤

1. 在 `tests/core/schemas.test.ts` 增加：
   - `paperId` / `doi` / `arxivId` 全缺失时报错。
   - `limit` 默认值为 100。
   - `limit` 小于 1 或大于 100 时报错。
   - 多标识同时存在时 parse 后保留全部输入，由 `handleToolCall` 决定优先级。
2. 在 `tests/core/handleToolCall.test.ts` mock `CitationService`：
   - `get_paper_citations` 返回 `relation: "citations"`、`provider: "semantic_scholar"`、`total`、`papers`。
   - `get_paper_references` 返回 `relation: "references"`、`provider: "semantic_scholar"`、`total`、`papers`。
   - 同时传入 `paperId`、`doi`、`arxivId` 时使用 `paperId`。
3. 在 `tests/skills/SkillContract.test.ts` 更新能力地图断言，包含 `citation_expansion`。
4. 在 `tests/services/OpenAccessFallbackService.test.ts` 增加 attempts 顺序测试：
   - 默认顺序为 `primary`、`direct_pdf_url`、`repositories`、`unpaywall`、`scihub`。
   - `useSciHub: false` 时 `scihub` 为 `skipped`。
   - 默认 attempts 不包含 `institutional_access`。

测试不访问真实 Semantic Scholar API；citation service 用 mock。

## 验收命令

```bash
npm test -- --runInBand
npm run build
```

文档拆分本身可用以下检查确认：

```bash
find docs/refactor -maxdepth 1 -type f | sort
old_a="implementation_plan_""citation_expansion"
old_b="implementation_plan_""webvpn_carsi_access"
! rg "${old_a}|${old_b}" docs
rg "docs/refactor" docs/ARCHITECTURE_REFACTOR.zh.md
```

旧计划检查命令必须无结果；最后一条命令必须能看到总架构指向新索引。

## 非目标

- 不写在线集成测试。
- 不测试 WebVPN、CARSI、EZProxy 登录。
- 不修改或验证现有 `dist/platforms/*` 删除状态。

## 验收标准

- `npm test -- --runInBand` 通过。
- `npm run build` 通过。
- 新工具可通过 `paper-search run` 返回稳定 JSON。
- 未实现机构权限下载前，相关文档和输出只表达“接口预留”。
