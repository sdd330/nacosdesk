/**
 * 权限管理相关 API
 * 参考 console-ui/src/reducers/authority.js
 */

import httpClient from '@/utils/request'

/**
 * 用户相关接口
 */
export interface User {
  username: string
  password?: string
  [key: string]: any
}

export interface UserListParams {
  pageNo?: number
  pageSize?: number
  username?: string
  search?: 'accurate' | 'blur'
}

export interface UserListResponse {
  code: number
  data: {
    totalCount: number
    pageNumber: number
    pagesAvailable: number
    pageItems: User[]
  }
  message?: string
}

/**
 * 获取用户列表
 */
export function getUsers(params: UserListParams): Promise<UserListResponse> {
  return httpClient.get<UserListResponse>('/v3/auth/user/list', { 
    params: params as Record<string, string | number | undefined>
  })
}

/**
 * 创建用户
 */
export function createUser(params: { username: string; password: string }): Promise<{ code: number; message?: string }> {
  return httpClient.post<{ code: number; message?: string }>('/v3/auth/user', params)
}

/**
 * 删除用户
 */
export function deleteUser(username: string): Promise<{ code: number; message?: string }> {
  return httpClient.delete<{ code: number; message?: string }>('/v3/auth/user', {
    params: { username },
  })
}

/**
 * 密码重置
 */
export function passwordReset(params: { username: string; newPassword: string }): Promise<{ code: number; message?: string }> {
  return httpClient.put<{ code: number; message?: string }>('/v3/auth/user', params)
}

/**
 * 搜索用户（模糊匹配）
 */
export function searchUsers(username: string): Promise<{ code: number; data?: any; message?: string }> {
  return httpClient.get<{ code: number; data?: any; message?: string }>('/v3/auth/user/search', {
    params: { username },
  })
}

/**
 * 角色相关接口
 */
export interface Role {
  role: string
  username?: string
  [key: string]: any
}

export interface RoleListParams {
  pageNo?: number
  pageSize?: number
  role?: string
  search?: 'accurate' | 'blur'
}

export interface RoleListResponse {
  code: number
  data: {
    totalCount: number
    pageNumber: number
    pagesAvailable: number
    pageItems: Role[]
  }
  message?: string
}

/**
 * 获取角色列表
 */
export function getRoles(params: RoleListParams): Promise<RoleListResponse> {
  return httpClient.get<RoleListResponse>('/v3/auth/role/list', { 
    params: params as Record<string, string | number | undefined>
  })
}

/**
 * 创建角色
 */
export function createRole(params: { role: string; username: string }): Promise<{ code: number; message?: string }> {
  return httpClient.post<{ code: number; message?: string }>('/v3/auth/role', params)
}

/**
 * 删除角色
 */
export function deleteRole(role: string): Promise<{ code: number; message?: string }> {
  return httpClient.delete<{ code: number; message?: string }>('/v3/auth/role', {
    params: { role },
  })
}

/**
 * 搜索角色（模糊匹配）
 */
export function searchRoles(role: string): Promise<{ code: number; data?: any; message?: string }> {
  return httpClient.get<{ code: number; data?: any; message?: string }>('/v3/auth/role/search', {
    params: { role },
  })
}

/**
 * 权限相关接口
 */
export interface Permission {
  role: string
  resource: string
  action: string
  [key: string]: any
}

export interface PermissionListParams {
  pageNo?: number
  pageSize?: number
  role?: string
  resource?: string
  action?: string
  search?: 'accurate' | 'blur'
}

export interface PermissionListResponse {
  code: number
  data: {
    totalCount: number
    pageNumber: number
    pagesAvailable: number
    pageItems: Permission[]
  }
  message?: string
}

/**
 * 获取权限列表
 */
export function getPermissions(params: PermissionListParams): Promise<PermissionListResponse> {
  return httpClient.get<PermissionListResponse>('/v3/auth/permission/list', { 
    params: params as Record<string, string | number | undefined>
  })
}

/**
 * 创建权限
 */
export function createPermission(params: { role: string; resource: string; action: string }): Promise<{ code: number; message?: string }> {
  return httpClient.post<{ code: number; message?: string }>('/v3/auth/permission', params)
}

/**
 * 删除权限
 */
export function deletePermission(params: { role: string; resource: string; action: string }): Promise<{ code: number; message?: string }> {
  return httpClient.delete<{ code: number; message?: string }>('/v3/auth/permission', {
    params,
  })
}

/**
 * 权限检查（前置校验）
 */
export function checkPermission(params: { role: string; resource: string; action: string }): Promise<{ code: number; data?: boolean; message?: string }> {
  return httpClient.get<{ code: number; data?: boolean; message?: string }>('/v3/auth/permission', {
    params,
  })
}
