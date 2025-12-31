/**
 * 应用状态管理
 * 管理服务器状态、功能模式等全局状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getServerState, getGuide } from '@/api/auth'

export const useAppStore = defineStore('app', () => {
  // State
  const version = ref<string | null>(null)
  const standaloneMode = ref<string>('')
  const functionMode = ref<string>('')
  const loginPageEnabled = ref<string>('')
  const authEnabled = ref<string>('')
  const notice = ref<string>('')
  const consoleUiEnable = ref<string>('')
  const authAdminRequest = ref<string>('')
  const guideMsg = ref<string>('')
  const configRetentionDays = ref<number>(30)
  const startupMode = ref<string>('')

  // Getters
  const isNamingMode = computed(() => functionMode.value === 'naming')
  const isConfigMode = computed(() => functionMode.value === 'config')
  const isMixedMode = computed(() => !isNamingMode.value && !isConfigMode.value)

  /**
   * 获取服务器状态
   */
  async function fetchServerState() {
    try {
      const res = await getServerState()
      version.value = res.version || null
      standaloneMode.value = res.standalone_mode || ''
      functionMode.value = res.function_mode || ''
      loginPageEnabled.value = res.login_page_enabled || ''
      authEnabled.value = res.auth_enabled || ''
      consoleUiEnable.value = res.console_ui_enabled || ''
      authAdminRequest.value = res.auth_admin_request || ''
      configRetentionDays.value = res.config_retention_days || 30
      startupMode.value = res.startup_mode || ''
      
      return res
    } catch (error) {
      console.error('Failed to get server state:', error)
      throw error
    }
  }

  /**
   * 获取公告
   */
  async function fetchNotice(language = 'zh-CN') {
    try {
      const { getNotice } = await import('@/api/auth')
      const res = await getNotice(language)
      notice.value = res.data || ''
    } catch (error) {
      console.error('Failed to get notice:', error)
    }
  }

  /**
   * 获取引导信息
   */
  async function fetchGuide() {
    try {
      const res = await getGuide()
      guideMsg.value = res.data || ''
      return res
    } catch (error) {
      console.error('Failed to get guide:', error)
      throw error
    }
  }

  return {
    // State
    version,
    standaloneMode,
    functionMode,
    loginPageEnabled,
    authEnabled,
    notice,
    consoleUiEnable,
    authAdminRequest,
    guideMsg,
    configRetentionDays,
    startupMode,
    // Getters
    isNamingMode,
    isConfigMode,
    isMixedMode,
    // Actions
    fetchServerState,
    fetchNotice,
    fetchGuide,
  }
})

