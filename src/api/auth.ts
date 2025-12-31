/**
 * 认证相关 API
 */

import httpClient from '@/utils/request'
import type { LoginParams, LoginResponse, ServerState } from '@/types/api'

/**
 * 用户登录
 */
export function login(params: LoginParams): Promise<LoginResponse> {
  return httpClient.post<LoginResponse>('/v3/auth/user/login', params)
}

/**
 * 获取服务器状态
 */
export function getServerState(): Promise<ServerState> {
  return httpClient.get<ServerState>('/v3/console/server/state')
}

/**
 * 获取引导信息
 */
export function getGuide(): Promise<{ data: string }> {
  return httpClient.get<{ data: string }>('/v3/console/server/guide')
}

/**
 * 获取公告
 */
export function getNotice(language = 'zh-CN'): Promise<{ data: string }> {
  return httpClient.get<{ data: string }>(`/v3/console/server/announcement?language=${language}`)
}

/**
 * 初始化管理员账户
 */
export interface AdminParams {
  username: string
  password: string
}

export interface AdminResponse {
  username: string
  password: string
}

export function initAdmin(params: AdminParams): Promise<AdminResponse> {
  return httpClient.post<AdminResponse>('/v3/auth/user/admin', params)
}
