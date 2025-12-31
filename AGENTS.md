# AGENTS.md - Nacos Desktop Console 项目指南

> 本文档为 AI 代理（Agents）提供项目结构、开发规范和最佳实践指引

## 📋 项目概述

### 项目描述

**Nacos Desktop Console** 是基于 Vue 3.5 + TypeScript + JSX + Composition API + Tauri 2.0 + SQLite 重新实现的 Nacos Web Console 桌面版本。

**项目目标**：将原 React + Redux + @alifd/next 实现的 Nacos Console UI 迁移到 Vue 3.5 + Pinia + Element Plus，使用 JSX/TSX 语法和 Composition API，提供更好的开发体验和用户体验。

### 核心信息

- **项目名称**: nacosdesk
- **技术栈**: Vue 3.5 + TypeScript + JSX + Element Plus + UnoCSS + Pinia + Tauri 2.0 + SQLite
- **API 端口**: 8080 (Nacos 3 Web Console)
- **开发服务器**: http://localhost:5174
- **包管理器**: pnpm（**必须使用 pnpm，不要使用 npm 或 yarn**）

### 项目特点

- ✅ **完全使用 JSX/TSX** - 所有组件使用 `.tsx` 文件，禁止使用 `.vue` 文件
- ✅ **Composition API** - 所有组件使用 `defineComponent` + `setup`
- ✅ **TypeScript** - 完整的类型安全支持
- ✅ **国际化** - 支持中文和英文，使用 Vue I18n
- ✅ **现代化工具链** - Vite + UnoCSS + Element Plus 自动导入
- ✅ **PWA 支持** - 渐进式 Web 应用
- ✅ **Tauri 2.0** - 跨平台桌面应用框架
- ✅ **SQLite** - 嵌入式数据库支持

### Nacos Web Console 核心功能模块

本项目完全重新实现了 Nacos Web Console 的所有核心功能：

#### 1. 配置管理模块（Configuration Management）
- **功能**：配置的创建、编辑、查询、同步、回滚和历史版本管理
- **页面**：
  - 配置列表（ConfigurationManagement）
  - 新建配置（NewConfig）
  - 配置编辑（ConfigEditor）
  - 配置详情（ConfigDetail）
  - 配置同步（ConfigSync）
  - 配置回滚（ConfigRollback）
  - 历史版本列表（HistoryRollback）
  - 历史版本详情（HistoryDetail）
  - 监听查询（ListeningToQuery）
- **技术要点**：
  - Monaco Editor 代码编辑器
  - 内容验证（JSON/XML/YAML/Properties/TOML）
  - MD5 验证和内容校验
  - Diff Editor 版本对比
  - 配置同步（跨命名空间）
  - 配置历史版本管理
  - 配置变更监听

#### 2. 服务管理模块（Service Management）
- **功能**：服务注册与发现管理、实例管理、集群管理、订阅者查询
- **页面**：
  - 服务列表（ServiceList）
  - 服务详情（ServiceDetail，含实例管理、集群管理）
  - 订阅者列表（SubscriberList）
- **技术要点**：
  - 服务元数据管理
  - 实例权重和状态管理
  - 实例健康检查配置
  - 实例注册和注销
  - 订阅者监控
  - 服务集群管理

#### 3. 命名空间管理模块（Namespace Management）
- **功能**：多环境隔离、命名空间的创建、编辑和删除
- **页面**：
  - 命名空间列表（Namespace）
- **技术要点**：
  - 命名空间隔离（配置和服务隔离）
  - 公共命名空间保护
  - 命名空间存在性检查
  - 级联删除（删除命名空间时删除相关配置和服务）

#### 4. 权限控制模块（Authority Control）
- **功能**：用户管理、角色管理、权限管理，实现细粒度的访问控制
- **页面**：
  - 用户管理（UserManagement）
  - 角色管理（RolesManagement）
  - 权限管理（PermissionsManagement）
- **技术要点**：
  - 用户 CRUD（创建、读取、更新、删除）
  - 用户密码修改和重置
  - 用户启用/禁用
  - 角色绑定和分配
  - 权限分配和检查
  - Token 管理（存储、验证、刷新、过期处理）
  - 命名空间权限控制（可选）

#### 5. 集群管理模块（Cluster Management）
- **功能**：集群节点管理、节点状态查看、节点离开集群
- **页面**：
  - 集群节点列表（ClusterNodeList）
- **技术要点**：
  - 节点状态监控
  - 节点信息展示
  - 集群操作（节点加入/离开）
  - 集群配置管理

