# Change Recipes

本文给 Agent 提供常见维护任务的安全操作步骤。每个 recipe 都应与 capability、dependency、contract 文档一起使用。

---

## Recipe 1：新增普通 metadata 平台

### 适用场景

新增一个可以按关键词搜索论文元数据的平台。

### 先读

- `docs/capabilities/metadata-search.zh.md`
- `docs/dependencies/platform-registry.zh.md`
- `docs/dependencies/platform-adapters.zh.md`
- `docs/contracts/cli-tools-contract.zh.md`

### 改动文件

通常需要：

```text
src/platforms/XxxSearcher.ts
src/core/platformMetadata.ts
src/core/platformFactories.ts
src/core/tools.ts 或 registry 派生逻辑
tests/core/platformMetadata.test.ts
tests/core/toolsContract.test.ts
```

### 步骤

1. 新建 `XxxSearcher`，继承 `PaperSource`。
2. 实现 `search()`，返回标准 `Paper[]`。
3. 如支持 DOI 定位，实现或复用 `getPaperByDoi()`。
4. 在 `platformMetadata.ts` 增加 metadata entry。
5. 在 `platformFactories.ts` 增加 factory entry。
6. 决定 `schemaKind`：只有通用参数平台可用 `generic`。
7. 更新 alias / defaultInAll / capabilityGroups / configKeys。
8. 更新工具契约测试。

### 禁止

- 不把特殊 schema 平台强行设为 `generic`。
- 不把 alias 放进 default all sources。
- 不在 searcher 里返回非标准对象。
- 不在测试中发真实大规模请求。

### 必跑测试

```bash
npm test -- --runInBand tests/core/platformMetadata.test.ts tests/core/toolsContract.test.ts
npm run build
```

---

## Recipe 2：新增 citation expansion 参数或字段

### 适用场景

扩展 `get_paper_citations` / `get_paper_references` 的入参或返回字段。

### 先读

- `docs/capabilities/citation-expansion.zh.md`
- `docs/contracts/cli-tools-contract.zh.md`
- `docs/contracts/json-output-contract.zh.md`

### 改动文件

```text
src/core/schemas.ts
src/core/tools.ts
src/core/handleToolCall.ts
src/services/CitationService.ts
tests/core/schemas.test.ts
tests/core/handleToolCall.test.ts
tests/core/toolsContract.test.ts
skills/paper-search/references/cli-contract.md
```

### 步骤

1. 更新 schema，保留 `paperId > doi > arxivId` 优先级。
2. 更新 `TOOLS` inputSchema。
3. 更新 handler 或 service mapping。
4. 更新 JSON contract，如输出结构变化。
5. 更新 Skill CLI contract 和 README 示例。
6. 补测试。

### 禁止

- 不把 citation expansion 写成关键词检索。
- 不把 Semantic Scholar Graph citation API 混入普通 metadata search 平台。
- 不改变 `relation`、`provider`、`total` 语义而不更新 contract。

### 必跑测试

```bash
npm test -- --runInBand tests/core/schemas.test.ts tests/core/handleToolCall.test.ts tests/core/toolsContract.test.ts tests/skills/SkillContract.test.ts
npm run build
```

---

## Recipe 3：新增 PDF fallback tier

### 适用场景

新增一个下载层，例如未来 `institutional_access`。

### 先读

- `docs/capabilities/pdf-discovery.zh.md`
- `docs/dependencies/pdf-download-infrastructure.zh.md`
- `docs/roadmap/FUTURE_INSTITUTIONAL_ACCESS.zh.md`，如果涉及机构访问

### 改动文件

```text
src/services/OpenAccessFallbackService.ts
src/services/... 或 capabilities/pdf-discovery/tiers/*
tests/services/OpenAccessFallbackService.test.ts
```

### 步骤

1. 实现 `DownloadTier`。
2. 使用 `insertDownloadTierBefore(createDefaultDownloadTiers(), 'scihub', newTier)` 插入。
3. 默认不得启用 future-only tier。
4. attempts item 保持 `{ stage, status, message }`。
5. 所有 URL、cookie、token、session 信息脱敏。
6. 补顺序和 skipped 测试。

### 禁止

