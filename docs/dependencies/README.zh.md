# Dependencies Maintenance Index

本文索引共享依赖实现文档。共享依赖不属于单个 capability；它们被多个能力共同消费，改动时必须检查影响面。

---

## 共享依赖列表

| 依赖 | 文档 | 主要代码 | 影响能力 |
|---|---|---|---|
| 平台注册表 | [`platform-registry.zh.md`](./platform-registry.zh.md) | `src/core/platformMetadata.ts`, `src/core/platformFactories.ts` | metadata, pdf, management |
| 平台适配器 | [`platform-adapters.zh.md`](./platform-adapters.zh.md) | `src/platforms/*.ts`, `PaperSource` | metadata, pdf, body snippets |
| HTTP 基础设施 | [`http-infrastructure.zh.md`](./http-infrastructure.zh.md) | `src/utils/HttpClient.ts`, `src/core/httpPolicies.ts` | 所有外部请求能力 |
| PDF 下载基础设施 | [`pdf-download-infrastructure.zh.md`](./pdf-download-infrastructure.zh.md) | `src/utils/PdfDownload.ts`, `PDFExtractor` | pdf discovery |
| Paper 模型 | [`paper-model.zh.md`](./paper-model.zh.md) | `src/models/Paper.ts` | metadata, pdf, JSON output |
| 配置与密钥 | [`config-and-secrets.zh.md`](./config-and-secrets.zh.md) | `src/config/ConfigService.ts` | management, all key-backed capabilities |
| Skill 分发 | [`skill-distribution.zh.md`](./skill-distribution.zh.md) | `src/skills/SkillInstaller.ts`, `skills/paper-search/` | management, Agent routing |

---

## 维护原则

1. 改共享依赖前先判断所有消费者。
2. 新增共享字段或行为时，更新依赖文档和相关 contract。
3. 不能让共享依赖依赖某个 capability 的内部实现。
4. 不能让 capability 通过共享依赖绕过自己的边界。
5. 涉及 secrets、HTTP、下载和 Skill 的改动必须考虑脱敏。

---

## 影响面判断

| 改动 | 必须检查 |
|---|---|
| `platformMetadata` 字段 | platform metadata tests, tools contract, capability profile |
| `platformFactories` | Searcher 初始化、alias 指向、build |
| `PaperSource` | 所有 platform adapters |
| `HttpClient` | 外部请求、proxy、rate limit、cache、retry |
| `Paper` 模型 | JSON 输出和所有 Searcher |
| `ConfigService` | doctor/config/setup/secrets |
| Skill installer | SkillContract tests 和安装路径安全 |