#### 6. 设置中心模块（Setting Center）
- **功能**：应用设置、主题切换、语言切换、命名空间显示模式配置
- **页面**：
  - 设置中心（SettingCenter）
- **技术要点**：
  - 本地存储持久化
  - 主题切换（亮色/暗色）
  - 国际化切换（中文/英文）
  - 命名空间显示模式配置

#### 7. AI 功能模块（可选）
- **MCP 管理**：MCP 服务器管理、工具管理、导入导出
- **Agent 管理**：Agent 管理、配置管理、运行状态监控
- **技术要点**：MCP 协议支持、Agent 生命周期管理、配置管理

---

## 🏗️ 技术架构

### 核心技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.5.13 | 前端框架 |
| TypeScript | 5.9.3 | 类型系统 |
| JSX/TSX | - | 组件模板语法（**必须使用**） |
| Element Plus | 2.12.0 | UI 组件库 |
| UnoCSS | 66.5.12 | 原子化 CSS |
| Pinia | 3.0.4 | 状态管理 |
| Vue Router | 4.6.4 | 路由管理 |
| Vue I18n | 9.14.5 | 国际化 |
| Vite | 7.2.7 | 构建工具 |
| Monaco Editor | 0.55.1 | 代码编辑器 |
| Tauri | 2.0 | 桌面应用框架 |
| SQLite | - | 嵌入式数据库 |
| PWA | - | 渐进式 Web 应用 |

### 关键配置

- **JSX 支持**: `@vitejs/plugin-vue-jsx` + `jsx: "preserve"` + `jsxImportSource: "vue"`
- **自动导入**: Element Plus 组件和 API 自动导入，无需手动引入
- **路径别名**: `@/` 指向 `src/` 目录
- **类型检查**: 严格的 TypeScript 配置
- **PWA**: `vite-plugin-pwa` 配置
- **Tauri**: `src-tauri/` 目录包含 Rust 后端代码

---

## 📁 项目结构

```
nacosdesk/
├── src/
│   ├── api/                      # API 服务层
│   │   ├── auth.ts              # 认证相关 API（支持 Tauri/HTTP 切换）
│   │   ├── configuration.ts     # 配置管理 API
│   │   ├── namespace.ts         # 命名空间 API
│   │   ├── service.ts           # 服务管理 API
│   │   ├── authority.ts         # 权限管理 API
│   │   ├── cluster.ts           # 集群管理 API
│   │   └── ai.ts                # AI 功能 API
│   ├── components/              # 通用组件（TSX）
│   ├── composables/             # Composition API 组合式函数
│   │   ├── useI18n.ts          # 国际化 composable
│   │   └── useLoading.ts       # Loading 管理 composable
│   ├── layouts/                 # 布局组件（TSX）
│   ├── locales/                 # 国际化语言包
│   ├── router/                  # 路由配置
│   ├── stores/                  # Pinia 状态管理
│   ├── types/                   # TypeScript 类型定义
│   ├── utils/                   # 工具函数
│   │   ├── request.ts          # HTTP 客户端
│   │   ├── tauriApi.ts         # Tauri API 工具
│   │   └── ...
│   ├── views/                   # 页面组件（TSX）
│   ├── App.tsx                  # 根组件
│   └── main.ts                  # 入口文件
├── src-tauri/                   # Tauri Rust 后端
│   ├── src/
│   │   ├── main.rs             # Rust 主程序
│   │   ├── db/                 # 数据库模块
│   │   │   ├── mod.rs
│   │   └── schema.sql          # 数据库 schema
│   │   └── auth/               # 认证模块
│   │       └── mod.rs
│   ├── Cargo.toml              # Rust 依赖配置
│   └── tauri.conf.json         # Tauri 应用配置
├── public/                      # 静态资源
│   ├── manifest.json           # PWA 清单文件
│   └── img/                    # 图片资源
├── .husky/                      # Git hooks
│   ├── pre-commit              # Pre-commit hook
│   └── commit-msg              # Commit-msg hook
├── uno.config.ts                # UnoCSS 配置
├── vite.config.ts               # Vite 配置（包含 JSX 插件和 PWA）
├── tsconfig.json                 # TypeScript 配置
├── commitlint.config.cjs        # Commit 消息规范配置
└── package.json
```

---

## 🎯 核心开发规范

### ⚠️ 重要规则（必须遵守）

#### 1. 必须使用 JSX/TSX 语法

