# Contracts Maintenance Index

契约文档记录对外可依赖的行为。Agent 修改工具、schema、JSON 输出、Capability Profile、Skill 或测试时，必须先读本目录。

---

## 契约列表

| 契约 | 文档 | 保护内容 |
|---|---|---|
| CLI tools | [`cli-tools-contract.zh.md`](./cli-tools-contract.zh.md) | 工具名、schema、generic/special tool 边界 |
| JSON output | [`json-output-contract.zh.md`](./json-output-contract.zh.md) | `paper-search run` 包装和各能力 data 结构 |
| Capability Profile | [`capability-profile-contract.zh.md`](./capability-profile-contract.zh.md) | 六个能力项、状态语义、source group |
| Skill | [`skill-contract.zh.md`](./skill-contract.zh.md) | Bundled Skill 与 CLI 同步 |
| Tests | [`test-contracts.zh.md`](./test-contracts.zh.md) | 修改类型到必跑测试的映射 |

---

## 改动等级

| 改动 | 等级 | 要求 |
|---|---|---|
| 内部重构但输出不变 | S1/S2 | 跑契约测试 |
| 改工具 schema | S3 | 更新 CLI tools contract、Skill、README、测试 |
| 改 JSON 输出 | S3 | 更新 JSON output contract 和 handler 测试 |
| 改 Capability Profile | S3 | 更新 profile contract、doctor/status 文档、测试 |
| 改 Skill | S3 | 更新 Skill contract 和 SkillContract 测试 |

---

## 核心原则

- 对外契约可以扩展，但不能无测试地破坏。
- 任何 S3 改动必须在 PR 中明确声明。
- 如果只是代码目录迁移，应保持本目录所有契约不变。
