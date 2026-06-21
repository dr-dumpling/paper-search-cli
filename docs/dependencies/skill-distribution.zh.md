# Dependency: Skill Distribution

Skill 分发负责把随包发布的 Routing Skill 安装到 Agent 运行时目录，并保持 CLI、Skill reference 和 README 的契约同步。

---

## 1. 职责

- 管理 Bundled Skill。
- 安装 / 更新 Installed Skill。
- 比对 managed Skill files。
- 保留用户 extra files。
- 让 Agent 知道何时调用 CLI。
- 维护 Skill references：CLI contract、capability routing、management layer。

---

## 2. 主要代码和文件

| 文件 | 职责 |
|---|---|
| `src/skills/SkillInstaller.ts` | Skill status / diff / update / target handling |
| `skills/paper-search/SKILL.md` | Routing Skill 主入口 |
| `skills/paper-search/references/cli-contract.md` | 稳定 CLI 表面和 direct tools |
| `skills/paper-search/references/capability-routing.md` | 用户意图到能力的路由 |
| `skills/paper-search/references/management-layer.md` | doctor/smoke/config/skills 使用规则 |
| `tests/skills/SkillContract.test.ts` | Skill 与源码契约同步测试 |

---

## 3. Skill 文档边界

`SKILL.md` 应保持短，负责：

- 描述何时调用 `paper-search`。
- 指向 focused references。
- 强调证据、配置和下载边界。

详细命令、工具名、管理命令和能力路由应放在 `references/` 中。

---

## 4. 修改 Skill 的触发条件

必须同步 Skill / references 的情况：

- 新增或删除 direct run tool。
- 修改工具 schema。
- 修改 top-level CLI 命令。
- 修改能力地图。
- 修改下载边界。
- 修改配置管理方式。
- 修改 package update / skill update 流程。

---

## 5. 禁止事项

- 不把私密配置值写入 Skill。
- 不把 future-only 能力写成当前能力。
- 不让 Skill 变成实现细节文档。
- 不在 Skill update 时删除用户 extra files。
- 不让 `skills update` 被描述成 npm package update。

---

## 6. 测试要求

```bash
npm test -- --runInBand tests/skills/SkillContract.test.ts
```

如果改 `TOOLS`，还必须跑：

```bash
npm test -- --runInBand tests/core/toolsContract.test.ts tests/skills/SkillContract.test.ts
```

---

## 7. Agent checklist

- [ ] Skill Direct Run Tools 与 `TOOLS` 同步。
- [ ] Skill 能力地图与 README 和 docs/capabilities 一致。
- [ ] Skill 没有保存私密配置值。
- [ ] Future-only 能力只在 roadmap 中出现。
- [ ] Management commands 的说明不与 CLI help 冲突。
