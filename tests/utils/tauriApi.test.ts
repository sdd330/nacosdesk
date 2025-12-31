/**
 * Tauri API 工具测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isTauri, tauriLogin } from '@/utils/tauriApi'
import { invoke } from '@tauri-apps/api/tauri'

// Mock Tauri API
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}))

describe('tauriApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isTauri', () => {
    it('应该检测到 Tauri 环境', () => {
      // 设置 Tauri 环境
      ;(window as any).__TAURI_INTERNALS__ = {}

      expect(isTauri()).toBe(true)
    })

    it('应该检测到非 Tauri 环境', () => {
      // 清除 Tauri 环境
      delete (window as any).__TAURI_INTERNALS__

      expect(isTauri()).toBe(false)
    })
  })

  describe('tauriLogin', () => {
    it('应该成功调用 Tauri login 命令', async () => {
      const mockResponse = {
        access_token: 'test-token',
        token_ttl: 18000,
        global_admin: true,
        username: 'nacos',
      }

      vi.mocked(invoke).mockResolvedValue(mockResponse)

      const result = await tauriLogin('nacos', 'nacos')

      expect(invoke).toHaveBeenCalledWith('login', {
        username: 'nacos',
        password: 'nacos',
      })
      expect(result).toEqual(mockResponse)
    })

    it('应该正确处理登录错误', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('User not found'))

      await expect(tauriLogin('nacos', 'wrong-password')).rejects.toThrow(
        'User not found'
      )
    })

    it('应该转换错误消息格式', async () => {
      const error = { message: 'Invalid password' }
      vi.mocked(invoke).mockRejectedValue(error)

      await expect(tauriLogin('nacos', 'wrong')).rejects.toThrow(
        'Invalid password'
      )
    })

    it('应该处理没有消息的错误', async () => {
      vi.mocked(invoke).mockRejectedValue('Unknown error')

      // 当错误是字符串时，会直接抛出该字符串
      await expect(tauriLogin('nacos', 'nacos')).rejects.toThrow('Unknown error')
    })
  })
})