- ❌ **禁止使用 `.vue` 文件**
- ❌ **禁止使用 `<template>` 模板语法**
- ❌ **禁止使用 `<script setup>`**
- ✅ **所有组件必须使用 `.tsx` 扩展名**
- ✅ **所有组件必须使用 `defineComponent` + `setup`**

#### 2. 必须使用 Composition API

- ✅ 使用 `ref`, `reactive`, `computed` 定义响应式状态
- ✅ 使用 `watch`, `watchEffect` 监听变化
- ✅ 使用 `onMounted`, `onUnmounted` 等生命周期钩子
- ✅ 使用 composables 封装可复用逻辑

#### 3. 必须使用 TypeScript

- ✅ 所有文件使用 TypeScript
- ✅ 定义明确的类型接口
- ✅ 避免使用 `any`，优先使用具体类型
- ✅ Props 必须定义类型

#### 4. 必须使用国际化

- ✅ 所有用户可见文本使用 `t()` 函数
- ✅ 动态文本使用 `tWithParams()` 函数
- ❌ 禁止硬编码中文或英文文本

#### 5. 必须使用 UnoCSS

- ✅ 优先使用 UnoCSS 原子类
- ✅ 使用快捷方式减少重复代码
- ❌ 禁止使用 `<style>` 标签
- ❌ 禁止使用 SCSS/LESS

#### 6. 必须使用 pnpm

- ✅ 使用 `pnpm install` 安装依赖
- ✅ 使用 `pnpm add` 添加依赖
- ❌ 禁止使用 `npm` 或 `yarn`

#### 7. 必须遵循 Git 规范

- ✅ 使用 Conventional Commits 规范
- ✅ 使用 `pnpm commit` 进行交互式提交
- ✅ Commit 消息必须通过 Commitlint 检查

---

## 💻 代码风格和模式

### 组件定义标准模式

```tsx
/**
 * 组件名称
 * 使用 Vue 3 JSX + Composition API
 */

import { defineComponent, ref, computed } from 'vue'
import { ElButton, ElInput } from 'element-plus'
import { useI18n } from '@/composables/useI18n'

interface ComponentProps {
  title: string
  count?: number
}

export default defineComponent<ComponentProps>({
  name: 'ComponentName',
  props: {
    title: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  setup(props, { expose }) {
    const { t } = useI18n()
    const visible = ref(false)
    const displayText = computed(() => `${props.title}: ${props.count}`)
    
    const handleClick = () => {
      visible.value = true
    }
    
    expose({
      open: () => visible.value = true,
    })
    
    return () => (
      <div class="component-container">
        <h1>{displayText.value}</h1>
        <ElButton type="primary" onClick={handleClick}>
          {t('common.submit')}
        </ElButton>
      </div>
    )
  },
})
```

### JSX 语法要点

**条件渲染**：
```tsx
{condition && <div>Content</div>}
{condition ? <div>True</div> : <div>False</div>}
```

**列表渲染**：
```tsx
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}
```

**事件处理**：
```tsx
<ElButton onClick={handleClick}>按钮</ElButton>
<ElInput onUpdate:modelValue={(val: string) => (value.value = val)} />
```

**v-model 双向绑定**：
```tsx
<ElInput
  modelValue={value.value}
  onUpdate:modelValue={(val: string) => (value.value = val)}
/>
```

### Pinia Store 标准模式

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchData } from '@/api/example'

