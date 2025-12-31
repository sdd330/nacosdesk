# AGENTS.md - Nacos Desktop Console 项目指南

> 本文档为 AI 代理（Agents）提供项目结构、开发规范和最佳实践指引

## 📋 项目概述

### 项目描述

**Nacos Desktop Console** 是基于 Vue 3.5 + TypeScript + JSX + Composition API 重新实现的 Nacos Web Console 桌面版本。

**项目目标**：将原 React + Redux + @alifd/next 实现的 Nacos Console UI 迁移到 Vue 3.5 + Pinia + Element Plus，使用 JSX/TSX 语法和 Composition API，提供更好的开发体验和用户体验。

### 核心信息

- **项目名称**: nacosdesk
- **技术栈**: Vue 3.5 + TypeScript + JSX + Element Plus + UnoCSS + Pinia
- **API 端口**: 8080 (Nacos 3 Web Console)
- **开发服务器**: http://localhost:5174
- **包管理器**: pnpm（**必须使用 pnpm，不要使用 npm 或 yarn**）

### 项目特点

- ✅ **完全使用 JSX/TSX** - 所有组件使用 `.tsx` 文件，禁止使用 `.vue` 文件
- ✅ **Composition API** - 所有组件使用 `defineComponent` + `setup`
- ✅ **TypeScript** - 完整的类型安全支持
- ✅ **国际化** - 支持中文和英文，使用 Vue I18n
- ✅ **现代化工具链** - Vite + UnoCSS + Element Plus 自动导入

### 核心功能模块

#### 1. 配置管理模块
- **功能**：配置的创建、编辑、查询、同步、回滚和历史版本管理
- **页面**：配置列表、新建配置、配置编辑、配置详情、配置同步、配置回滚、历史版本列表、历史版本详情、监听查询
- **技术要点**：Monaco Editor、内容验证（JSON/XML/YAML/Properties/TOML）、MD5 验证、Diff Editor、批量操作

#### 2. 服务管理模块
- **功能**：服务注册与发现管理、实例管理、集群管理、订阅者查询
- **页面**：服务列表、服务详情（含实例管理、集群管理）、订阅者列表
- **技术要点**：服务元数据管理、实例权重和状态管理、健康检查配置、订阅者监控

#### 3. 权限管理模块
- **功能**：用户管理、角色管理、权限管理，实现细粒度的访问控制
- **页面**：用户管理、角色管理、权限管理
- **技术要点**：用户 CRUD、角色绑定、权限分配、命名空间权限控制

#### 4. 命名空间管理模块
- **功能**：多环境隔离、命名空间的创建、编辑和删除
- **页面**：命名空间列表
- **技术要点**：命名空间隔离、公共命名空间保护、命名空间存在性检查

#### 5. 集群管理模块
- **功能**：集群节点管理、节点状态查看、节点离开集群
- **页面**：集群节点列表
- **技术要点**：节点状态监控、节点信息展示、集群操作

#### 6. 设置中心模块
- **功能**：应用设置、主题切换、语言切换、命名空间显示模式配置
- **页面**：设置中心
- **技术要点**：本地存储持久化、主题切换、国际化切换

#### 7. AI 功能模块
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

### 关键配置

- **JSX 支持**: `@vitejs/plugin-vue-jsx` + `jsx: "preserve"` + `jsxImportSource: "vue"`
- **自动导入**: Element Plus 组件和 API 自动导入，无需手动引入
- **路径别名**: `@/` 指向 `src/` 目录
- **类型检查**: 严格的 TypeScript 配置

---

## 📁 项目结构

