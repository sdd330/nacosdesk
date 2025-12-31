# AGENTS.md - Nacos Desktop AI 智能体指南

> **本文档专为 AI 智能体设计**，提供项目结构、开发规范、代码模式和最佳实践指引

## 📋 快速导航

- [项目概述](#项目概述)
- [核心规则（必须遵守）](#核心规则必须遵守)
- [代码模式示例](#代码模式示例)
- [常见任务步骤](#常见任务步骤)
- [文件路径参考](#文件路径参考)
- [代码审查清单](#代码审查清单)

---

## 📋 项目概述

### 项目基本信息

- **项目名称**: Nacos Desktop
- **项目路径**: `/Users/leijunyang/workspace/bizapp/nacosdesk`
- **技术栈**: Vue 3.5 + TypeScript + JSX + Element Plus + UnoCSS + Pinia + Tauri 2.0 + SQLite
- **包管理器**: **pnpm**（必须使用，禁止使用 npm 或 yarn）
- **开发服务器**: http://localhost:5174
- **Web Console 端口**: 8080 (Nacos 3 Web Console)
- **API 服务器端口**: 8848 (Nacos Standalone API Server，支持 Spring Boot 连接)

### 项目目标

完全重新实现 Nacos Web Console 的所有核心功能，包括：
- 配置管理（Configuration Management）
- 服务管理（Service Management）
- 命名空间管理（Namespace Management）
- 权限控制（Authority Control）
- 集群管理（Cluster Management）
- 设置中心（Setting Center）

**新增功能**：作为 Nacos Standalone API 服务器（监听 8848 端口），支持 Spring Boot 等外部应用连接和使用。

### 项目特点

- ✅ **完全使用 JSX/TSX** - 所有组件使用 `.tsx` 文件，禁止使用 `.vue` 文件
- ✅ **Composition API** - 所有组件使用 `defineComponent` + `setup`
- ✅ **TypeScript** - 完整的类型安全支持
- ✅ **国际化** - 支持中文和英文，使用 Vue I18n
- ✅ **Tauri 2.0** - 跨平台桌面应用框架
- ✅ **SQLite** - 嵌入式数据库支持

---

## ⚠️ 核心规则（必须遵守）

### 规则 1: 文件扩展名和语法

```
✅ 正确: src/views/UserManagement.tsx
❌ 错误: src/views/UserManagement.vue
❌ 错误: src/views/UserManagement.jsx (必须使用 .tsx)
```

**必须使用**：
- `.tsx` 扩展名（TypeScript + JSX）
- `defineComponent` + `setup` 模式
- JSX 语法（`<div>`, `<ElButton>` 等）

**禁止使用**：
- `.vue` 文件
- `<template>` 模板语法
- `<script setup>` 语法糖
- `.jsx` 文件（必须使用 TypeScript）

### 规则 2: 组件定义模式

**标准组件结构**：

```tsx
import { defineComponent, ref, computed } from 'vue'
import { ElButton } from 'element-plus'
import { useI18n } from '@/composables/useI18n'

export default defineComponent({
  name: 'ComponentName',
  setup() {
    const { t } = useI18n()
    const count = ref(0)
    const displayText = computed(() => `Count: ${count.value}`)
    
    return () => (
      <div class="component-container">
        <ElButton onClick={() => count.value++}>
          {t('common.submit')}
        </ElButton>
      </div>
    )
  },
})
```

**关键点**：
- `setup()` 函数必须返回渲染函数 `() => JSX`
- 使用 `ref()` 定义基本类型响应式状态
- 使用 `reactive()` 定义对象类型响应式状态
- 使用 `computed()` 定义派生状态
- 所有用户可见文本使用 `t()` 函数

### 规则 3: 国际化使用

```tsx
// ✅ 正确
const { t, tWithParams } = useI18n()
return () => <h1>{t('config.title')}</h1>

// ❌ 错误
return () => <h1>配置管理</h1>  // 禁止硬编码中文
return () => <h1>Configuration</h1>  // 禁止硬编码英文
```

**必须**：
- 所有用户可见文本使用 `t()` 函数
- 动态文本使用 `tWithParams()` 函数
- 在 `src/locales/zh-CN.ts` 和 `src/locales/en-US.ts` 中添加翻译

### 规则 4: 样式使用

```tsx
// ✅ 正确 - 使用 UnoCSS 原子类
<div class="flex items-center justify-between p-4 bg-white rounded-lg">

// ❌ 错误 - 禁止使用 style 标签
<style scoped>
  .container { ... }
</style>

// ❌ 错误 - 禁止使用 SCSS/LESS
<div class="container">  // 如果 container 在 CSS 文件中定义
```

**必须**：
- 使用 UnoCSS 原子类
- 使用快捷方式（如 `flex-center`）
- 响应式设计使用断点前缀（`md:`, `lg:` 等）

**禁止**：
- `<style>` 标签
- SCSS/LESS 文件
- 内联样式（除非是动态样式）

### 规则 5: API 调用模式

**支持 Tauri/HTTP 自动切换**：

```typescript
import { isTauri, tauriGetConfigList } from '@/utils/tauriApi'
import httpClient from '@/utils/request'

export async function getConfigList(params: ConfigQueryParams) {
  if (isTauri()) {
    // Tauri 环境：使用本地 SQLite API
    return tauriGetConfigList(params)
  } else {
    // Web 环境：使用 HTTP API
    return httpClient.get('/v3/console/cs/config', { params })
  }
}
```

**关键点**：
- 所有 API 函数必须支持 Tauri/HTTP 切换
- 使用 `isTauri()` 检测环境
- Tauri API 函数在 `src/utils/tauriApi.ts` 中定义
- HTTP API 使用 `src/utils/request.ts` 中的 `httpClient`

---

## 💻 代码模式示例

### 模式 1: 页面组件（带路由）

**文件路径**: `src/views/ConfigurationManagement/index.tsx`

```tsx
import { defineComponent, ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElCard, ElTable, ElButton } from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import { useConfigurationStore } from '@/stores/configuration'
import { getConfigList } from '@/api/configuration'

export default defineComponent({
  name: 'ConfigurationManagement',
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    const configStore = useConfigurationStore()
    
    // 响应式状态
    const loading = ref(false)
    const tableData = ref([])
    const searchForm = reactive({
      dataId: '',
      group: '',
      namespaceId: '',
    })
    
    // 计算属性
    const currentNamespace = computed(() => {
      return (window as any).nownamespace || 'public'
    })
    
    // 方法
    const fetchData = async () => {
      loading.value = true
      try {
        const res = await getConfigList({
          dataId: searchForm.dataId,
          group: searchForm.group,
          namespaceId: searchForm.namespaceId,
        })
        tableData.value = res.pageItems || []
      } catch (error: any) {
        ElMessage.error(error.message || t('common.error'))
      } finally {
        loading.value = false
      }
    }
    
    // 生命周期
    onMounted(() => {
      fetchData()
    })
    
    // 返回渲染函数
    return () => (
      <div class="p-6">
        <ElCard>
          <ElTable data={tableData.value} loading={loading.value}>
            {/* 表格列 */}
          </ElTable>
        </ElCard>
      </div>
    )
  },
})
```

### 模式 2: 对话框组件（带 Props 和 Emits）

**文件路径**: `src/views/AuthorityControl/components/NewUser.tsx`

```tsx
import { defineComponent, ref, reactive } from 'vue'
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton } from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import { createUser } from '@/api/authority'

export default defineComponent({
  name: 'NewUser',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'success'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const loading = ref(false)
    const formData = reactive({
      username: '',
      password: '',
    })
    
    const handleConfirm = async () => {
      loading.value = true
      try {
        await createUser(formData)
        ElMessage.success(t('common.success'))
        emit('success')
        emit('update:modelValue', false)
      } catch (error: any) {
        ElMessage.error(error.message || t('common.error'))
      } finally {
        loading.value = false
      }
    }
    
    return () => (
      <ElDialog
        modelValue={props.modelValue}
        onUpdate:modelValue={(val: boolean) => emit('update:modelValue', val)}
        title={t('userManagement.newUser')}
      >
        <ElForm model={formData}>
          <ElFormItem label={t('userManagement.username')}>
            <ElInput v-model={formData.username} />
          </ElFormItem>
          <ElFormItem>
            <ElButton type="primary" onClick={handleConfirm} loading={loading.value}>
              {t('common.confirm')}
            </ElButton>
          </ElFormItem>
        </ElForm>
      </ElDialog>
    )
  },
})
```

### 模式 3: Pinia Store

**文件路径**: `src/stores/configuration.ts`

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getConfigList, createConfig, updateConfig, deleteConfig } from '@/api/configuration'
import type { ConfigInfo, ConfigQueryParams } from '@/types/api'

export const useConfigurationStore = defineStore('configuration', () => {
  // 状态
  const configList = ref<ConfigInfo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // 计算属性
  const totalCount = computed(() => configList.value.length)
  
  // 方法
  async function fetchConfigList(params: ConfigQueryParams) {
    loading.value = true
    error.value = null
    try {
      const res = await getConfigList(params)
      configList.value = res.pageItems || []
      return res
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  async function createConfigItem(data: any) {
    loading.value = true
    try {
      await createConfig(data)
      await fetchConfigList({}) // 刷新列表
    } finally {
      loading.value = false
    }
  }
  
  return {
    configList,
    loading,
    error,
    totalCount,
    fetchConfigList,
    createConfigItem,
  }
})
```

### 模式 4: API 函数（Tauri/HTTP 切换）

**文件路径**: `src/api/configuration.ts`

```typescript
import { isTauri } from '@/utils/tauriApi'
import { tauriGetConfigList, tauriCreateConfig } from '@/utils/tauriApi'
import httpClient from '@/utils/request'
import type { ConfigQueryParams, ConfigInfo } from '@/types/api'

export async function getConfigList(params: ConfigQueryParams): Promise<ConfigListResponse> {
  if (isTauri()) {
    // Tauri 环境：使用本地 SQLite API
    return tauriGetConfigList(params)
  } else {
    // Web 环境：使用 HTTP API
    return httpClient.get('/v3/console/cs/config', { params })
  }
}

export async function createConfig(data: CreateConfigRequest): Promise<void> {
  if (isTauri()) {
    await tauriCreateConfig(data)
  } else {
    await httpClient.post('/v3/console/cs/config', data)
  }
}
```

### 模式 5: JSX 语法要点

**条件渲染**：
```tsx
{loading.value && <ElLoading />}
{error.value ? <ElAlert type="error" message={error.value} /> : null}
```

**列表渲染**：
```tsx
{tableData.value.map((item, index) => (
  <ElTableRow key={item.id || index}>
    <ElTableColumn>{item.dataId}</ElTableColumn>
  </ElTableRow>
))}
```

**事件处理**：
```tsx
<ElButton onClick={handleClick}>点击</ElButton>
<ElInput 
  modelValue={value.value}
  onUpdate:modelValue={(val: string) => (value.value = val)}
/>
```

**v-model 双向绑定**：
```tsx
// Element Plus 组件
<ElInput
  modelValue={formData.username}
  onUpdate:modelValue={(val: string) => (formData.username = val)}
/>

// 原生 input
<input
  value={formData.username}
  onInput={(e: Event) => {
    formData.username = (e.target as HTMLInputElement).value
  }}
/>
```

---

## 🔧 常见任务步骤

### 任务 1: 创建新页面组件

**步骤**：

1. **创建文件**：`src/views/NewPage/index.tsx`
2. **使用标准模式**：
   ```tsx
   import { defineComponent, ref, onMounted } from 'vue'
   import { useRouter } from 'vue-router'
   import { useI18n } from '@/composables/useI18n'
   
   export default defineComponent({
     name: 'NewPage',
     setup() {
       const router = useRouter()
       const { t } = useI18n()
       // ... 组件逻辑
       return () => <div>...</div>
     },
   })
   ```
3. **添加路由**：在 `src/router/index.ts` 中添加路由配置
4. **使用 MainLayout**：页面会自动使用 MainLayout（登录页除外）

**参考文件**：
- `src/views/ConfigurationManagement/index.tsx` - 列表页面示例
- `src/views/Login.tsx` - 独立页面示例

### 任务 2: 创建新组件

**步骤**：

1. **创建文件**：`src/components/NewComponent/index.tsx`
2. **定义 Props 类型**：
   ```tsx
   interface ComponentProps {
     title: string
     count?: number
   }
   ```
3. **使用标准模式**：参考 [模式 2: 对话框组件](#模式-2-对话框组件带-props-和-emits)

**参考文件**：
- `src/components/PageTitle/index.tsx` - 简单组件示例
- `src/views/AuthorityControl/components/NewUser.tsx` - 对话框组件示例

### 任务 3: 创建新 Store

**步骤**：

1. **创建文件**：`src/stores/newStore.ts`
2. **使用 Setup Store 模式**：参考 [模式 3: Pinia Store](#模式-3-pinia-store)
3. **在组件中使用**：
   ```tsx
   import { useNewStore } from '@/stores/newStore'
   import { storeToRefs } from 'pinia'
   
   const store = useNewStore()
   const { data, loading } = storeToRefs(store) // 保持响应式
   ```

**参考文件**：
- `src/stores/auth.ts` - Store 示例
- `src/stores/configuration.ts` - Store 示例

### 任务 4: 添加 API 接口

**步骤**：

1. **在 `src/api/` 目录创建或更新文件**
2. **实现 Tauri/HTTP 切换**：参考 [模式 4: API 函数](#模式-4-api-函数taurihttp-切换)
3. **添加 Tauri API 函数**：在 `src/utils/tauriApi.ts` 中添加
4. **在 Store 中使用**：在 Store 中调用 API 函数

**参考文件**：
- `src/api/configuration.ts` - API 示例
- `src/utils/tauriApi.ts` - Tauri API 工具

### 任务 5: 添加国际化文本

**步骤**：

1. **在 `src/locales/zh-CN.ts` 中添加中文翻译**：
   ```typescript
   export default {
     newFeature: {
       title: '新功能',
       description: '功能描述',
     },
   }
   ```
2. **在 `src/locales/en-US.ts` 中添加英文翻译**：
   ```typescript
   export default {
     newFeature: {
       title: 'New Feature',
       description: 'Feature description',
     },
   }
   ```
3. **在组件中使用**：
   ```tsx
   const { t } = useI18n()
   return () => <h1>{t('newFeature.title')}</h1>
   ```

**参考文件**：
- `src/locales/zh-CN.ts` - 中文语言包
- `src/locales/en-US.ts` - 英文语言包

---

## 📁 文件路径参考

### 核心目录结构

```
src/
├── api/                    # API 服务层
│   ├── auth.ts            # 认证 API
│   ├── configuration.ts  # 配置管理 API
│   ├── service.ts         # 服务管理 API
│   ├── authority.ts       # 权限管理 API
│   └── ...
├── components/            # 通用组件（TSX）
│   ├── PageTitle/
│   ├── MonacoEditor/
│   └── ...
├── composables/           # Composition API 组合式函数
│   ├── useI18n.ts        # 国际化 composable
│   ├── useNotification.ts # 通知 composable
│   └── ...
├── layouts/              # 布局组件（TSX）
│   ├── MainLayout.tsx    # 主布局
│   └── Header.tsx        # 头部组件
├── locales/              # 国际化语言包
│   ├── zh-CN.ts          # 中文
│   └── en-US.ts          # 英文
├── router/               # 路由配置
│   └── index.ts          # 路由定义
├── stores/               # Pinia 状态管理
│   ├── auth.ts           # 认证状态
│   ├── configuration.ts  # 配置管理状态
│   └── ...
├── utils/                # 工具函数
│   ├── request.ts        # HTTP 客户端
│   ├── tauriApi.ts       # Tauri API 工具
│   └── ...
└── views/                # 页面组件（TSX）
    ├── Login.tsx         # 登录页
    ├── ConfigurationManagement/  # 配置管理
    ├── ServiceManagement/        # 服务管理
    └── ...
```

### 关键文件路径

| 文件类型 | 路径示例 | 说明 |
|---------|---------|------|
| 页面组件 | `src/views/ConfigurationManagement/index.tsx` | 配置管理列表页 |
| 对话框组件 | `src/views/AuthorityControl/components/NewUser.tsx` | 新建用户对话框 |
| Store | `src/stores/configuration.ts` | 配置管理状态 |
| API 函数 | `src/api/configuration.ts` | 配置管理 API |
| Tauri API | `src/utils/tauriApi.ts` | Tauri API 工具 |
| 路由配置 | `src/router/index.ts` | 路由定义 |
| 国际化 | `src/locales/zh-CN.ts` | 中文语言包 |
| Rust 后端 | `src-tauri/src/main.rs` | Rust 主程序 |
| 数据库模块 | `src-tauri/src/db/mod.rs` | 数据库模块 |

---

## ✅ 代码审查清单

在提交代码前，必须检查以下所有项：

### 文件结构检查

- [ ] 所有组件文件使用 `.tsx` 扩展名（不是 `.vue` 或 `.jsx`）
- [ ] 文件路径符合项目结构规范
- [ ] 组件文件放在正确的目录（`src/views/` 或 `src/components/`）

### 组件代码检查

- [ ] 使用 `defineComponent` + `setup` 模式
- [ ] `setup()` 函数返回渲染函数 `() => JSX`
- [ ] 使用 `ref()` 定义基本类型响应式状态
- [ ] 使用 `reactive()` 定义对象类型响应式状态
- [ ] 使用 `computed()` 定义派生状态（不在渲染函数中直接计算）
- [ ] Props 定义了明确的类型接口
- [ ] 没有使用 `any` 类型（除非必要）
- [ ] 组件名称使用 PascalCase

### 国际化检查

- [ ] 所有用户可见文本使用 `t()` 函数
- [ ] 动态文本使用 `tWithParams()` 函数
- [ ] 没有硬编码中文或英文文本
- [ ] 在 `src/locales/zh-CN.ts` 和 `src/locales/en-US.ts` 中添加了翻译

### 样式检查

- [ ] 使用 UnoCSS 原子类
- [ ] 没有使用 `<style>` 标签
- [ ] 没有使用 SCSS/LESS 文件
- [ ] 响应式设计使用断点前缀

### API 调用检查

- [ ] API 函数支持 Tauri/HTTP 自动切换
- [ ] 使用 `isTauri()` 检测环境
- [ ] Tauri API 函数在 `src/utils/tauriApi.ts` 中定义
- [ ] 错误处理完善（try-catch）

### 类型安全检查

- [ ] 所有函数参数和返回值有类型定义
- [ ] 使用 `interface` 或 `type` 定义类型
- [ ] 避免使用 `any`，优先使用具体类型
- [ ] 类型定义在 `src/types/` 目录或文件顶部

### 代码质量检查

- [ ] 代码格式正确（使用 Prettier）
- [ ] 没有 ESLint 错误
- [ ] 类型检查通过（`pnpm typecheck`）
- [ ] 代码可以正常运行

### Git 提交检查

- [ ] Commit 消息符合 Conventional Commits 规范
- [ ] 使用 `pnpm commit` 进行交互式提交（推荐）
- [ ] Commit 消息通过 Commitlint 检查

---

## 🎯 Nacos Web Console 核心功能模块

### 1. 配置管理模块（Configuration Management）

**页面路径**：
- `src/views/ConfigurationManagement/index.tsx` - 配置列表
- `src/views/ConfigurationManagement/NewConfig.tsx` - 新建配置
- `src/views/ConfigurationManagement/ConfigEditor.tsx` - 配置编辑
- `src/views/ConfigurationManagement/ConfigDetail.tsx` - 配置详情
- `src/views/ConfigurationManagement/ConfigSync.tsx` - 配置同步
- `src/views/ConfigurationManagement/HistoryRollback.tsx` - 历史版本列表
- `src/views/ConfigurationManagement/ConfigRollback.tsx` - 配置回滚

**API 路径**：
- `src/api/configuration.ts` - 配置管理 API
- `src/utils/tauriApi.ts` - Tauri API（搜索 `tauriGetConfig`）

**Store 路径**：
- `src/stores/configuration.ts` - 配置管理状态

**技术要点**：
- Monaco Editor 代码编辑器
- 内容验证（JSON/XML/YAML/Properties/TOML）
- MD5 验证和内容校验
- Diff Editor 版本对比
- 配置同步（跨命名空间）
- 配置历史版本管理

### 2. 服务管理模块（Service Management）

**页面路径**：
- `src/views/ServiceManagement/ServiceList.tsx` - 服务列表
- `src/views/ServiceManagement/ServiceDetail/index.tsx` - 服务详情
- `src/views/ServiceManagement/SubscriberList.tsx` - 订阅者列表

**API 路径**：
- `src/api/service.ts` - 服务管理 API
- `src/utils/tauriApi.ts` - Tauri API（搜索 `tauriGetService`）

**Store 路径**：
- `src/stores/service.ts` - 服务管理状态

**技术要点**：
- 服务元数据管理
- 实例权重和状态管理
- 实例健康检查配置
- 实例注册和注销
- 订阅者监控

### 3. 命名空间管理模块（Namespace Management）

**页面路径**：
- `src/views/NameSpace/index.tsx` - 命名空间列表

**API 路径**：
- `src/api/namespace.ts` - 命名空间 API
- `src/utils/tauriApi.ts` - Tauri API（搜索 `tauriGetNamespace`）

**Store 路径**：
- `src/stores/namespace.ts` - 命名空间状态

### 4. 权限控制模块（Authority Control）

**页面路径**：
- `src/views/AuthorityControl/UserManagement.tsx` - 用户管理
- `src/views/AuthorityControl/RolesManagement.tsx` - 角色管理
- `src/views/AuthorityControl/PermissionsManagement.tsx` - 权限管理

**API 路径**：
- `src/api/authority.ts` - 权限管理 API
- `src/utils/tauriApi.ts` - Tauri API（搜索 `tauriGetUser`）

**Store 路径**：
- `src/stores/authority.ts` - 权限管理状态

---

## 🚨 常见错误和解决方案

### 错误 1: 使用 .vue 文件

**错误**：
```tsx
// ❌ 错误
export default {
  name: 'Component',
  template: '<div>...</div>',
}
```

**解决方案**：
```tsx
// ✅ 正确
export default defineComponent({
  name: 'Component',
  setup() {
    return () => <div>...</div>
  },
})
```

### 错误 2: 硬编码文本

**错误**：
```tsx
// ❌ 错误
return () => <h1>配置管理</h1>
```

**解决方案**：
```tsx
// ✅ 正确
const { t } = useI18n()
return () => <h1>{t('config.title')}</h1>
```

### 错误 3: 在渲染函数中直接计算

**错误**：
```tsx
// ❌ 错误
return () => <div>{items.value.length}</div>
```

**解决方案**：
```tsx
// ✅ 正确
const count = computed(() => items.value.length)
return () => <div>{count.value}</div>
```

### 错误 4: 使用 style 标签

**错误**：
```tsx
// ❌ 错误
<style scoped>
  .container { ... }
</style>
```

**解决方案**：
```tsx
// ✅ 正确
return () => <div class="flex items-center p-4">...</div>
```

### 错误 5: API 函数不支持 Tauri/HTTP 切换

**错误**：
```typescript
// ❌ 错误
export async function getConfigList() {
  return httpClient.get('/v3/console/cs/config')
}
```

**解决方案**：
```typescript
// ✅ 正确
export async function getConfigList(params: ConfigQueryParams) {
  if (isTauri()) {
    return tauriGetConfigList(params)
  } else {
    return httpClient.get('/v3/console/cs/config', { params })
  }
}
```

---

## 📚 参考文档

详细文档请参考：

- [开发规范指南](docs/development-guide.md) - 开发规范、代码风格和最佳实践
- [Git 规范配置](docs/git-conventions.md) - Git 提交规范和版本管理
- [配置说明](docs/configuration.md) - 项目各项配置详解
- [README.md](README.md) - 项目概述和快速开始

---

## 💡 AI 智能体工作流程

### 1. 理解任务

- 阅读用户需求
- 查看相关文件（使用 `read_file` 工具）
- 搜索相似代码（使用 `codebase_search` 工具）

### 2. 规划实现

- 确定需要创建/修改的文件
- 确定需要使用的 API 和 Store
- 确定需要添加的国际化文本

### 3. 实现代码

- 使用标准模式创建组件
- 遵循核心规则
- 添加类型定义
- 添加国际化支持

### 4. 代码审查

- 使用代码审查清单检查
- 确保没有违反规则
- 确保类型检查通过

### 5. 测试和提交

- 运行类型检查（`pnpm typecheck`）
- 运行代码检查（`pnpm lint`）
- 提交代码（`pnpm commit`）

---

**最后更新**: 2024-12-31

**维护者**: 开发团队
