# Git 规范配置

本文档说明项目的 Git 提交规范和版本管理配置。

## 📋 Git 规范工具

项目使用以下 Git 规范工具：

- **Husky** - Git hooks 管理（`.husky/` 目录）
- **Commitlint** - Commit 消息规范检查（`commitlint.config.cjs`）
- **Commitizen** - 交互式 Commit 工具（`pnpm commit`）
- **Standard Version** - 版本管理（`pnpm release`）

---

## 📝 Commit 消息规范

使用 **Conventional Commits** 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型（type）

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响代码运行）
- `refactor`: 重构（既不是新功能也不是修复 bug）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关
- `ci`: CI 配置
- `build`: 构建系统

### 作用域（scope，可选）

- `config`: 配置相关
- `api`: API 相关
- `ui`: UI 组件相关
- `store`: Store 相关
- `router`: 路由相关
- `tauri`: Tauri 后端相关
- `db`: 数据库相关

### 主题（subject）

- 使用祈使句，现在时态
- 首字母小写
- 结尾不加句号
- 不超过 50 个字符

### 示例

```
feat(config): 添加配置同步功能

实现跨命名空间配置同步，支持批量同步和冲突处理

Closes #123
```

```
fix(api): 修复配置删除时的级联删除问题

修复删除配置时未正确删除历史记录的问题
```

```
docs: 更新 README，添加 Nacos Web Console 功能说明
```

---

## 🛠️ 使用指南

### 交互式提交（推荐）

使用 Commitizen 进行交互式提交：

```bash
pnpm commit
```

### 手动提交

如果手动提交，确保消息符合规范：

```bash
git commit -m "feat(config): 添加配置同步功能"
```

### 版本发布

使用 Standard Version 进行版本管理和 CHANGELOG 生成：

```bash
pnpm release
```

---

## 📦 版本号规范

遵循 [语义化版本](https://semver.org/) 规范：

- **主版本号（MAJOR）**：不兼容的 API 修改
- **次版本号（MINOR）**：向下兼容的功能性新增
- **修订号（PATCH）**：向下兼容的问题修正

---

**最后更新**: 2024-12-31

