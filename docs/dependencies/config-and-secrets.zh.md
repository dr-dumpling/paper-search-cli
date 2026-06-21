# Dependency: Config And Secrets

配置与密钥管理负责把用户本机配置安全注入 CLI。任何 Agent 维护操作都不得要求用户在聊天、Skill 或文档中粘贴真实密钥。

---

## 1. 职责

- 管理用户配置文件。
- 从环境变量、`.env`、用户配置中读取配置。
- 为 `setup`、`config`、`doctor` 提供配置读写能力。
- 对 secret 输出进行脱敏。
- 提供 canonical config key 列表。

---

## 2. 主要代码

| 文件 | 职责 |
|---|---|
| `src/config/ConfigService.ts` | 配置读写、脱敏、key 校验 |
| `src/cli.ts` | `config`、`setup` 命令分发 |
| `.env.example` | 示例配置，不含真实密钥 |
| `src/core/capabilityProfile.ts` | 根据配置判断能力状态 |

---

## 3. 配置来源

优先级以代码为准，文档中应保持一致。常见来源：

1. Shell environment variables。
2. 当前目录 `.env`。
3. 用户配置文件。
4. 免费源默认能力。

---

## 4. 关键规则

- README / Skill / docs 只能写占位符，不写真实 key。
- `doctor` / `config list` / `config get` 默认必须脱敏。
- `--raw` 只用于用户本机明确请求，不应在 Agent 回复中复述 raw value。
- 新增 key 时必须更新 config key 列表、setup、doctor、README 或 Skill 说明。
- 删除 legacy key 时必须检查 `.env.example`、tests、dist、docs。

---

## 5. 被哪些能力使用

| 能力 | 配置 |
|---|---|
| citation_expansion | `SEMANTIC_SCHOLAR_API_KEY` 可选 |
| body_snippet_search | `SEMANTIC_SCHOLAR_API_KEY` 必需 |
| journal_metrics | `EASYSCHOLAR_KEY` 必需 |
| metadata_search | 多个平台可选或必需 key |
| pdf_discovery | Unpaywall email、publisher/TDM keys、Sci-Hub config 如有 |
| management_layer | 读取全部配置并输出脱敏状态 |

---

## 6. 禁止事项

- 不在聊天中要求用户发送真实 secret。
- 不把 secret 写入 Skill 文件。
- 不在测试 fixtures 中写真实 key。
- 不在 error message 中拼接完整 secret。
- 不在 docs 中记录用户本机路径中的敏感内容。

---

## 7. 测试要求

```bash
npm test -- --runInBand tests/core/capabilityProfile.test.ts tests/skills/SkillContract.test.ts
npm run build
```

如果改 `ConfigService`，还应运行 config 相关测试。
