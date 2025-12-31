/**
 * 通知管理 Composable
 * 提供统一的通知功能，支持应用内通知和系统通知
 */

import { ElNotification } from 'element-plus'
import { isTauri } from '@/utils/tauriApi'

export interface NotificationOptions {
  title: string
  message?: string
  type?: 'success' | 'warning' | 'info' | 'error'
  duration?: number // 持续时间（毫秒），0 表示不自动关闭
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  onClick?: () => void
  onClose?: () => void
}

/**
 * 显示通知
 * 在 Tauri 环境中，优先使用系统通知；否则使用 Element Plus 通知
 */
export async function showNotification(options: NotificationOptions) {
  const {
    title,
    message = '',
    type = 'info',
    duration = 4500,
    position = 'top-right',
    onClick,
    onClose,
  } = options

  // 在 Tauri 环境中，尝试使用系统通知
  if (isTauri()) {
    try {
      // 检查浏览器是否支持 Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body: message,
          icon: '/favicon.ico', // 可以设置应用图标
          tag: `nacos-${Date.now()}`, // 防止重复通知
        })

        if (onClick) {
          notification.onclick = onClick
        }

        if (onClose) {
          notification.onclose = onClose
        }

        // 自动关闭通知
        if (duration > 0) {
          setTimeout(() => {
            notification.close()
          }, duration)
        }

        return
      } else if ('Notification' in window && Notification.permission === 'default') {
        // 请求通知权限
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          // 权限授予后再次调用
          return showNotification(options)
        }
      }
    } catch (error) {
      console.warn('System notification failed, falling back to Element Plus:', error)
    }
  }

  // 使用 Element Plus 通知（应用内通知）
  ElNotification({
    title,
    message,
    type,
    duration,
    position,
    onClick,
    onClose,
  })
}

/**
 * 请求通知权限
 * 仅在 Tauri 环境中有效
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isTauri() || !('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

/**
 * 检查通知权限
 */
export function checkNotificationPermission(): 'granted' | 'denied' | 'default' {
  if (!('Notification' in window)) {
    return 'denied'
  }
  return Notification.permission
}

/**
 * 通知管理 Composable
 */
export function useNotification() {
  /**
   * 成功通知
   */
  const success = (title: string, message?: string, options?: Partial<NotificationOptions>) => {
    return showNotification({
      title,
      message,
      type: 'success',
      ...options,
    })
  }

  /**
   * 警告通知
   */
  const warning = (title: string, message?: string, options?: Partial<NotificationOptions>) => {
    return showNotification({
      title,
      message,
      type: 'warning',
      ...options,
    })
  }

  /**
   * 信息通知
   */
  const info = (title: string, message?: string, options?: Partial<NotificationOptions>) => {
    return showNotification({
      title,
      message,
      type: 'info',
      ...options,
    })
  }

  /**
   * 错误通知
   */
  const error = (title: string, message?: string, options?: Partial<NotificationOptions>) => {
    return showNotification({
      title,
      message,
      type: 'error',
      duration: 6000, // 错误通知显示更长时间
      ...options,
    })
  }

  return {
    show: showNotification,
    success,
    warning,
    info,
    error,
    requestPermission: requestNotificationPermission,
    checkPermission: checkNotificationPermission,
  }
}

