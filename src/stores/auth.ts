/**
 * 认证状态管理
 * 使用最新 Pinia 最佳实践优化
 */

import { defineStore, storeToRefs } from 'pinia'
import { ref, computed } from 'vue'
import { login, getServerState, getGuide } from '@/api/auth'
import type { LoginParams, ServerState } from '@/types/api'
import { storage } from '@/utils/storage'

/**
 * 认证 Store
 * 
 * 使用 Composition API 风格（setup store）
 * 优势：
 * - 更好的 TypeScript 支持
 * - 自动代码补全
 * - 更好的性能（与 Vapor Mode 兼容）
 */
export const useAuthStore = defineStore('auth', () => {
  // ========== State ==========
  // ✅ 使用 ref 定义响应式状态
  // 从 localStorage 初始化 token
  const token = ref<string | null>(storage.getToken())
  const serverState = ref<ServerState | null>(null)
  const guideMsg = ref<string>('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ========== Getters ==========
  // ✅ 使用 computed 定义派生状态
  const isAuthenticated = computed(() => !!token.value)
  
  const consoleUiEnable = computed(
    () => serverState.value?.console_ui_enabled !== 'false'
  )

  // ✅ 计算属性：用户信息（从 token 解析）
  const userInfo = computed(() => {
    if (!token.value) return null
    try {
      const tokenData = JSON.parse(token.value)
      return {
        username: tokenData.username || '',
        accessToken: tokenData.accessToken || '',
      }
    } catch {
      return null
    }
  })

  // ========== Actions ==========
  
  /**
   * 用户登录
   * ✅ 使用 async/await 处理异步操作
   * ✅ 错误处理和状态管理
   */
  async function userLogin(params: LoginParams) {
    loading.value = true
    error.value = null
    
    try {
      const res = await login(params)
      const tokenData = JSON.stringify(res)
      
      // ✅ 批量更新状态
      storage.setToken(tokenData)
      token.value = tokenData
      error.value = null
      
      return res
    } catch (err: any) {
      error.value = err.message || '登录失败，请重试'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 检查服务器状态
   * ✅ 错误处理和状态更新
   */
  async function checkServerState() {
    try {
      const res = await getServerState()
      serverState.value = res

      // ✅ 条件更新 guideMsg
      if (res.console_ui_enabled === 'false') {
        const guideRes = await getGuide()
        guideMsg.value = guideRes.data || ''
      } else {
        guideMsg.value = ''
      }

      return res
    } catch (err) {
      console.error('Failed to get server state:', err)
      error.value = '无法连接到服务器'
      throw err
    }
  }

  /**
   * 退出登录
   * ✅ 清理所有状态
   */
  function logout() {
    storage.removeToken()
    token.value = null
    serverState.value = null
    guideMsg.value = ''
    error.value = null
  }

  /**
   * 重置错误状态
   */
  function clearError() {
    error.value = null
  }

  /**
   * 刷新 token（如果需要）
   */
  async function refreshToken() {
    // TODO: 实现 token 刷新逻辑
    if (token.value) {
      // 刷新逻辑
    }
  }

  // ========== 返回 Store API ==========
  return {
    // State
    token,
    serverState,
    guideMsg,
    loading,
    error,
    
    // Getters
    isAuthenticated,
    consoleUiEnable,
    userInfo,
    
    // Actions
    userLogin,
    checkServerState,
    logout,
    clearError,
    refreshToken,
  }
})

/**
 * Store 辅助函数
 * 使用 storeToRefs 保持响应式
 * 
 * 使用示例：
 * ```typescript
 * const authStore = useAuthStore()
 * const { token, isAuthenticated } = storeToRefs(authStore)
 * ```
 */
export function useAuthStoreRefs() {
  const store = useAuthStore()
  return storeToRefs(store)
}