```
nacosdesk/
├── src/
│   ├── api/                      # API 服务层（62个接口）
│   │   ├── auth.ts              # 认证相关 API（5个）
│   │   ├── configuration.ts     # 配置管理 API（11个）
│   │   ├── namespace.ts         # 命名空间 API（6个）
│   │   ├── service.ts           # 服务管理 API（9个）
│   │   ├── authority.ts         # 权限管理 API（13个）
│   │   ├── cluster.ts           # 集群管理 API（2个）
│   │   └── ai.ts                # AI 功能 API（16个）
│   ├── components/              # 通用组件（17个，TSX）
│   │   ├── DeleteDialog/        # 删除确认对话框
│   │   ├── SuccessDialog/       # 成功提示对话框
│   │   ├── CloneDialog/         # 克隆对话框
│   │   ├── MonacoEditor/        # Monaco 代码编辑器
│   │   ├── PageTitle/           # 页面标题组件
│   │   ├── Copy/                # 复制组件
│   │   ├── QueryResult/        # 查询结果组件
│   │   ├── BatchHandle/         # 批量操作组件
│   │   ├── NameSpaceList/       # 命名空间选择器
│   │   ├── Page/TotalRender.tsx # 分页总数渲染
│   │   ├── DiffEditorDialog/    # 代码对比对话框
│   │   ├── ExportDialog/        # 导出对话框
│   │   ├── ImportDialog/        # 导入对话框
│   │   ├── RegionGroup/         # 区域/服务器选择组件
│   │   ├── ShowCodeing/         # 配置代码示例组件
│   │   └── DashboardCard/      # 仪表板卡片组件
│   ├── composables/             # Composition API 组合式函数
│   │   ├── useI18n.ts           # 国际化 composable
│   │   └── useLoading.ts        # Loading 管理 composable
│   ├── layouts/                 # 布局组件（TSX）
│   │   ├── MainLayout.tsx       # 主布局（侧边栏菜单）
│   │   ├── Header.tsx           # 顶部导航栏
│   │   └── menu.ts              # 菜单配置
│   ├── locales/                 # 国际化语言包
│   │   ├── zh-CN.ts             # 中文
│   │   └── en-US.ts             # 英文
│   ├── i18n/                    # Vue I18n 配置
│   │   ├── index.ts             # I18n 初始化
│   │   └── types.ts             # 类型定义
│   ├── router/                  # 路由配置（27个路由）
│   │   └── index.ts             # 路由定义和守卫
│   ├── stores/                  # Pinia 状态管理（8个）
│   │   ├── auth.ts              # 认证状态
│   │   ├── app.ts               # 应用状态
│   │   ├── configuration.ts     # 配置管理状态
│   │   ├── service.ts           # 服务管理状态
│   │   ├── authority.ts         # 权限管理状态
│   │   ├── namespace.ts        # 命名空间状态
│   │   └── ai.ts                # AI 功能状态
│   ├── types/                   # TypeScript 类型定义
│   │   └── api.ts               # API 类型定义
│   ├── utils/                   # 工具函数（9个）
│   │   ├── request.ts           # HTTP 客户端（请求/响应拦截器）
│   │   ├── storage.ts           # 本地存储封装
│   │   ├── nacosutil.ts         # Nacos 工具函数（URL 生成、参数解析）
│   │   ├── validateContent.ts   # 内容验证（JSON/XML/YAML/Properties/TOML）
│   │   ├── urlParams.ts         # URL 参数管理（hash 参数）
│   │   ├── constants.ts         # 常量定义（含 generateRandomPassword）
│   │   ├── eventBus.ts          # 全局事件总线
│   │   └── error.ts            # 错误处理
│   ├── views/                   # 页面组件（27个，TSX）
│   │   ├── Login.tsx            # 登录页
│   │   ├── Register.tsx         # 注册页（初始化管理员）
│   │   ├── Welcome.tsx          # 欢迎页
│   │   ├── ConfigurationManagement/  # 配置管理（9个页面）
│   │   │   ├── index.tsx        # 配置列表
│   │   │   ├── NewConfig.tsx    # 新建配置
│   │   │   ├── ConfigEditor.tsx # 配置编辑
│   │   │   ├── ConfigDetail.tsx # 配置详情
│   │   │   ├── ConfigSync.tsx   # 配置同步
│   │   │   ├── ConfigRollback.tsx # 配置回滚
│   │   │   ├── HistoryRollback.tsx # 历史版本列表
│   │   │   ├── HistoryDetail.tsx # 历史版本详情
│   │   │   └── ListeningToQuery.tsx # 监听查询
│   │   ├── ServiceManagement/   # 服务管理（3个页面 + 6个子组件）
│   │   │   ├── ServiceList.tsx  # 服务列表
│   │   │   ├── ServiceDetail/   # 服务详情
│   │   │   │   ├── index.tsx
│   │   │   │   └── components/  # 实例管理、集群管理组件
│   │   │   └── SubscriberList.tsx # 订阅者列表
│   │   ├── AuthorityControl/    # 权限管理（3个页面 + 3个子组件）
│   │   │   ├── UserManagement.tsx
│   │   │   ├── RolesManagement.tsx
│   │   │   ├── PermissionsManagement.tsx
│   │   │   └── components/      # 用户、角色、权限对话框组件
│   │   ├── NameSpace/            # 命名空间管理（1个页面 + 2个子组件）
│   │   │   ├── index.tsx
│   │   │   └── components/      # 新建、编辑命名空间对话框
│   │   ├── ClusterManagement/   # 集群管理（1个页面）
│   │   │   └── ClusterNodeList.tsx
│   │   ├── SettingCenter/       # 设置中心（1个页面）
│   │   │   └── index.tsx
│   │   └── AI/                  # AI 功能（7个页面）
│   │       ├── McpManagement/   # MCP 管理（4个页面）
│   │       ├── AgentManagement/ # Agent 管理（3个页面）
│   │       └── ...
│   ├── App.tsx                   # 根组件
│   ├── main.ts                   # 入口文件
│   └── style.css                 # 全局样式
├── uno.config.ts                 # UnoCSS 配置
├── vite.config.ts                # Vite 配置（包含 JSX 插件）
├── tsconfig.json                 # TypeScript 配置
├── package.json
├── README.md                     # 项目说明文档
└── AGENTS.md                     # AI 代理指南（本文件）
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

**原因**：项目已完全迁移到 JSX/TSX，所有旧的 `.vue` 文件已删除。使用 JSX 可以提供更好的灵活性和 TypeScript 支持。

#### 2. 必须使用 Composition API

- ✅ 使用 `ref`, `reactive`, `computed` 定义响应式状态
- ✅ 使用 `watch`, `watchEffect` 监听变化
- ✅ 使用 `onMounted`, `onUnmounted` 等生命周期钩子
- ✅ 使用 composables 封装可复用逻辑

**原因**：Composition API 提供更好的逻辑复用、类型推断和代码组织。

#### 3. 必须使用 TypeScript

- ✅ 所有文件使用 TypeScript
- ✅ 定义明确的类型接口
- ✅ 避免使用 `any`，优先使用具体类型
- ✅ Props 必须定义类型

**原因**：TypeScript 提供编译时类型检查，减少运行时错误，提升代码质量。

#### 4. 必须使用国际化

- ✅ 所有用户可见文本使用 `t()` 函数
- ✅ 动态文本使用 `tWithParams()` 函数
- ❌ 禁止硬编码中文或英文文本

**原因**：支持多语言，提升用户体验，便于维护。

#### 5. 必须使用 UnoCSS

- ✅ 优先使用 UnoCSS 原子类
- ✅ 使用快捷方式减少重复代码
- ❌ 禁止使用 `<style>` 标签
- ❌ 禁止使用 SCSS/LESS

**原因**：UnoCSS 按需生成，体积更小，性能更好。

#### 6. 必须使用 pnpm

- ✅ 使用 `pnpm install` 安装依赖
- ✅ 使用 `pnpm add` 添加依赖
- ❌ 禁止使用 `npm` 或 `yarn`

**原因**：项目使用 pnpm 作为包管理器，确保依赖管理的一致性。

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
    // ✅ Composition API: 使用 composable
    const { t } = useI18n()
    
    // ✅ Composition API: 使用 ref 定义响应式状态
    const visible = ref(false)
    const loading = ref(false)
    
    // ✅ Composition API: 使用 computed 派生状态
    const displayText = computed(() => 
      `${props.title}: ${props.count}`
    )
    
    // ✅ Composition API: 方法定义
    const handleClick = () => {
      visible.value = true
    }
    
    // ✅ Composition API: 使用 expose 暴露方法
    expose({
      open: () => visible.value = true,
      close: () => visible.value = false,
    })
    
    // ✅ Composition API: 返回渲染函数
    return () => (
      <div class="component-container">
        <h1>{displayText.value}</h1>
        <ElButton 
          type="primary" 
          loading={loading.value}
          onClick={handleClick}
        >
          {t('common.submit')}
        </ElButton>
      </div>
    )
  },
})
```