- 不默认启用 `institutional_access`。
- 不让 CLI 接收账号、密码、cookie、token。
- 不把机构访问写成 Open Access。
- 不删除 Sci-Hub fallback。

### 必跑测试

```bash
npm test -- --runInBand tests/services/OpenAccessFallbackService.test.ts tests/core/toolsContract.test.ts
npm run build
```

---

## Recipe 4：迁移一个平台到 HttpClient

### 适用场景

把某个平台适配器从直接 axios 请求迁移到统一 `HttpClient`。

### 先读

- `docs/dependencies/http-infrastructure.zh.md`
- 该平台所属 capability 文档
- `docs/dependencies/platform-adapters.zh.md`

### 改动文件

```text
src/utils/HttpClient.ts
src/core/httpPolicies.ts
src/platforms/XxxSearcher.ts
tests/platforms/XxxSearcher.test.ts 或相关测试
```

### 步骤

1. 为平台补充 `HTTP_POLICIES[platformId]`。
2. 让 Searcher 接收 `HttpClient` 或内部创建 policy client。
3. 保留现有输入输出行为。
4. 对 429、timeout、网络错误做与原行为兼容的处理。
5. 写 mock 测试，不依赖真实网络。
6. 不迁移无关平台。

### 禁止

- 不一次性迁移所有平台。
- 不让日志打印敏感 query 参数。
- 不改变外部 JSON 输出。

### 必跑测试

```bash
npm test -- --runInBand
npm run build
```

---

## Recipe 5：迁移一个 capability 到独立目录

### 适用场景

把 `services/` 或 `core/` 中某个能力的代码搬到 `src/capabilities/<name>/`。

### 先读

- 对应 `docs/capabilities/*.zh.md`
- `docs/contracts/test-contracts.zh.md`

### 推荐顺序

1. `journal-metrics`
2. `citation-expansion`
3. `pdf-discovery`
4. `body-snippet-search`
5. `metadata-search`
6. `management-layer`

### 步骤

1. 新建 capability 目录。
2. 先用 `index.ts` re-export 原实现，保证无行为变化。
3. 移动 service / handler / schemas / types。
4. 更新 imports。
5. 保留旧路径 compatibility re-export，或者一次性更新所有引用。
6. 跑契约测试。
7. 只有测试通过后，再删除旧文件。

### 禁止

- 不在目录迁移中改变工具名、schema、JSON 输出。
- 不把 shared registry、platforms、HttpClient、Paper 模型搬进某个 capability。
- 不让 capability import management。

### 必跑测试

```bash
npm test -- --runInBand
npm run build
```

---

## Recipe 6：修改 Skill 或 README

### 适用场景

更新 Agent 说明、CLI contract、README 功能表或 examples。

### 先读

- `docs/dependencies/skill-distribution.zh.md`
- `docs/contracts/skill-contract.zh.md`
- `docs/contracts/cli-tools-contract.zh.md`

### 步骤

1. 确认实际 `TOOLS` 和 CLI 行为。
2. 更新 Skill reference，而不是把全部细节塞进 `SKILL.md`。
3. README 只写当前能力，不写 future-only 能力。
4. 更新 `SkillContract.test.ts`。

### 禁止

- 不把 future WebVPN / CARSI / EZProxy 写成当前能力。
- 不让用户把 secret 粘贴到聊天或 Skill。
- 不让 Skill 变成实现细节文档。

### 必跑测试

```bash
npm test -- --runInBand tests/skills/SkillContract.test.ts
```

---

## Recipe 7：修改 Capability Profile

### 适用场景

调整 doctor/status 中能力可用性判断。

### 先读

- `docs/capabilities/management-layer.zh.md`
- `docs/contracts/capability-profile-contract.zh.md`
- `docs/dependencies/platform-registry.zh.md`

### 步骤

1. 确认能力名集合不变，除非明确契约改动。
2. 确认 free / entitled / open access / Sci-Hub 分组语义。
3. 如果改 source group，尽量从 platform metadata 派生。
4. 更新测试和 docs。

### 禁止

- 不把 Sci-Hub 放入 `metadata_search`。
- 不把 Sci-Hub 放入 `open_access_sources`。
- 不让某个 key 缺失导致所有能力不可用。

### 必跑测试

```bash
npm test -- --runInBand tests/core/capabilityProfile.test.ts
npm run build
```
