/**
 * 服务管理相关 API
 */

import httpClient from '@/utils/request'

export interface ServiceListItem {
  name: string
  groupName: string
  clusterCount: number
  ipCount: number
  healthyInstanceCount: number
  triggerFlag: boolean
}

export interface ServiceListParams {
  pageNo?: number
  pageSize?: number
  serviceNameParam?: string
  groupNameParam?: string
  namespaceId?: string
  ignoreEmptyService?: boolean
  withInstances?: boolean
}

export interface ServiceListResponse {
  code: number
  data: {
    totalCount: number
    pageItems: ServiceListItem[]
  }
  message?: string
}

/**
 * 获取服务列表
 */
export function getServiceList(params: ServiceListParams): Promise<ServiceListResponse> {
  return httpClient.get<ServiceListResponse>('/v3/console/ns/service/list', { params })
}

/**
 * 删除服务
 */
export function deleteService(serviceName: string, groupName: string, namespaceId?: string): Promise<{ code: number; message?: string }> {
  const encodedServiceName = encodeURIComponent(serviceName)
  return httpClient.delete<{ code: number; message?: string }>(
    `/v3/console/ns/service?serviceName=${encodedServiceName}&groupName=${groupName}${namespaceId ? `&namespaceId=${namespaceId}` : ''}`
  )
}

/**
 * 服务详情相关接口
 */
export interface Cluster {
  clusterName: string
  healthChecker?: {
    type?: string
    [key: string]: any
  }
  [key: string]: any
}

export interface ServiceDetail {
  serviceName: string
  groupName: string
  protectThreshold: number
  metadata?: Record<string, string>
  selector?: {
    type: string
    expression?: string
  }
  clusterMap?: Record<string, Cluster>
}

export interface ServiceDetailResponse {
  code: number
  data: ServiceDetail
  message?: string
}

/**
 * 获取服务详情
 */
export function getServiceDetail(params: {
  serviceName: string
  groupName: string
  namespaceId?: string
}): Promise<ServiceDetailResponse> {
  const { serviceName, groupName, namespaceId } = params
  const encodedServiceName = encodeURIComponent(serviceName)
  const url = `/v3/console/ns/service?serviceName=${encodedServiceName}&groupName=${groupName}${namespaceId ? `&namespaceId=${namespaceId}` : ''}`
  return httpClient.get<ServiceDetailResponse>(url)
}

/**
 * 更新服务
 */
export function updateService(params: {
  serviceName: string
  groupName?: string
  protectThreshold: number | string
  metadata?: string
  selector?: string
}): Promise<{ code: number; data?: string; message?: string }> {
  return httpClient.put<{ code: number; data?: string; message?: string }>('/v3/console/ns/service', params)
}

/**
 * 实例相关接口
 */
export interface Instance {
  ip: string
  port: number
  weight: number
  healthy: boolean
  enabled: boolean
  ephemeral: boolean
  metadata?: Record<string, string>
  clusterName?: string
  serviceName?: string
  groupName?: string
}

export interface InstanceListParams {
  serviceName: string
  clusterName: string
  groupName: string
  pageNo?: number
  pageSize?: number
  namespaceId?: string
}

export interface InstanceListResponse {
  code: number
  data: {
    pageNumber: number
    pageSize: number
    totalCount: number
    pageItems: Instance[]
  }
  message?: string
}

/**
 * 获取实例列表
 */
export function getInstances(params: InstanceListParams): Promise<InstanceListResponse> {
  return httpClient.post<InstanceListResponse>('/v3/console/ns/instance/list', params)
}

/**
 * 更新实例（上线/下线）
 */
export function updateInstance(params: {
  serviceName: string
  clusterName: string
  groupName: string
  ip: string
  port: number
  ephemeral: boolean
  weight: number
  enabled: boolean
  metadata?: string
  namespaceId?: string
}): Promise<{ code: number; data?: string; message?: string }> {
  return httpClient.put<{ code: number; data?: string; message?: string }>('/v3/console/ns/instance', params)
}

/**
 * 删除实例
 */
export function deleteInstance(params: {
  serviceName: string
  clusterName: string
  groupName: string
  ip: string
  port: number
  ephemeral: boolean
  namespaceId?: string
}): Promise<{ code: number; message?: string }> {
  const { serviceName, clusterName, groupName, ip, port, ephemeral, namespaceId } = params
  const encodedServiceName = encodeURIComponent(serviceName)
  const url = `/v3/console/ns/instance?serviceName=${encodedServiceName}&clusterName=${clusterName}&groupName=${groupName}&ip=${ip}&port=${port}&ephemeral=${ephemeral}${namespaceId ? `&namespaceId=${namespaceId}` : ''}`
  return httpClient.delete<{ code: number; message?: string }>(url)
}

/**
 * 更新集群
 */
export function updateCluster(params: {
  serviceName: string
  clusterName: string
  groupName: string
  healthChecker?: string
  metadata?: string
  namespaceId?: string
}): Promise<{ code: number; data?: string; message?: string }> {
  return httpClient.put<{ code: number; data?: string; message?: string }>('/v3/console/ns/service/cluster', params)
}

/**
 * 获取订阅者列表
 */
export interface Subscriber {
  addrStr: string
  agent: string
  app: string
  [key: string]: any
}

export interface SubscriberListParams {
  serviceName: string
  groupName: string
  namespaceId?: string
}

export interface SubscriberListResponse {
  code: number
  data: {
    pageItems?: Subscriber[]
    subscribers?: Subscriber[]
    count?: number
    totalCount?: number
  } | Subscriber[]
  message?: string
}

/**
 * 获取订阅者列表
 */
export function getSubscribers(params: SubscriberListParams): Promise<SubscriberListResponse> {
  const { serviceName, groupName, namespaceId } = params
  const encodedServiceName = encodeURIComponent(serviceName)
  const url = `/v3/console/ns/service/subscribers?serviceName=${encodedServiceName}&groupName=${groupName}${namespaceId ? `&namespaceId=${namespaceId}` : ''}`
  return httpClient.get<SubscriberListResponse>(url)
}