### JSX 语法要点

#### 条件渲染

```tsx
// ✅ 正确
{condition && <div>Content</div>}
{condition ? <div>True</div> : <div>False</div>}

// ❌ 错误
{v-if="condition"}  // Vue 模板语法，JSX 不支持
```

#### 列表渲染

```tsx
// ✅ 正确
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}

// ❌ 错误
{v-for="item in items"}  // Vue 模板语法，JSX 不支持
```

#### 事件处理

```tsx
// ✅ 正确
<ElButton onClick={handleClick}>按钮</ElButton>
<ElInput onUpdate:modelValue={(val: string) => (value.value = val)} />

// ❌ 错误
<ElButton @click="handleClick">按钮</ElButton>  // Vue 模板语法
```

#### v-model 双向绑定

```tsx
// ✅ 正确
<ElInput
  modelValue={value.value}
  onUpdate:modelValue={(val: string) => (value.value = val)}
/>

// ❌ 错误
<ElInput v-model={value.value} />  // JSX 不支持 v-model 指令
```

#### 插槽（Slots）

```tsx
// ✅ 正确
<ElDialog
  v-slots={{
    footer: () => (
      <ElButton>确定</ElButton>
    ),
  }}
>
  <div>内容</div>
</ElDialog>
```

### Pinia Store 标准模式

