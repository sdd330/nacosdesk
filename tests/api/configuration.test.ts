/**
 * 配置管理 API 测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getConfigList,
  getConfigDetail,
  updateConfig,
  deleteConfig,
  getHistoryList,
  getHistoryDetail,
  rollbackConfig,
  getExportConfigUrl,
  importConfig,
} from '@/api/configuration'
import * as requestUtils from '@/utils/request'
import type { ConfigListResponse, ConfigListItem } from '@/api/configuration'

// Mock HTTP 客户端
vi.mock('@/utils/request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('configuration API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getConfigList', () => {
    const mockConfigListResponse: ConfigListResponse = {
      pageNumber: 1,
      pageSize: 10,
      totalCount: 2,
      pageItems: [
        {
          id: '1',
          dataId: 'test-config',
          group: 'DEFAULT_GROUP',
          appName: 'test-app',
          content: 'test content',
          md5: 'abc123',
          type: 'text',
        },
        {
          id: '2',
          dataId: 'test-config-2',
          group: 'DEFAULT_GROUP',
          content: 'test content 2',
          md5: 'def456',
        },
      ],
    }

    it('应该成功获取配置列表', async () => {
      vi.mocked(requestUtils.default.get).mockResolvedValue(mockConfigListResponse)

      const result = await getConfigList({
        namespaceId: 'public',
        pageNo: 1,
        pageSize: 10,
      })

      expect(requestUtils.default.get).toHaveBeenCalledWith(
        '/v3/console/cs/config/list',
        expect.objectContaining({
          params: expect.objectContaining({
            namespaceId: 'public',
          }),
        })
      )
      expect(result).toEqual(mockConfigListResponse)
    })

    it('应该支持搜索参数', async () => {
      vi.mocked(requestUtils.default.get).mockResolvedValue(mockConfigListResponse)

      await getConfigList({
        dataId: 'test-config',
        groupName: 'DEFAULT_GROUP',
        search: 'accurate',
      })

      expect(requestUtils.default.get).toHaveBeenCalledWith(
        '/v3/console/cs/config/list',
        {
          params: {
            dataId: 'test-config',
            groupName: 'DEFAULT_GROUP',
            search: 'accurate',
          },
        }
      )
    })
  })

  describe('getConfigDetail', () => {
    const mockConfig: ConfigListItem = {
      id: '1',
      dataId: 'test-config',
      group: 'DEFAULT_GROUP',
      content: 'test content',
      md5: 'abc123',
    }

    it('应该成功获取配置详情', async () => {
      vi.mocked(requestUtils.default.get).mockResolvedValue(mockConfig)

      const result = await getConfigDetail({
        dataId: 'test-config',
        group: 'DEFAULT_GROUP',
        namespaceId: 'public',
      })

      expect(requestUtils.default.get).toHaveBeenCalledWith(
        '/v3/console/cs/config',
        {
          params: {
            dataId: 'test-config',
            group: 'DEFAULT_GROUP',
            namespaceId: 'public',
          },
        }
      )
      expect(result).toEqual(mockConfig)
    })
  })

  describe('updateConfig', () => {
    it('应该成功更新配置', async () => {
      const mockResponse = undefined
      vi.mocked(requestUtils.default.put).mockResolvedValue(mockResponse)

      const result = await updateConfig({
        dataId: 'test-config',
        group: 'DEFAULT_GROUP',
        content: 'updated content',
        namespaceId: 'public',
      })

      expect(requestUtils.default.put).toHaveBeenCalledWith(
        '/v3/console/cs/config',
        expect.objectContaining({
          dataId: 'test-config',
          group: 'DEFAULT_GROUP',
          content: 'updated content',
        })
      )
      expect(result).toBeUndefined()
    })
  })

  describe('deleteConfig', () => {
    it('应该成功删除配置', async () => {
      const mockResponse = { code: 0, message: 'success' }
      vi.mocked(requestUtils.default.delete).mockResolvedValue(mockResponse)

      const result = await deleteConfig({
        dataId: 'test-config',
        group: 'DEFAULT_GROUP',
        namespaceId: 'public',
      })

      expect(requestUtils.default.delete).toHaveBeenCalledWith(
        '/v3/console/cs/config',
        {
          params: {
            dataId: 'test-config',
            group: 'DEFAULT_GROUP',
            namespaceId: 'public',
          },
        }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('rollbackConfig', () => {
    it('应该成功回滚配置', async () => {
      const mockResponse = { code: 0, message: 'Rollback successful' }
      vi.mocked(requestUtils.default.post).mockResolvedValue(mockResponse)

      const result = await rollbackConfig({
        dataId: 'test-config',
        groupName: 'DEFAULT_GROUP',
        nid: '123',
        namespaceId: 'public',
      })

      expect(requestUtils.default.post).toHaveBeenCalledWith(
        '/v3/console/cs/config/rollback',
        undefined,
        {
          params: {
            dataId: 'test-config',
            groupName: 'DEFAULT_GROUP',
            nid: '123',
            namespaceId: 'public',
          },
        }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getExportConfigUrl', () => {
    it('应该生成正确的导出 URL', () => {
      const url = getExportConfigUrl({
        dataId: 'test-config',
        group: 'DEFAULT_GROUP',
        namespaceId: 'public',
        exportV2: true,
      })

      expect(url).toContain('/nacos/v1/cs/configs')
      expect(url).toContain('dataId=test-config')
      expect(url).toContain('group=DEFAULT_GROUP')
      expect(url).toContain('exportV2=true')
    })

    it('应该使用 export 参数当 exportV2 为 false', () => {
      const url = getExportConfigUrl({
        dataId: 'test-config',
        exportV2: false,
      })

      expect(url).toContain('export=true')
      expect(url).not.toContain('exportV2=true')
    })
  })

  describe('importConfig', () => {
    it('应该成功导入配置', async () => {
      const mockFile = new File(['test'], 'test.zip', { type: 'application/zip' })
      const mockResponse = { code: 0, message: 'Import successful' }

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await importConfig({
        file: mockFile,
        namespaceId: 'public',
        policy: 'abort',
      })

      expect(global.fetch).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('应该正确处理导入错误', async () => {
      const mockFile = new File(['test'], 'test.zip', { type: 'application/zip' })

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ code: 1, message: 'Import failed' }),
      })

      await expect(
        importConfig({
          file: mockFile,
          namespaceId: 'public',
        })
      ).rejects.toThrow()
    })
  })
})