export const useExampleStore = defineStore('example', () => {
  const data = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const count = computed(() => data.value.length)
  
  async function fetch() {
    loading.value = true
    error.value = null
    try {
      const res = await fetchData()
      data.value = res.data || []
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  return { data, loading, error, count, fetch }
})
```

### API 调用（支持 Tauri/HTTP 切换）

```typescript
import { isTauri, tauriLogin } from '@/utils/tauriApi'
import httpClient from '@/utils/request'

export async function login(params: LoginParams): Promise<LoginResponse> {
  // 自动检测环境，Tauri 环境使用本地 API，Web 环境使用 HTTP
  if (isTauri()) {
    return tauriLogin(params.username, params.password)
  } else {
    return httpClient.post('/v3/auth/user/login', params)
  }
}
```

---

## 🎨 样式规范

### UnoCSS 使用规范

```tsx
// ✅ 使用原子类
<div class="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h1 class="text-2xl font-bold text-gray-800">标题</h1>
</div>

// ✅ 使用快捷方式
<div class="flex-center">  // 等同于 flex items-center justify-center

// ✅ 响应式设计
<div class="w-full md:w-1/2 lg:w-1/3">
```

---

## 🌐 国际化规范

```tsx
import { useI18n } from '@/composables/useI18n'

const { t, tWithParams } = useI18n()

return () => (
  <div>
    <h1>{t('config.title')}</h1>
    <p>{tWithParams('config.confirmDelete', { dataId: 'example' })}</p>
  </div>
)
```

---

## 🔧 常见任务指南

### 创建新组件

1. 创建 `src/components/NewComponent/index.tsx`
2. 使用标准模式（`defineComponent` + `setup`）
3. 使用国际化函数

### 创建新页面

1. 创建 `src/views/NewPage/index.tsx`
2. 在 `src/router/index.ts` 中添加路由
3. 使用 MainLayout（登录页除外）

### 创建新 Store

1. 创建 `src/stores/newStore.ts`
2. 使用 Setup Store 模式
3. 在组件中使用 `useNewStore()` 和 `storeToRefs()`

### 添加 API 接口

1. 在 `src/api/` 目录创建或更新文件
2. 支持 Tauri/HTTP 环境切换（如需要）
3. 在 Store 中使用

### 添加国际化文本

1. 在 `src/locales/zh-CN.ts` 和 `src/locales/en-US.ts` 中添加翻译
2. 在组件中使用 `t()` 或 `tWithParams()`

---

## 🚫 禁止事项

1. ❌ 不要使用 `.vue` 文件
2. ❌ 不要使用模板语法（`<template>`, `v-if`, `v-for`）
3. ❌ 不要使用 `<script setup>`
4. ❌ 不要硬编码文本
5. ❌ 不要使用 `<style>` 标签
6. ❌ 不要使用 npm/yarn
7. ❌ 不要使用 `any` 类型
8. ❌ 不要在渲染函数中直接计算（使用 `computed`）
9. ❌ 不要直接修改 props（使用 `emit`）
10. ❌ 不要忘记类型定义

---

## ✅ 推荐做法

1. **组件命名**：`PascalCase.tsx`（如 `UserManagement.tsx`）
2. **类型定义**：在 `src/types/` 目录统一管理
3. **错误处理**：在 Store 中统一处理
4. **性能优化**：使用 `computed` 缓存计算结果
5. **代码组织**：相关功能放在同一目录
6. **代码注释**：组件顶部添加文件说明

---

## 🔍 调试和开发

### 开发命令

```bash
# Web 开发
pnpm dev

# Tauri 开发
pnpm tauri:dev

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 构建
pnpm build
pnpm tauri:build
```

### Git 工作流

```bash
# 交互式提交（推荐）
pnpm commit

# 版本发布
pnpm release
```

---

## 📚 参考资源

### 官方文档

- [Vue 3 文档](https://vuejs.org/)
- [Vue 3 JSX 文档](https://github.com/vuejs/babel-plugin-jsx)
- [Element Plus 文档](https://element-plus.org/)
- [Pinia 文档](https://pinia.vuejs.org/)
- [UnoCSS 文档](https://unocss.dev/)
- [Vue I18n 文档](https://vue-i18n.intlify.dev/)
- [Tauri 文档](https://v2.tauri.app/)
- [PWA 文档](https://web.dev/progressive-web-apps/)

### 关键文件说明

#### API 层
- `src/api/auth.ts` - 认证 API（支持 Tauri/HTTP 切换）
- `src/utils/tauriApi.ts` - Tauri API 工具

#### Store 层
- `src/stores/auth.ts` - 认证状态
- `src/stores/configuration.ts` - 配置管理状态

#### 工具函数
- `src/utils/request.ts` - HTTP 客户端
- `src/utils/tauriApi.ts` - Tauri API 工具
- `src/utils/validateContent.ts` - 内容验证

#### Tauri 后端
- `src-tauri/src/main.rs` - Rust 主程序
- `src-tauri/src/db/mod.rs` - 数据库模块
- `src-tauri/src/auth/mod.rs` - 认证模块

---

## 💡 AI 代理工作指南

### 代码审查清单

- [ ] 所有组件使用 `.tsx` 扩展名
- [ ] 所有组件使用 `defineComponent` + `setup`
- [ ] 所有用户可见文本使用 `t()` 或 `tWithParams()`
- [ ] 所有 Props 定义了类型
- [ ] 没有使用 `any` 类型
- [ ] 没有使用 `<style>` 标签
- [ ] 没有硬编码文本
- [ ] 类型检查通过
- [ ] 代码可以正常运行
- [ ] Commit 消息符合规范

---

**最后更新**: 2024-12-31

**维护者**: 开发团队
