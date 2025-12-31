/**
 * 认证 API 测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { login } from '@/api/auth'
import * as tauriApi from '@/utils/tauriApi'
import * as requestUtils from '@/utils/request'
import type { LoginParams, LoginResponse } from '@/types/api'

// Mock 依赖
vi.mock('@/utils/tauriApi', () => ({
  isTauri: vi.fn(),
  tauriLogin: vi.fn(),
}))

vi.mock('@/utils/request', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('login', () => {
    const mockLoginParams: LoginParams = {
      username: 'nacos',
      password: 'nacos',
    }

    const mockLoginResponse: LoginResponse = {
      accessToken: 'mock-token-123',
      tokenTtl: 18000,
      globalAdmin: true,
      username: 'nacos',
    }

    it('应该在 Tauri 环境中使用 Tauri API', async () => {
      // Mock Tauri 环境
      vi.mocked(tauriApi.isTauri).mockReturnValue(true)
      vi.mocked(tauriApi.tauriLogin).mockResolvedValue({
        access_token: 'mock-token-123',
        token_ttl: 18000,
        global_admin: true,
        username: 'nacos',
      })

      const result = await login(mockLoginParams)

      expect(tauriApi.isTauri).toHaveBeenCalled()
      expect(tauriApi.tauriLogin).toHaveBeenCalledWith('nacos', 'nacos')
      expect(result).toEqual(mockLoginResponse)
    })

    it('应该在 Web 环境中使用 HTTP API', async () => {
      // Mock Web 环境
      vi.mocked(tauriApi.isTauri).mockReturnValue(false)
      vi.mocked(requestUtils.default.post).mockResolvedValue(mockLoginResponse)

      const result = await login(mockLoginParams)

      expect(tauriApi.isTauri).toHaveBeenCalled()
      expect(requestUtils.default.post).toHaveBeenCalledWith(
        '/v3/auth/user/login',
        mockLoginParams
      )
      expect(result).toEqual(mockLoginResponse)
    })

    it('应该正确处理 Tauri API 响应格式转换', async () => {
      vi.mocked(tauriApi.isTauri).mockReturnValue(true)
      vi.mocked(tauriApi.tauriLogin).mockResolvedValue({
        access_token: 'tauri-token',
        token_ttl: 18000,
        global_admin: false,
        username: 'testuser',
      })

      const result = await login(mockLoginParams)

      expect(result).toEqual({
        accessToken: 'tauri-token',
        tokenTtl: 18000,
        globalAdmin: false,
        username: 'testuser',
      })
    })

    it('应该正确处理登录错误', async () => {
      vi.mocked(tauriApi.isTauri).mockReturnValue(false)
      vi.mocked(requestUtils.default.post).mockRejectedValue(
        new Error('Invalid username or password')
      )

      await expect(login(mockLoginParams)).rejects.toThrow(
        'Invalid username or password'
      )
    })

    it('应该正确处理 Tauri 登录错误', async () => {
      vi.mocked(tauriApi.isTauri).mockReturnValue(true)
      vi.mocked(tauriApi.tauriLogin).mockRejectedValue(new Error('User not found'))

      await expect(login(mockLoginParams)).rejects.toThrow('User not found')
    })
  })
})
