/**
 * 性能监控和优化工具
 * 用于测量和优化 Vapor Mode 和 Alien Signals 的性能
 */

import { onMounted, onUnmounted, ref } from 'vue'

interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  updateCount: number
}

/**
 * 性能测量工具
 */
export function usePerformance() {
  const metrics = ref<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    updateCount: 0,
  })

  /**
   * 测量函数执行时间
   */
  function measureTime<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    const duration = end - start

    metrics.value.renderTime = duration
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)

    return result
  }

  /**
   * 测量异步函数执行时间
   */
  async function measureTimeAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    const duration = end - start

    metrics.value.renderTime = duration
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)

    return result
  }

  /**
   * 获取内存使用情况
   */
  function getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return memory.usedJSHeapSize / 1048576 // 转换为 MB
    }
    return 0
  }

  /**
   * 记录内存使用
   */
  function recordMemory() {
    const memory = getMemoryUsage()
    metrics.value.memoryUsage = memory
    console.log(`[Memory] Used: ${memory.toFixed(2)} MB`)
  }

  /**
   * 批量更新优化
   * 使用 requestAnimationFrame 批量处理更新
   */
  function batchUpdate(updates: Array<() => void>) {
    requestAnimationFrame(() => {
      updates.forEach((update) => update())
      metrics.value.updateCount += updates.length
    })
  }

  /**
   * 防抖优化
   */
  function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number = 300
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        fn(...args)
      }, delay)
    }
  }

  /**
   * 节流优化
   */
  function throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number = 100
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args)
        inThrottle = true
        setTimeout(() => {
          inThrottle = false
        }, limit)
      }
    }
  }

  /**
   * 监控组件性能
   */
  function useComponentPerformance(componentName: string) {
    const renderStart = ref(0)

    onMounted(() => {
      renderStart.value = performance.now()
      recordMemory()
    })

    onUnmounted(() => {
      const renderTime = performance.now() - renderStart.value
      console.log(`[Component] ${componentName} render time: ${renderTime.toFixed(2)}ms`)
      recordMemory()
    })
  }

  return {
    metrics,
    measureTime,
    measureTimeAsync,
    getMemoryUsage,
    recordMemory,
    batchUpdate,
    debounce,
    throttle,
    useComponentPerformance,
  }
}

/**
 * 性能对比工具
 * 用于对比传统模式和 Vapor Mode 的性能差异
 */
export function usePerformanceComparison() {
  const traditionalMode = ref<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    updateCount: 0,
  })

  const vaporMode = ref<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    updateCount: 0,
  })

  /**
   * 对比性能指标
   */
  function compare() {
    const renderImprovement =
      ((traditionalMode.value.renderTime - vaporMode.value.renderTime) /
        traditionalMode.value.renderTime) *
      100

    const memoryImprovement =
      ((traditionalMode.value.memoryUsage - vaporMode.value.memoryUsage) /
        traditionalMode.value.memoryUsage) *
      100

    console.log('=== Performance Comparison ===')
    console.log(`Render Time Improvement: ${renderImprovement.toFixed(2)}%`)
    console.log(`Memory Usage Improvement: ${memoryImprovement.toFixed(2)}%`)
    console.log('=============================')

    return {
      renderImprovement,
      memoryImprovement,
    }
  }

  return {
    traditionalMode,
    vaporMode,
    compare,
  }
}

