# 开发规范指南

本文档详细说明 Nacos Desktop 项目的开发规范、代码风格和最佳实践。

## 📋 核心开发规范

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

## 💡 AI 代理代码审查清单

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