```typescript
/**
 * Store 名称
 * 使用 Pinia Setup Store 风格
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchData } from '@/api/example'
import type { ExampleData } from '@/types/api'

export const useExampleStore = defineStore('example', () => {
  // ========== State ==========
  // ✅ 使用 ref 定义响应式状态
  const data = ref<ExampleData[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // ========== Getters ==========
  // ✅ 使用 computed 定义派生状态
  const count = computed(() => data.value.length)
  const isEmpty = computed(() => data.value.length === 0)
  
  // ========== Actions ==========
  // ✅ Actions: 异步操作
  async function fetch() {
    loading.value = true
    error.value = null
    
    try {
      const res = await fetchData()
      data.value = res.data || []
    } catch (err: any) {
      error.value = err.message || '操作失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // ✅ Actions: 同步操作
  function reset() {
    data.value = []
    error.value = null
  }
  
  return {
    // State
    data,
    loading,
    error,
    // Getters
    count,
    isEmpty,
    // Actions
    fetch,
    reset,
  }
})
```

### Composables 标准模式

```typescript
/**
 * Composable 名称
 * 封装可复用的 Composition API 逻辑
 */

import { ref, computed } from 'vue'

export function useExample() {
  // ✅ 响应式状态
  const count = ref(0)
  const loading = ref(false)
  
  // ✅ 派生状态
  const doubleCount = computed(() => count.value * 2)
  
  // ✅ 方法
  const increment = () => {
    count.value++
  }
  
  const asyncOperation = async () => {
    loading.value = true
    try {
      // 异步操作
    } finally {
      loading.value = false
    }
  }
  
  return {
    count,
    loading,
    doubleCount,
    increment,
    asyncOperation,
  }
}
```

### API 服务标准模式

```typescript
/**
 * API 服务
 * 使用统一的 HTTP 客户端
 */

import { httpClient } from '@/utils/request'
import type { ApiResponse } from '@/types/api'

export interface ExampleParams {
  id: string
  name?: string
}

export interface ExampleData {
  id: string
  name: string
  createdAt: string
}

export async function getExample(
  params: ExampleParams
): Promise<ApiResponse<ExampleData>> {
  return httpClient.get('/api/example', { params })
}

export async function createExample(
  data: Omit<ExampleData, 'id' | 'createdAt'>
): Promise<ApiResponse<ExampleData>> {
  return httpClient.post('/api/example', data)
}

export async function updateExample(
  id: string,
  data: Partial<ExampleData>
): Promise<ApiResponse<ExampleData>> {
  return httpClient.put(`/api/example/${id}`, data)
}

export async function deleteExample(
  id: string
): Promise<ApiResponse<void>> {
  return httpClient.delete(`/api/example/${id}`)
}
```

---

## 🎨 样式规范

### UnoCSS 使用规范

#### 1. 优先使用原子类

```tsx
// ✅ 正确
<div class="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h1 class="text-2xl font-bold text-gray-800">标题</h1>
</div>

// ❌ 错误
<div class="custom-container">  // 如果 custom-container 不是快捷方式
```

#### 2. 使用快捷方式

