# Contract: Test Matrix

本文记录不同改动类型必须运行的测试。Agent 修改代码或文档时，应按影响面选择测试，而不是只运行最小单测。

---

## 1. 通用命令

最终合并前推荐：

```bash
npm test -- --runInBand
npm run build
```

如果无法运行，PR 必须说明原因和风险。

---

## 2. 改动到测试映射

| 改动类型 | 必跑测试 |
|---|---|
| 工具名 / inputSchema | `tests/core/toolsContract.test.ts`, `tests/core/schemas.test.ts`, `tests/skills/SkillContract.test.ts` |
| `parseToolArgs` | `tests/core/schemas.test.ts`, `tests/core/toolsContract.test.ts` |
| `handleToolCall` | `tests/core/handleToolCall.test.ts` |
| citation expansion | `tests/core/schemas.test.ts`, `tests/core/handleToolCall.test.ts`, `tests/core/toolsContract.test.ts` |
| PDF fallback / DownloadTier | `tests/services/OpenAccessFallbackService.test.ts`, `tests/core/toolsContract.test.ts` |
| platform metadata / aliases | `tests/core/platformMetadata.test.ts`, `tests/core/toolsContract.test.ts` |
| capability profile | `tests/core/capabilityProfile.test.ts` |
| Skill / README CLI contract | `tests/skills/SkillContract.test.ts` |
| Config / secrets | config tests if present, `tests/core/capabilityProfile.test.ts` |
| HttpClient / HTTP policy | affected platform tests, plus `npm test -- --runInBand` if broad |
| Paper model / serialization | `tests/core/handleToolCall.test.ts`, metadata output tests if present |
| dist build output | `npm run build` |

---

## 3. Contract tests currently protecting behavior

| 测试 | 保护内容 |
|---|---|
| `tests/core/toolsContract.test.ts` | 工具名集合和 schema surface |
| `tests/core/platformMetadata.test.ts` | alias、generic descriptors、default all sources |
| `tests/core/capabilityProfile.test.ts` | 六个 capability profile entries 和分组语义 |
| `tests/services/OpenAccessFallbackService.test.ts` | fallback 顺序、tier 注入、Sci-Hub skipped、Unpaywall 缺失保护 |
| `tests/core/schemas.test.ts` | schema 校验规则 |
| `tests/core/handleToolCall.test.ts` | handler 分发和 JSON data |
| `tests/skills/SkillContract.test.ts` | Skill references 与 `TOOLS` 同步 |

---

## 4. 新增测试原则

- 外部 API 测试必须 mock。
- 不把 live network 作为单元测试依赖。
- 对 contract 行为写稳定断言，不只检查数量。
- 对 secret 相关输出检查脱敏。
- 对 future-only 参数检查“不存在”。

---

## 5. 常见必测组合

### 新增平台

```bash
npm test -- --runInBand tests/core/platformMetadata.test.ts tests/core/toolsContract.test.ts
npm run build
```

### 改 PDF fallback

```bash
npm test -- --runInBand tests/services/OpenAccessFallbackService.test.ts tests/core/toolsContract.test.ts
npm run build
```

### 改 Skill

```bash
npm test -- --runInBand tests/skills/SkillContract.test.ts
```

### 改能力画像

```bash
npm test -- --runInBand tests/core/capabilityProfile.test.ts
npm run build
```
