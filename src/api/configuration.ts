/**
 * 配置管理相关 API
 */

import httpClient from '@/utils/request'

export interface ConfigListItem {
  id: string
  dataId: string
  group: string
  appName?: string
  content?: string
  md5?: string
  type?: string
  tags?: string
  desc?: string
}

export interface ConfigListParams {
  dataId?: string
  groupName?: string
  appName?: string
  configTags?: string
  pageNo?: number
  pageSize?: number
  namespaceId?: string
  type?: string
  search?: 'accurate' | 'blur'
  configDetail?: string
}

export interface ConfigListResponse {
  pageNumber: number
  pageSize: number
  totalCount: number
  pageItems: ConfigListItem[]
}

/**
 * 获取配置列表
 */
export function getConfigList(params: ConfigListParams): Promise<ConfigListResponse> {
  return httpClient.get<ConfigListResponse>('/v3/console/cs/config/list', {
    params: params as Record<string, string>,
  })
}

/**
 * 搜索配置详情
 */
export function searchConfigDetail(params: ConfigListParams): Promise<ConfigListResponse> {
  return httpClient.get<ConfigListResponse>('/v3/console/cs/config/searchDetail', {
    params: params as Record<string, string>,
  })
}

/**
 * 获取配置详情
 */
export function getConfigDetail(params: {
  dataId: string
  group: string
  namespaceId?: string
}): Promise<{ content: string; md5: string; type: string }> {
  return httpClient.get('/v3/console/cs/config', { params })
}

/**
 * 删除配置
 */
export function deleteConfig(params: {
  dataId: string
  group: string
  namespaceId?: string
}): Promise<void> {
  return httpClient.delete('/v3/console/cs/config', { params })
}

/**
 * 发布配置
 */
export function publishConfig(params: {
  dataId: string
  group: string
  content: string
  type?: string
  namespaceId?: string
  appName?: string
  tags?: string
  desc?: string
}): Promise<void> {
  return httpClient.post('/v3/console/cs/config', params)
}

/**
 * 更新配置
 */
export function updateConfig(params: {
  dataId: string
  group: string
  content: string
  md5: string
  type?: string
  namespaceId?: string
  appName?: string
  tags?: string
  desc?: string
}): Promise<void> {
  return httpClient.put('/v3/console/cs/config', params)
}

/**
 * 历史版本相关接口
 */
export interface HistoryItem {
  id: string
  dataId: string
  groupName: string
  content: string
  md5: string
  opType: string
  publishType: 'formal' | 'gray'
  srcUser: string
  modifyTime: string
  extInfo?: string
}

export interface HistoryListParams {
  dataId: string
  groupName: string
  pageNo?: number
  pageSize?: number
}

export interface HistoryListResponse {
  pageNumber: number
  pageSize: number
  totalCount: number
  pageItems: HistoryItem[]
}

/**
 * 获取历史版本列表
 */
export function getHistoryList(params: HistoryListParams): Promise<HistoryListResponse> {
  return httpClient.get<HistoryListResponse>('/v3/console/cs/history/list', {
    params: params as Record<string, string>,
  })
}

/**
 * 获取历史版本详情
 */
export function getHistoryDetail(params: {
  dataId: string
  groupName: string
  nid: string
}): Promise<HistoryItem> {
  return httpClient.get<HistoryItem>('/v3/console/cs/history', {
    params: params as Record<string, string>,
  })
}

/**
 * 获取历史配置的 Data ID 和 Group 列表
 */
export function getHistoryConfigs(namespaceId?: string): Promise<Array<{ dataId: string; groupName: string }>> {
  return httpClient.get<Array<{ dataId: string; groupName: string }>>('/v3/console/cs/history/configs', {
    params: namespaceId ? { namespaceId } : undefined,
  })
}

/**
 * 监听查询相关接口
 */
export interface ListenerItem {
  dataId?: string
  group?: string
  ip?: string
  md5: string
}

export interface ListenerResponse {
  listenersStatus: Record<string, string>
}

/**
 * 根据 Data ID 和 Group 查询监听者列表
 */
export function getListenersByConfig(params: {
  dataId: string
  groupName: string
}): Promise<ListenerResponse> {
  return httpClient.get<ListenerResponse>('/v3/console/cs/config/listener', {
    params: params as Record<string, string>,
  })
}

/**
 * 根据 IP 查询监听者列表
 */
export function getListenersByIp(params: {
  ip: string
  namespaceId?: string
}): Promise<ListenerResponse> {
  return httpClient.get<ListenerResponse>('/v3/console/cs/config/listener/ip', {
    params: params as Record<string, string>,
  })
}

/**
 * 回滚配置到指定历史版本
 */
export function rollbackConfig(params: {
  dataId: string
  groupName: string
  nid: string
  namespaceId?: string
}): Promise<{ code: number; message?: string }> {
  return httpClient.post<{ code: number; message?: string }>('/v3/console/cs/config/rollback', undefined, {
    params: params as Record<string, string>,
  })
}

/**
 * 导出配置（返回下载 URL）
 */
export function getExportConfigUrl(params: {
  dataId?: string
  group?: string
  appName?: string
  tags?: string
  ids?: string
  namespaceId?: string
  exportV2?: boolean
}): string {
  const queryParams = new URLSearchParams()
  if (params.dataId) queryParams.append('dataId', params.dataId)
  if (params.group) queryParams.append('group', params.group)
  if (params.appName) queryParams.append('appName', params.appName)
  if (params.tags) queryParams.append('config_tags', params.tags)
  if (params.ids) queryParams.append('ids', params.ids)
  if (params.namespaceId && params.namespaceId !== 'public') {
    queryParams.append('tenant', params.namespaceId)
  }
  if (params.exportV2) {
    queryParams.append('exportV2', 'true')
  } else {
    queryParams.append('export', 'true')
  }

  return `/nacos/v1/cs/configs?${queryParams.toString()}`
}

/**
 * 导入配置
 */
export function importConfig(params: {
  file: File
  namespaceId?: string
  policy?: 'abort' | 'skip' | 'overwrite'
}): Promise<{ code: number; message?: string; data?: any }> {
  const formData = new FormData()
  formData.append('file', params.file)

  const queryParams = new URLSearchParams()
  queryParams.append('import', 'true')
  if (params.namespaceId && params.namespaceId !== 'public') {
    queryParams.append('tenant', params.namespaceId)
  }
  if (params.policy) {
    queryParams.append('policy', params.policy)
  }

  // 使用 fetch 而不是 httpClient，因为需要上传文件
  return fetch(`/nacos/v1/cs/configs?${queryParams.toString()}`, {
    method: 'POST',
    body: formData,
    headers: {
      poweredBy: 'simpleMVC',
      projectName: 'nacos',
    },
  })
    .then(async (response) => {
      const result = await response.json()
      if (response.ok) {
        return result
      } else {
        throw new Error(result.message || '导入失败')
      }
    })
    .catch((error) => {
      throw error
    })
}

