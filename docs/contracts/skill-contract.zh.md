# Contract: Skill

Skill contract 保证 Bundled Skill、Skill references、README 和实际 CLI 能力一致。Skill 是 Agent routing 文档，不是实现说明，也不是配置存储。

---

## 1. 当前 Skill 文件

| 文件 | 职责 |
|---|---|
| `skills/paper-search/SKILL.md` | Routing Skill 主入口 |
| `skills/paper-search/references/cli-contract.md` | CLI 命令、direct tools、输出和配置边界 |
| `skills/paper-search/references/capability-routing.md` | 用户意图到能力的路由规则 |
| `skills/paper-search/references/management-layer.md` | doctor/smoke/config/skills 管理命令 |

---

## 2. 同步触发条件

必须同步 Skill 的情况：

- `TOOLS` 工具名变化。
- 工具 inputSchema 变化。
- top-level CLI 命令变化。
- Capability map 变化。
- JSON 输出结构变化。
- 配置和 setup 流程变化。
- 下载边界变化。

---

## 3. 不变量

- `SKILL.md` 保持短，只做路由和边界说明。
- 详细命令放在 references。
- Direct Run Tools 必须与 `TOOLS` 同步。
- Skill 不保存私密配置值。
- Future-only 能力不得写成当前能力。
- `skills update` 不等于 npm package update。

---

## 4. 修改流程

1. 先确认实际 CLI 行为和 `TOOLS`。
2. 修改对应 reference 文件。
3. 必要时修改 `SKILL.md` 功能地图。
4. 修改 README / README.zh。
5. 更新 `SkillContract.test.ts`。

---

## 5. 测试要求

```bash
npm test -- --runInBand tests/skills/SkillContract.test.ts
```

如果工具清单变化：

```bash
npm test -- --runInBand tests/core/toolsContract.test.ts tests/skills/SkillContract.test.ts
```