```tsx
// ✅ 使用预定义的快捷方式（在 uno.config.ts 中定义）
<div class="flex-center">  // 等同于 flex items-center justify-center
<div class="login-panel">  // 预定义的登录面板样式
```

#### 3. 响应式设计

```tsx
// ✅ 使用响应式前缀
<div class="w-full md:w-1/2 lg:w-1/3">
  <h1 class="text-lg md:text-xl lg:text-2xl">响应式标题</h1>
</div>
```

#### 4. 动态类名

```tsx
// ✅ 使用计算属性生成动态类名
const buttonClass = computed(() => 
  `px-4 py-2 rounded ${isActive.value ? 'bg-blue-500' : 'bg-gray-300'}`
)

return () => (
  <button class={buttonClass.value}>
    按钮
  </button>
)
```

#### 5. 内联样式（复杂样式）

```tsx
// ✅ 复杂样式使用内联样式对象
<div style={{
  background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
  transform: `rotate(${angle}deg)`,
}}>
  内容
</div>
```

### Element Plus 组件样式

- ✅ Element Plus 组件自动导入，无需手动引入
- ✅ 使用 Element Plus 的 props 控制样式
- ✅ 使用 UnoCSS 类名覆盖 Element Plus 默认样式
- ✅ 使用 `class` 属性添加自定义样式

---

## 🌐 国际化规范

### 使用方式

```tsx
import { useI18n } from '@/composables/useI18n'

export default defineComponent({
  setup() {
    const { t, tWithParams } = useI18n()
    
    return () => (
      <div>
        {/* ✅ 简单文本 */}
        <h1>{t('config.title')}</h1>
        
        {/* ✅ 带参数的文本 */}
        <p>{tWithParams('config.confirmDelete', { dataId: 'example' })}</p>
      </div>
    )
  },
})
```

### 语言包结构

```typescript
// src/locales/zh-CN.ts
export default {
  common: {
    submit: '提交',
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    edit: '编辑',
    search: '搜索',
    reset: '重置',
  },
  config: {
    title: '配置管理',
    dataId: 'Data ID',
    group: 'Group',
    confirmDelete: '确定要删除配置 {dataId} 吗？',
    confirmBatchDelete: '确定要删除 {count} 个配置吗？',
  },
}
```

### 命名规范

- ✅ 使用小驼峰命名：`confirmDelete`
- ✅ 使用命名空间：`config.confirmDelete`
- ✅ 占位符使用 `{variableName}` 格式
- ❌ 避免使用下划线：`confirm_delete`

---

## 🔧 常见任务指南

### 创建新组件

1. **创建 TSX 文件**
   ```bash
   src/components/NewComponent/index.tsx
   ```

2. **使用标准模式**
   ```tsx
   import { defineComponent } from 'vue'
   import { useI18n } from '@/composables/useI18n'
   
   export default defineComponent({
     name: 'NewComponent',
     setup() {
       const { t } = useI18n()
       return () => <div>{t('common.title')}</div>
     },
   })
   ```

3. **导出组件**
   ```tsx
   // 从 index.tsx 导出（默认导出即可）
   export default defineComponent({ ... })
   ```

### 创建新页面

1. **创建 TSX 文件**
   ```bash
   src/views/NewPage/index.tsx
   ```

2. **添加路由**
   ```typescript
   // src/router/index.ts
   {
     path: 'newPage',
     name: 'NewPage',
     component: () => import('@/views/NewPage'),
   }
   ```

3. **使用布局**
   - 登录页：直接渲染，不使用 MainLayout
   - 其他页：自动使用 MainLayout（在路由中配置）

### 创建新 Store

1. **创建 Store 文件**
   ```bash
   src/stores/newStore.ts
   ```

2. **使用 Setup Store 模式**
   ```typescript
   import { defineStore } from 'pinia'
   import { ref, computed } from 'vue'
   
   export const useNewStore = defineStore('new', () => {
     const data = ref([])
     const count = computed(() => data.value.length)
     return { data, count }
   })
   ```

3. **在组件中使用**
   ```tsx
   import { useNewStore } from '@/stores/newStore'
   import { storeToRefs } from 'pinia'
   
   const newStore = useNewStore()
   const { data, count } = storeToRefs(newStore)
   ```

### 添加 API 接口

