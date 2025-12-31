/**
 * 命名空间相关 API
 * 参考 console-ui/src/pages/NameSpace/NameSpace.js
 */

import httpClient from '@/utils/request'

export interface Namespace {
  namespace: string
  namespaceShowName: string
  namespaceDesc?: string
  type?: number
  quota?: number
  configCount?: number
  groupCount?: number
}

export interface NamespaceListResponse {
  code: number
  data: Namespace[]
  message?: string
}

export interface NamespaceDetailResponse {
  code: number
  data: Namespace
  message?: string
}

export interface NamespaceExistResponse {
  code: number
  data: boolean
  message?: string
}

/**
 * 获取命名空间列表
 */
export function getNamespaceList(): Promise<NamespaceListResponse> {
  return httpClient.get<NamespaceListResponse>('/v3/console/core/namespace/list')
}

/**
 * 获取命名空间详情
 */
export function getNamespaceDetail(namespaceId: string): Promise<NamespaceDetailResponse> {
  return httpClient.get<NamespaceDetailResponse>('/v3/console/core/namespace', {
    params: { namespaceId },
  })
}

/**
 * 创建命名空间
 */
export function createNamespace(params: {
  customNamespaceId?: string
  namespaceName: string
  namespaceDesc?: string
}): Promise<{ code: number; data: boolean; message?: string }> {
  return httpClient.post<{ code: number; data: boolean; message?: string }>(
    '/v3/console/core/namespace',
    params
  )
}

/**
 * 更新命名空间
 */
export function updateNamespace(params: {
  namespaceId: string
  namespaceName: string
  namespaceDesc?: string
}): Promise<{ code: number; data: boolean; message?: string }> {
  return httpClient.put<{ code: number; data: boolean; message?: string }>(
    '/v3/console/core/namespace',
    params
  )
}

/**
 * 删除命名空间
 */
export function deleteNamespace(namespaceId: string): Promise<{ code: number; data: boolean; message?: string }> {
  return httpClient.delete<{ code: number; data: boolean; message?: string }>('/v3/console/core/namespace', {
    params: { namespaceId },
  })
}

/**
 * 检查命名空间是否存在
 */
export function checkNamespaceExist(customNamespaceId: string): Promise<NamespaceExistResponse> {
  return httpClient.get<NamespaceExistResponse>('/v3/console/core/namespace/exist', {
    params: { customNamespaceId },
  })
}

