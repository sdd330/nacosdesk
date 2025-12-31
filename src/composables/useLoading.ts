/**
 * Loading 管理 Composable
 * 计数式 Loading，支持多个异步操作同时进行
 * 参考 console-ui/src/globalLib.js 中的 nacosUtils
 */

import { ref, computed } from 'vue'
import { ElLoading } from 'element-plus'
import type { LoadingOptions } from 'element-plus'
import eventBus from '@/utils/eventBus'

// Loading 状态
const loadingCount = ref(0)
const loadingState = ref<LoadingOptions>({
  text: '加载中...',
  background: 'rgba(0, 0, 0, 0.7)',
})

let loadingInstance: ReturnType<typeof ElLoading.service> | null = null

/**
 * 改变 Loading 的样式
 */
export function changeLoadingAttr(options: Partial<LoadingOptions>): void {
  if (typeof options === 'object') {
    loadingState.value = {
      ...loadingState.value,
      ...options,
    }
  }
}

/**
 * 打开 Loading
 * @param options Loading 选项（可选）
 */
export function openLoading(options?: Partial<LoadingOptions>): void {
  loadingCount.value++

  if (options) {
    changeLoadingAttr(options)
  }

  // 如果还没有 Loading 实例，创建一个
  if (!loadingInstance) {
    loadingInstance = ElLoading.service({
      ...loadingState.value,
      lock: true,
    })
  }

  // 触发事件
  eventBus.trigger('nacosLoadingEvent', {
    visible: true,
    spinning: true,
    ...loadingState.value,
  })
}

/**
 * 关闭 Loading
 * 只有当 loadingCount 小于等于 0 时才会关闭 Loading
 */
export function closeLoading(): void {
  loadingCount.value--

  if (loadingCount.value <= 0) {
    loadingCount.value = 0

    // 关闭 Loading 实例
    if (loadingInstance) {
      loadingInstance.close()
      loadingInstance = null
    }

    // 触发事件
    eventBus.trigger('nacosLoadingEvent', {
      visible: false,
      spinning: false,
      ...loadingState.value,
    })
  }
}

/**
 * 关闭所有 Loading
 */
export function closeAllLoading(): void {
  loadingCount.value = 0

  // 关闭 Loading 实例
  if (loadingInstance) {
    loadingInstance.close()
    loadingInstance = null
  }

  // 触发事件
  eventBus.trigger('nacosLoadingEvent', {
    visible: false,
    spinning: false,
    ...loadingState.value,
  })
}

/**
 * 获取当前 Loading 计数
 */
export function getLoadingCount(): number {
  return loadingCount.value
}

/**
 * 检查是否正在 Loading
 */
export function isLoading(): boolean {
  return loadingCount.value > 0
}

/**
 * useLoading Composable
 * 提供响应式的 Loading 状态和方法
 */
export function useLoading() {
  const isVisible = computed(() => loadingCount.value > 0)

  return {
    // 状态
    isVisible,
    loadingCount: computed(() => loadingCount.value),
    // 方法
    openLoading,
    closeLoading,
    closeAllLoading,
    changeLoadingAttr,
    getLoadingCount,
    isLoading,
  }
}

export default {
  openLoading,
  closeLoading,
  closeAllLoading,
  changeLoadingAttr,
  getLoadingCount,
  isLoading,
  useLoading,
}