1. **在 `src/api/` 目录创建或更新文件**
   ```typescript
   // src/api/newApi.ts
   import { httpClient } from '@/utils/request'
   import type { ApiResponse } from '@/types/api'
   
   export interface NewData {
     id: string
     name: string
   }
   
   export async function fetchNewData(): Promise<ApiResponse<NewData[]>> {
     return httpClient.get('/api/new')
   }
   ```

2. **定义类型**
   ```typescript
   // src/types/api.ts
   export interface NewData {
     id: string
     name: string
   }
   ```

3. **在 Store 中使用**
   ```typescript
   import { fetchNewData } from '@/api/newApi'
   
   async function loadData() {
     loading.value = true
     try {
       const res = await fetchNewData()
       data.value = res.data || []
     } catch (err: any) {
       error.value = err.message
       throw err
     } finally {
       loading.value = false
     }
   }
   ```

### 添加国际化文本

1. **在语言包中添加翻译**
   ```typescript
   // src/locales/zh-CN.ts
   export default {
     newFeature: {
       title: '新功能',
       description: '这是新功能的描述',
       confirmAction: '确定要执行操作 {actionName} 吗？',
     },
   }
   ```

2. **在组件中使用**
   ```tsx
   const { t, tWithParams } = useI18n()
   
   return () => (
     <div>
       <h1>{t('newFeature.title')}</h1>
       <p>{t('newFeature.description')}</p>
       <p>{tWithParams('newFeature.confirmAction', { actionName: '删除' })}</p>
     </div>
   )
   ```

---

## 🚫 禁止事项

### ❌ 不要做的事情

1. **不要使用 `.vue` 文件**
   - ❌ `Component.vue`
   - ✅ `Component.tsx`

2. **不要使用模板语法**
   - ❌ `<template>`, `v-if`, `v-for`, `@click`
   - ✅ JSX 语法: `{condition && <div>}`, `{items.map()}`, `onClick={handler}`

3. **不要使用 `<script setup>`**
   - ❌ `<script setup lang="ts">`
   - ✅ `defineComponent({ setup() {} })`

4. **不要硬编码文本**
   - ❌ `<div>删除配置</div>`
   - ✅ `<div>{t('config.delete')}</div>`

5. **不要使用 `<style>` 标签**
   - ❌ `<style scoped>`
   - ✅ UnoCSS 类名或内联样式

6. **不要使用 npm/yarn**
   - ❌ `npm install` 或 `yarn add`
   - ✅ `pnpm install` 或 `pnpm add`

7. **不要使用 `any` 类型**
   - ❌ `const data: any = {}`
   - ✅ `const data: UserData = {}` 或 `const data = {} as UserData`

8. **不要在渲染函数中直接计算**
   - ❌ `{list.value.filter(...).map(...)}`
   - ✅ 使用 `computed` 缓存结果

9. **不要直接修改 props**
   - ❌ `props.value = newValue`
   - ✅ 使用 `emit` 触发事件或使用内部状态

10. **不要忘记类型定义**
    - ❌ `const data = {}`
    - ✅ `const data: DataType = {}` 或 `const data = {} as DataType`

---

## ✅ 推荐做法

### 最佳实践

#### 1. 组件命名规范

- ✅ 组件文件：`PascalCase.tsx`（如 `UserManagement.tsx`）
- ✅ 组件目录：`PascalCase/index.tsx`
- ✅ 组件 name：与文件名一致
- ✅ Store 文件：`camelCase.ts`（如 `userManagement.ts`）
- ✅ API 文件：`camelCase.ts`（如 `userApi.ts`）
- ✅ Composable 文件：`useCamelCase.ts`（如 `useUser.ts`）

#### 2. 类型定义规范

- ✅ Props 接口：`ComponentNameProps`
- ✅ 导出类型：在 `src/types/` 目录统一管理
- ✅ 避免使用 `any`，优先使用具体类型
- ✅ 使用 `interface` 定义对象类型
- ✅ 使用 `type` 定义联合类型或工具类型

#### 3. 错误处理规范

- ✅ API 错误：在 Store 中统一处理
- ✅ 组件错误：使用 `try-catch` 和 `ElMessage.error()`
- ✅ 用户友好的错误提示
- ✅ 错误信息使用国际化

#### 4. 性能优化规范

