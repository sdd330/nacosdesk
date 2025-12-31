/**
 * 服务管理 API 测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getServiceList,
  getServiceDetail,
  updateService,
  deleteService,
  getSubscribers,
} from '@/api/service'
import * as requestUtils from '@/utils/request'
import type { ServiceListResponse, ServiceDetail } from '@/api/service'

// Mock HTTP 客户端
vi.mock('@/utils/request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('service API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getServiceList', () => {
    const mockServiceListResponse: ServiceListResponse = {
      count: 2,
      serviceList: [
        {
          name: 'test-service',
          groupName: 'DEFAULT_GROUP',
          clusterCount: 1,
          ipCount: 2,
          healthyInstanceCount: 2,
          triggerFlag: false,
        },
        {
          name: 'test-service-2',
          groupName: 'DEFAULT_GROUP',
          clusterCount: 1,
          ipCount: 1,
          healthyInstanceCount: 1,
          triggerFlag: false,
        },
      ],
    }

    it('应该成功获取服务列表', async () => {
      vi.mocked(requestUtils.default.get).mockResolvedValue(mockServiceListResponse)

      const result = await getServiceList({
        namespaceId: 'public',
        pageNo: 1,
        pageSize: 10,
      })

      expect(requestUtils.default.get).toHaveBeenCalledWith(
        '/v3/console/ns/service/list',
        expect.objectContaining({
          params: expect.objectContaining({
            namespaceId: 'public',
          }),
        })
      )
      expect(result).toEqual(mockServiceListResponse)
    })
  })

  describe('getServiceDetail', () => {
    const mockServiceDetailResponse = {
      code: 0,
      data: {
        serviceName: 'test-service',
        groupName: 'DEFAULT_GROUP',
        protectThreshold: 0.0,
        metadata: {},
      },
    }

    it('应该成功获取服务详情', async () => {
      vi.mocked(requestUtils.default.get).mockResolvedValue(mockServiceDetailResponse)

      const result = await getServiceDetail({
        serviceName: 'test-service',
        groupName: 'DEFAULT_GROUP',
        namespaceId: 'public',
      })

      expect(requestUtils.default.get).toHaveBeenCalledWith(
        expect.stringContaining('/v3/console/ns/service'),
        undefined
      )
      expect(result).toEqual(mockServiceDetailResponse)
    })
  })


  describe('updateService', () => {
    it('应该成功更新服务', async () => {
      const mockResponse = { code: 0, message: 'success' }
      vi.mocked(requestUtils.default.put).mockResolvedValue(mockResponse)

      const result = await updateService({
        serviceName: 'test-service',
        groupName: 'DEFAULT_GROUP',
        protectThreshold: 0.5,
        namespaceId: 'public',
      })

      expect(requestUtils.default.put).toHaveBeenCalledWith(
        '/v3/console/ns/service',
        expect.objectContaining({
          serviceName: 'test-service',
          protectThreshold: 0.5,
        }),
        undefined
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteService', () => {
    it('应该成功删除服务', async () => {
      const mockResponse = { code: 0, message: 'success' }
      vi.mocked(requestUtils.default.delete).mockResolvedValue(mockResponse)

      const result = await deleteService({
        serviceName: 'test-service',
        groupName: 'DEFAULT_GROUP',
        namespaceId: 'public',
      })

      expect(requestUtils.default.delete).toHaveBeenCalledWith(
        expect.stringContaining('/v3/console/ns/service'),
        undefined
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getSubscribers', () => {
    const mockSubscribersResponse = {
      code: 0,
      data: {
        pageItems: [
          {
            agent: 'Java',
            app: 'test-app',
            ip: '127.0.0.1',
            port: 8080,
          },
        ],
        totalCount: 1,
      },
    }

    it('应该成功获取订阅者列表', async () => {
      vi.mocked(requestUtils.default.get).mockResolvedValue(mockSubscribersResponse)

      const result = await getSubscribers({
        serviceName: 'test-service',
        groupName: 'DEFAULT_GROUP',
        namespaceId: 'public',
      })

      expect(requestUtils.default.get).toHaveBeenCalledWith(
        expect.stringContaining('/v3/console/ns/service/subscribers'),
        expect.anything()
      )
      expect(result).toEqual(mockSubscribersResponse)
    })
  })
})

