# 通知功能使用说明

## 概述

通知功能提供了统一的通知管理接口，支持：
- **系统通知**：在 Tauri 环境中使用系统原生通知（需要用户授权）
- **应用内通知**：使用 Element Plus 的通知组件（无需权限）

## 使用方法

### 基础用法

```typescript
import { useNotification } from '@/composables/useNotification'

const notification = useNotification()

// 成功通知
notification.success('操作成功', '配置已保存')

// 警告通知
notification.warning('注意', '此操作不可撤销')

// 信息通知
notification.info('提示', '数据已更新')

// 错误通知
notification.error('操作失败', '网络连接错误')
```

### 高级用法

```typescript
import { showNotification } from '@/composables/useNotification'

// 自定义通知选项
showNotification({
  title: '自定义通知',
  message: '这是一条自定义通知',
  type: 'info',
  duration: 5000, // 5秒后自动关闭
  position: 'top-right',
  onClick: () => {
    console.log('通知被点击')
  },
  onClose: () => {
    console.log('通知已关闭')
  },
})
```

### 权限管理

```typescript
import { requestNotificationPermission, checkNotificationPermission } from '@/composables/useNotification'

// 检查通知权限
const permission = checkNotificationPermission()
// 'granted' | 'denied' | 'default'

// 请求通知权限
const granted = await requestNotificationPermission()
if (granted) {
  console.log('通知权限已授予')
}
```

## 通知类型

- `success` - 成功通知（绿色）
- `warning` - 警告通知（黄色）
- `info` - 信息通知（蓝色）
- `error` - 错误通知（红色）

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | 必填 | 通知标题 |
| `message` | `string` | `''` | 通知内容 |
| `type` | `'success' \| 'warning' \| 'info' \| 'error'` | `'info'` | 通知类型 |
| `duration` | `number` | `4500` | 持续时间（毫秒），0 表示不自动关闭 |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` | 通知位置 |
| `onClick` | `() => void` | - | 点击通知时的回调 |
| `onClose` | `() => void` | - | 通知关闭时的回调 |

## 注意事项

1. **系统通知权限**：在 Tauri 环境中，首次使用系统通知需要用户授权
2. **自动降级**：如果系统通知不可用，会自动使用 Element Plus 通知
3. **错误通知**：错误通知默认显示 6 秒（其他类型为 4.5 秒）
4. **权限检查**：应用启动时会自动请求通知权限（仅在 Tauri 环境中）

## 最佳实践

1. **使用合适的通知类型**：根据操作结果选择合适的通知类型
2. **提供清晰的标题和消息**：让用户快速理解通知内容
3. **设置合理的持续时间**：重要通知可以设置更长的显示时间
4. **处理用户交互**：通过 `onClick` 回调处理用户点击通知的操作