- ✅ 使用 `computed` 缓存计算结果
- ✅ 使用 `watch` 替代 `watchEffect`（需要精确控制时）
- ✅ 大列表使用虚拟滚动
- ✅ 路由懒加载
- ✅ 避免不必要的响应式

#### 5. 代码组织规范

- ✅ 相关功能放在同一目录
- ✅ 大型组件拆分为多个小组件
- ✅ 可复用逻辑提取为 composables
- ✅ 统一的导入顺序（Vue → 第三方库 → 项目内部）

#### 6. 代码注释规范

- ✅ 组件顶部添加文件说明
- ✅ 复杂逻辑添加注释
- ✅ 使用 JSDoc 注释类型
- ✅ 公共 API 添加注释

---

## 🔍 调试和开发

### 开发命令

```bash
# 启动开发服务器
pnpm dev

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

### 常见问题

#### 1. 类型错误

**问题**：TypeScript 类型检查失败

**解决方案**：
- 检查 `tsconfig.json` 配置
- 确保导入路径正确（使用 `@/` 别名）
- 检查 Element Plus 组件属性类型
- 确保 Props 类型定义正确

#### 2. JSX 语法错误

**问题**：JSX 语法不正确

**解决方案**：
- 确保使用 `defineComponent` + `setup`
- 检查 JSX 属性语法（`onClick` 而非 `@click`）
- 检查 v-model 语法（`modelValue` + `onUpdate:modelValue`）
- 确保条件渲染使用 `{condition && <div>}` 而非 `v-if`

#### 3. 样式不生效

**问题**：UnoCSS 类名不生效

**解决方案**：
- 检查 UnoCSS 类名是否正确
- 检查 `uno.config.ts` 配置
- 使用浏览器开发者工具检查生成的样式
- 确保类名在 UnoCSS 的安全列表中（如果需要）

#### 4. 国际化文本不显示

**问题**：`t()` 函数返回键名而非翻译文本

**解决方案**：
- 检查语言包中是否存在对应的键
- 检查键名是否正确（大小写敏感）
- 确保使用 `@/composables/useI18n` 而非直接使用 `vue-i18n` 的 `useI18n`

#### 5. Element Plus 组件未自动导入

**问题**：Element Plus 组件未定义

**解决方案**：
- 检查 `vite.config.ts` 中的 `unplugin-vue-components` 配置
- 确保组件名称正确（如 `ElButton` 而非 `el-button`）
- 重启开发服务器

---

## 📚 参考资源

### 官方文档

- [Vue 3 文档](https://vuejs.org/)
- [Vue 3 JSX 文档](https://github.com/vuejs/babel-plugin-jsx)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Element Plus 文档](https://element-plus.org/)
- [Pinia 文档](https://pinia.vuejs.org/)
- [UnoCSS 文档](https://unocss.dev/)
- [Vue I18n 官方文档](https://vue-i18n.intlify.dev/)
- [Vite 文档](https://vitejs.dev/)

### 项目文档

- `README.md` - 项目说明和开发指南（包含完整的功能描述和 API 说明）
- `src/composables/useI18n.ts` - 国际化使用示例
- `src/stores/auth.ts` - Store 使用示例
- `src/components/DeleteDialog/index.tsx` - 组件编写示例
- `src/views/ConfigurationManagement/index.tsx` - 页面编写示例

### 关键文件说明

#### API 层
- `src/api/configuration.ts` - 配置管理 API（11个接口）
- `src/api/service.ts` - 服务管理 API（9个接口）
- `src/api/authority.ts` - 权限管理 API（13个接口）
- `src/api/ai.ts` - AI 功能 API（16个接口）

#### Store 层
- `src/stores/configuration.ts` - 配置管理状态（列表、分页、搜索）
- `src/stores/service.ts` - 服务管理状态（列表、详情、分页）
- `src/stores/authority.ts` - 权限管理状态（用户、角色、权限）
- `src/stores/ai.ts` - AI 功能状态（MCP、Agent）

#### 工具函数
- `src/utils/request.ts` - HTTP 客户端（自动注入 namespace、accessToken、统一错误处理）
- `src/utils/validateContent.ts` - 内容验证（支持 JSON、XML、YAML、Properties、TOML）
- `src/utils/urlParams.ts` - URL 参数管理（hash 参数）
- `src/utils/eventBus.ts` - 全局事件总线（组件间通信）
- `src/utils/useLoading.ts` - Loading 管理（计数器机制，集成 Element Plus ElLoading）

---

## 🎯 项目状态

### ✅ 已完成（100%）

**🎉 项目开发任务已全部完成！**

#### 核心功能模块（6个模块，100%完成）
- ✅ 配置管理模块（9个页面）
- ✅ 服务管理模块（3个页面 + 6个子组件）
- ✅ 权限管理模块（3个页面 + 3个子组件）
- ✅ 命名空间管理模块（1个页面 + 2个子组件）
- ✅ 集群管理模块（1个页面）
- ✅ 设置中心模块（1个页面）
- ✅ 欢迎页模块（1个页面）
- ✅ 注册页模块（1个页面）

#### AI 功能模块（7个页面，100%完成）
- ✅ MCP 管理模块（4个页面）
- ✅ Agent 管理模块（3个页面）

#### 基础设施（100%完成）
- ✅ 路由系统（27个路由配置）
- ✅ 布局组件（3个）
- ✅ HTTP 客户端（请求/响应拦截器）
- ✅ 国际化系统（Vue I18n 9.x）
- ✅ Stores（8个）
- ✅ 工具函数（9个）
- ✅ 通用组件（17个）
- ✅ API 接口（62个）

#### 代码质量
- ✅ 所有组件使用 JSX/TSX 语法
- ✅ 所有组件使用 Composition API
- ✅ 完整的 TypeScript 类型支持
- ✅ 代码已优化，无 TODO/FIXME 标记
- ✅ 文档完善（README.md、AGENTS.md）

---

## 💡 AI 代理工作指南

### 当需要修改代码时

#### 1. 检查文件扩展名

- ✅ 如果是 `.tsx`，可以直接修改
- ❌ 如果是 `.vue`，必须先转换为 `.tsx`
- ✅ 确保使用 JSX 语法

#### 2. 检查代码风格

- ✅ 使用 `defineComponent` + `setup`
- ✅ 使用 Composition API
- ✅ 使用国际化函数
- ✅ 使用 TypeScript 类型

#### 3. 检查类型

- ✅ 运行 `pnpm typecheck` 确保类型正确
- ✅ 修复所有类型错误
- ✅ 确保 Props 类型定义正确

#### 4. 检查导入

- ✅ Element Plus 组件自动导入，无需手动引入
- ✅ 使用 `@/` 路径别名
- ✅ 检查导入顺序（Vue → 第三方库 → 项目内部）

### 当需要创建新功能时

#### 1. 创建文件结构

- ✅ 组件：`src/components/ComponentName/index.tsx`
- ✅ 页面：`src/views/PageName/index.tsx`
- ✅ Store：`src/stores/storeName.ts`
- ✅ API：`src/api/apiName.ts`
- ✅ Composable：`src/composables/useComposable.ts`

#### 2. 遵循模式

- ✅ 参考现有代码的模式
- ✅ 使用相同的代码风格
- ✅ 添加必要的注释
- ✅ 使用标准命名规范

#### 3. 测试

- ✅ 确保类型检查通过（`pnpm typecheck`）
- ✅ 确保代码可以运行（`pnpm dev`）
- ✅ 检查控制台错误
- ✅ 确保国际化文本正确显示

### 代码审查清单

在提交代码前，请检查：

- [ ] 所有组件使用 `.tsx` 扩展名
- [ ] 所有组件使用 `defineComponent` + `setup`
- [ ] 所有用户可见文本使用 `t()` 或 `tWithParams()`
- [ ] 所有 Props 定义了类型
- [ ] 没有使用 `any` 类型
- [ ] 没有使用 `<style>` 标签
- [ ] 没有硬编码文本
- [ ] 类型检查通过
- [ ] 代码可以正常运行

---

## 📝 更新日志

- **2024-12-19**: 完成 JSX/TSX 全面迁移，移除所有 `.vue` 文件
- **2024-12-19**: 完成 Composition API 集成优化
- **2024-12-19**: 完成国际化系统迁移到 Vue I18n
- **2024-12-19**: 完成配置管理主页面实现
- **2024-12-19**: 创建 AGENTS.md 文档

---

**最后更新**: 2024-12-19

**维护者**: 开发团队

**问题反馈**: 请查看项目 README.md 或提交 Issue
