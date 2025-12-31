/**
 * 键盘快捷键管理 Composable
 * 提供全局快捷键支持功能
 */

import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export interface KeyboardShortcut {
  key: string // 按键，如 'k', 'Escape', 'Enter'
  ctrl?: boolean // 是否按下 Ctrl
  shift?: boolean // 是否按下 Shift
  alt?: boolean // 是否按下 Alt
  meta?: boolean // 是否按下 Meta (Cmd on Mac)
  handler: () => void | Promise<void> // 处理函数
  description?: string // 快捷键描述
  preventDefault?: boolean // 是否阻止默认行为，默认 true
}

/**
 * 键盘快捷键管理
 * @param shortcuts 快捷键配置数组
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const router = useRouter()

  const handleKeyDown = async (event: KeyboardEvent) => {
    // 如果焦点在输入框、文本域或可编辑元素上，不处理快捷键
    const activeElement = document.activeElement
    if (
      activeElement &&
      (activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true')
    ) {
      // 允许 Escape 键在任何情况下都能使用
      if (event.key !== 'Escape') {
        return
      }
    }

    for (const shortcut of shortcuts) {
      // 检查按键是否匹配
      const keyMatch =
        event.key.toLowerCase() === shortcut.key.toLowerCase() ||
        event.code === shortcut.key ||
        event.key === shortcut.key

      if (!keyMatch) continue

      // 检查修饰键是否匹配
      const ctrlMatch =
        shortcut.ctrl === undefined || event.ctrlKey === shortcut.ctrl
      const shiftMatch =
        shortcut.shift === undefined || event.shiftKey === shortcut.shift
      const altMatch = shortcut.alt === undefined || event.altKey === shortcut.alt
      const metaMatch =
        shortcut.meta === undefined || event.metaKey === shortcut.meta

      if (ctrlMatch && shiftMatch && altMatch && metaMatch) {
        // 阻止默认行为（默认阻止）
        if (shortcut.preventDefault !== false) {
          event.preventDefault()
          event.stopPropagation()
        }

        try {
          await shortcut.handler()
        } catch (error: any) {
          console.error('快捷键处理错误:', error)
          ElMessage.error(error.message || '操作失败')
        }
        break
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    handleKeyDown,
  }
}

/**
 * 预定义的常用快捷键
 */
export function getCommonShortcuts(): KeyboardShortcut[] {
  const router = useRouter()
  
  return [
    {
      key: 'k',
      ctrl: true,
      handler: () => {
        // Ctrl+K: 快速搜索（可以打开搜索框）
        ElMessage.info('快速搜索功能（待实现）')
      },
      description: '快速搜索',
    },
    {
      key: 'n',
      ctrl: true,
      handler: () => {
        // Ctrl+N: 新建配置
        ElMessage.info('新建配置功能（待实现）')
      },
      description: '新建配置',
    },
    {
      key: 's',
      ctrl: true,
      handler: () => {
        // Ctrl+S: 保存（如果当前在编辑页面）
        ElMessage.info('保存功能（待实现）')
      },
      description: '保存',
    },
    {
      key: 'Escape',
      handler: () => {
        // Escape: 关闭对话框或返回上一页
        // 如果当前路径不是根路径，返回上一页
        if (router.currentRoute.value.path !== '/') {
          router.back()
        }
      },
      description: '返回/关闭',
    },
  ]
}

// 导出默认快捷键列表（用于初始化）
export const commonShortcuts: KeyboardShortcut[] = []

