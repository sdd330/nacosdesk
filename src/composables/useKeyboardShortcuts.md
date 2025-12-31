# 键盘快捷键说明

## 全局快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Ctrl+K` (Mac: `Cmd+K`) | 快速搜索 | 打开快速搜索框（待实现） |
| `Ctrl+N` (Mac: `Cmd+N`) | 新建配置 | 快速创建新配置（待实现） |
| `Ctrl+S` (Mac: `Cmd+S`) | 保存 | 保存当前编辑的内容（待实现） |
| `Escape` | 返回/关闭 | 关闭对话框或返回上一页 |

## 使用说明

- 快捷键在输入框、文本域等可编辑元素聚焦时不会触发（Escape 键除外）
- 可以在任何页面使用这些快捷键
- 快捷键可以通过 `useKeyboardShortcuts` composable 进行扩展

## 扩展快捷键

在组件中使用 `useKeyboardShortcuts` 来添加页面特定的快捷键：

```typescript
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

useKeyboardShortcuts([
  {
    key: 'f',
    ctrl: true,
    handler: () => {
      // 处理 Ctrl+F
      console.log('搜索')
    },
    description: '搜索',
  },
])
```

