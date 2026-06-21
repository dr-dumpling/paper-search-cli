# Capability: management_layer

`management_layer` 是友好管理支线，负责配置、健康检查、能力画像、smoke、Skill 同步和工具发现。它不执行文献任务本身。

---

## 1. 当前职责

- 管理用户配置和密钥来源。
- 输出 doctor / status 健康报告。
- 构建 Capability Profile。
- 执行 mock / live smoke 检查。
- 安装、检查、diff、更新 Bundled Skill。
- 列出 direct run tools。
- 输出诊断建议。

---

## 2. 不负责什么

- 不执行论文搜索。
- 不下载 PDF。
- 不查询 citation graph。
- 不查询 journal metrics。
- 不保存真实密钥到 Skill。
- 不让用户在聊天或 Skill 中粘贴 secrets。

---

## 3. 用户入口

| 入口 | 说明 |
|---|---|
| `paper-search doctor` | 完整健康报告 |
| `paper-search status` | 平台状态 |
| `paper-search smoke --mock` | 离线 wiring 检查 |
| `paper-search smoke --live` | 小规模 live 检查 |
| `paper-search config ...` | 用户配置管理 |
| `paper-search skills status/diff/update` | Bundled Skill 同步 |
| `paper-search setup` | 配置向导 |
| `paper-search tools` | 工具清单 |
| `paper-search diagnostics` / `requirements` | 环境需求诊断 |

---

## 4. 当前代码入口

| 文件 | 职责 |
|---|---|
| `src/core/capabilityProfile.ts` | 构建能力画像 |
| `src/core/diagnostics.ts` | 诊断和 requirement status |
| `src/core/liveSmoke.ts` | live smoke 检查 |
| `src/core/textReports.ts` | human-readable report |
| `src/skills/SkillInstaller.ts` | Skill status / diff / update |
| `src/config/ConfigService.ts` | 配置文件和密钥管理 |
| `src/cli.ts` | management commands 分发 |

---

## 5. 数据流

```text
paper-search doctor --pretty
  → listConfigEntries(masked)
  → buildCapabilityProfile()
  → platform status / diagnostics
  → JSON or text report
```

```text
paper-search skills update --targets agents
  → discover target paths
  → compare Bundled Skill and Installed Skill
  → update managed files
  → preserve extra files
```

---

## 6. 消费的共享依赖

| 依赖 | 文档 | 使用方式 |
|---|---|---|
| 配置与密钥 | `docs/dependencies/config-and-secrets.zh.md` | 读取、写入、脱敏用户配置 |
| Skill 分发 | `docs/dependencies/skill-distribution.zh.md` | Bundled Skill 安装与同步 |
| 平台注册表 | `docs/dependencies/platform-registry.zh.md` | 读取平台能力和分组 |
| Capability Profile 契约 | `docs/contracts/capability-profile-contract.zh.md` | 保持能力名和状态语义 |
| Skill 契约 | `docs/contracts/skill-contract.zh.md` | 保持 Skill 与 CLI 同步 |

---

## 7. 不允许的依赖

- management layer 可以读取 capability 状态，但 capability 不得 import management。
- management layer 不应实现 metadata search、PDF fallback、citation expansion、journal metrics 或 body snippets。
- management layer 不得输出未脱敏 secret。

---

## 8. 扩展方式

### 新增健康检查

1. 判断是 mock 还是 live。
2. mock 不访问外部网络。
3. live 必须小规模、可降级、带 remediation。
4. 不下载 PDF，除非用户明确请求且能力边界允许。
5. 更新 diagnostics / smoke 测试。

### 新增 Capability Profile entry

这是 S3 契约改动。必须同时更新：

- `docs/contracts/capability-profile-contract.zh.md`
- `tests/core/capabilityProfile.test.ts`
- Skill / README 能力地图
- doctor/status 输出说明

---

## 9. 测试要求

必跑：

```bash
npm test -- --runInBand tests/core/capabilityProfile.test.ts tests/skills/SkillContract.test.ts
npm run build
```

如果改 config：

```bash
npm test -- --runInBand tests/config
```

如果改 Skill installer：

```bash
npm test -- --runInBand tests/skills
```

---

## 10. Agent checklist

- [ ] 管理层没有实现文献任务。
- [ ] 功能模块没有反向依赖 management。
- [ ] doctor/config 输出已脱敏。
- [ ] smoke live 检查小规模且可降级。
- [ ] Skill update 不删除用户 extra files。
- [ ] Capability Profile 能力名和状态契约未破坏。
