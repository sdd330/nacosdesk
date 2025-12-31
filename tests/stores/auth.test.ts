/**
 * 认证 Store 测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import * as authApi from '@/api/auth'
import * as storageUtils from '@/utils/storage'
import type { LoginParams, LoginResponse, ServerState } from '@/types/api'

// Mock 依赖
vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  getServerState: vi.fn(),
  getGuide: vi.fn(),
}))

vi.mock('@/utils/storage', () => ({
  storage: {
    getToken: vi.fn(),
    setToken: vi.fn(),
    removeToken: vi.fn(),
    hasToken: vi.fn(),
  },
}))

describe('auth store', () => {
  beforeEach(() => {
    // 创建新的 Pinia 实例
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('userLogin', () => {
    it('应该成功登录并保存 token', async () => {
      const store = useAuthStore()
      const mockLoginParams: LoginParams = {
        username: 'nacos',
        password: 'nacos',
      }
      const mockLoginResponse: LoginResponse = {
        accessToken: 'test-token',
        tokenTtl: 18000,
        globalAdmin: true,
        username: 'nacos',
      }

      // Mock storage.getToken 返回 null（初始状态）
      vi.mocked(storageUtils.storage.getToken).mockReturnValue(null)
      vi.mocked(authApi.login).mockResolvedValue(mockLoginResponse)
      vi.mocked(storageUtils.storage.setToken).mockImplementation(() => {})

      const result = await store.userLogin(mockLoginParams)

      expect(authApi.login).toHaveBeenCalledWith(mockLoginParams)
      expect(storageUtils.storage.setToken).toHaveBeenCalledWith(JSON.stringify(mockLoginResponse))
      expect(store.token).toBe(JSON.stringify(mockLoginResponse))
      expect(store.isAuthenticated).toBe(true)
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
      expect(result).toEqual(mockLoginResponse)
    })

    it('应该在登录过程中设置 loading 状态', async () => {
      const store = useAuthStore()
      const mockLoginParams: LoginParams = {
        username: 'nacos',
        password: 'nacos',
      }
      const mockLoginResponse: LoginResponse = {
        accessToken: 'test-token',
        tokenTtl: 18000,
        globalAdmin: true,
        username: 'nacos',
      }

      // 创建一个延迟的 Promise 来测试 loading 状态
      let resolveLogin: ((value: LoginResponse) => void) | undefined
      const loginPromise = new Promise<LoginResponse>((resolve) => {
        resolveLogin = resolve
      })

      vi.mocked(authApi.login).mockReturnValue(loginPromise)
      vi.mocked(storageUtils.storage.setToken).mockImplementation(() => {})

      const loginPromiseResult = store.userLogin(mockLoginParams)

      // 检查 loading 状态
      expect(store.loading).toBe(true)

      // 完成登录
      if (resolveLogin) {
        resolveLogin(mockLoginResponse)
      }
      await loginPromiseResult

      // 检查 loading 状态已重置
      expect(store.loading).toBe(false)
    })

    it('应该处理登录错误', async () => {
      const store = useAuthStore()
      const mockLoginParams: LoginParams = {
        username: 'nacos',
        password: 'wrong-password',
      }
      const error = new Error('Invalid username or password')

      // Mock storage.getToken 返回 null（初始状态）
      vi.mocked(storageUtils.storage.getToken).mockReturnValue(null)
      vi.mocked(authApi.login).mockRejectedValue(error)

      await expect(store.userLogin(mockLoginParams)).rejects.toThrow(
        'Invalid username or password'
      )

      expect(store.error).toBe('Invalid username or password')
      expect(store.loading).toBe(false)
      // token 可能是 null 或 undefined（取决于 storage.getToken 的返回值）
      expect(store.token).toBeFalsy()
      expect(store.isAuthenticated).toBe(false)
    })

    it('应该处理没有错误消息的登录错误', async () => {
      const store = useAuthStore()
      const mockLoginParams: LoginParams = {
        username: 'nacos',
        password: 'nacos',
      }
      const error = new Error()

      vi.mocked(authApi.login).mockRejectedValue(error)

      await expect(store.userLogin(mockLoginParams)).rejects.toThrow()

      expect(store.error).toBe('登录失败，请重试')
      expect(store.loading).toBe(false)
    })
  })

  describe('checkServerState', () => {
    it('应该成功获取服务器状态', async () => {
      const store = useAuthStore()
      const mockServerState: ServerState = {
        console_ui_enabled: 'true',
        version: '3.0.0',
        standalone_mode: 'true',
        function_mode: 'naming',
        login_page_enabled: 'true',
        auth_enabled: 'true',
        auth_admin_request: 'false',
        startup_mode: 'standalone',
        config_retention_days: 30,
      }

      vi.mocked(authApi.getServerState).mockResolvedValue(mockServerState)

      const result = await store.checkServerState()

      expect(authApi.getServerState).toHaveBeenCalled()
      expect(store.serverState).toEqual(mockServerState)
      expect(store.guideMsg).toBe('')
      expect(result).toEqual(mockServerState)
    })

    it('应该在 console_ui_enabled 为 false 时获取引导信息', async () => {
      const store = useAuthStore()
      const mockServerState: ServerState = {
        console_ui_enabled: 'false',
        version: '3.0.0',
        standalone_mode: 'true',
        function_mode: 'naming',
        login_page_enabled: 'true',
        auth_enabled: 'true',
        auth_admin_request: 'false',
        startup_mode: 'standalone',
        config_retention_days: 30,
      }
      const mockGuide = { data: 'Please enable console UI' }

      vi.mocked(authApi.getServerState).mockResolvedValue(mockServerState)
      vi.mocked(authApi.getGuide).mockResolvedValue(mockGuide)

      await store.checkServerState()

      expect(authApi.getGuide).toHaveBeenCalled()
      expect(store.guideMsg).toBe('Please enable console UI')
    })

    it('应该处理获取服务器状态错误', async () => {
      const store = useAuthStore()
      const error = new Error('Network error')

      vi.mocked(authApi.getServerState).mockRejectedValue(error)

      await expect(store.checkServerState()).rejects.toThrow('Network error')

      expect(store.error).toBe('无法连接到服务器')
    })
  })

  describe('logout', () => {
    it('应该清除所有状态并删除 token', () => {
      const store = useAuthStore()
      
      // 设置初始状态
      store.token = JSON.stringify({
        accessToken: 'test-token',
        username: 'nacos',
      })
      store.serverState = {
        console_ui_enabled: 'true',
        version: '3.0.0',
      } as ServerState
      store.guideMsg = 'test guide'
      store.error = 'test error'

      vi.mocked(storageUtils.storage.removeToken).mockImplementation(() => {})

      store.logout()

      expect(storageUtils.storage.removeToken).toHaveBeenCalled()
      expect(store.token).toBe(null)
      expect(store.serverState).toBe(null)
      expect(store.guideMsg).toBe('')
      expect(store.error).toBe(null)
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('clearError', () => {
    it('应该清除错误状态', () => {
      const store = useAuthStore()
      store.error = 'test error'

      store.clearError()

      expect(store.error).toBe(null)
    })
  })

  describe('computed properties', () => {
    it('isAuthenticated 应该在有 token 时返回 true', () => {
      const store = useAuthStore()
      store.token = JSON.stringify({ accessToken: 'test-token' })

      expect(store.isAuthenticated).toBe(true)
    })

    it('isAuthenticated 应该在无 token 时返回 false', () => {
      const store = useAuthStore()
      store.token = null

      expect(store.isAuthenticated).toBe(false)
    })

    it('consoleUiEnable 应该在 console_ui_enabled 不为 false 时返回 true', () => {
      const store = useAuthStore()
      store.serverState = {
        console_ui_enabled: 'true',
      } as ServerState

      expect(store.consoleUiEnable).toBe(true)
    })

    it('consoleUiEnable 应该在 console_ui_enabled 为 false 时返回 false', () => {
      const store = useAuthStore()
      store.serverState = {
        console_ui_enabled: 'false',
      } as ServerState

      expect(store.consoleUiEnable).toBe(false)
    })

    it('userInfo 应该从 token 中解析用户信息', () => {
      const store = useAuthStore()
      const tokenData = {
        accessToken: 'test-token',
        username: 'nacos',
      }
      store.token = JSON.stringify(tokenData)

      expect(store.userInfo).toEqual({
        username: 'nacos',
        accessToken: 'test-token',
      })
    })

    it('userInfo 应该在 token 无效时返回 null', () => {
      const store = useAuthStore()
      store.token = 'invalid-json'

      expect(store.userInfo).toBe(null)
    })

    it('userInfo 应该在无 token 时返回 null', () => {
      const store = useAuthStore()
      store.token = null

      expect(store.userInfo).toBe(null)
    })
  })
})
