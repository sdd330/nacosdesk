/**
 * 集群管理相关 API
 * 参考 console-ui/src/pages/ClusterManagement/ClusterNodeList/ClusterNodeList.js
 */

import httpClient from '@/utils/request'

export interface ClusterNode {
  address: string
  state: 'UP' | 'DOWN' | 'SUSPICIOUS' | string
  extendInfo?: Record<string, any>
  voteFor?: string
  [key: string]: any
}

export interface ClusterNodeListParams {
  pageNo?: number
  pageSize?: number
  keyword?: string
  withInstances?: boolean
}

export interface ClusterNodeListResponse {
  code: number
  data: ClusterNode[]
  count: number
  message?: string
}

/**
 * 获取集群节点列表
 */
export function getClusterNodes(params: ClusterNodeListParams): Promise<ClusterNodeListResponse> {
  return httpClient.get<ClusterNodeListResponse>('/v3/console/core/cluster/nodes', { params })
}

/**
 * 节点离开集群
 */
export function leaveCluster(nodes: string[]): Promise<{ code: number; message?: string }> {
  // 从 localStorage 获取 accessToken
  const tokenStr = localStorage.getItem('token') || '{}'
  let accessToken = ''
  try {
    const token = JSON.parse(tokenStr)
    accessToken = token.accessToken || ''
  } catch (e) {
    // 忽略解析错误
  }

  return httpClient.post<{ code: number; message?: string }>(
    `/v3/console/core/cluster/server/leave${accessToken ? `?accessToken=${accessToken}` : ''}`,
    nodes
  )
}

