/**
 * Tauri API 工具
 * 提供类型安全的 Tauri 命令调用接口
 */

import { invoke } from '@tauri-apps/api/tauri'

/**
 * 检查是否在 Tauri 环境中
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * 登录请求参数
 */
export interface TauriLoginRequest {
  username: string
  password: string
}

/**
 * 登录响应
 */
export interface TauriLoginResponse {
  access_token: string
  token_ttl: number
  global_admin: boolean
  username: string
}

/**
 * Tauri 登录 API
 * 调用 Rust 端的 login 命令
 */
export async function tauriLogin(
  username: string,
  password: string
): Promise<TauriLoginResponse> {
  try {
    const response = await invoke<TauriLoginResponse>('login', {
      username,
      password,
    })
    return response
  } catch (error: any) {
    // 转换 Tauri 错误为前端可用的错误格式
    const errorMessage =
      error?.message || error?.toString() || 'Login failed'
    throw new Error(errorMessage)
  }
}

/**
 * 注册请求参数
 */
export interface TauriRegisterRequest {
  username: string
  password: string
}

/**
 * 注册响应
 */
export interface TauriRegisterResponse {
  username: string
  password: string
}

/**
 * Tauri 注册 API
 * 调用 Rust 端的 register 命令
 */
export async function tauriRegister(
  username: string,
  password: string
): Promise<TauriRegisterResponse> {
  try {
    const response = await invoke<TauriRegisterResponse>('register', {
      username,
      password,
    })
    return response
  } catch (error: any) {
    const errorMessage =
      error?.message || error?.toString() || 'Register failed'
    throw new Error(errorMessage)
  }
}

/**
 * Tauri 检查管理员是否存在 API
 * 调用 Rust 端的 check_admin_exists 命令
 */
export async function tauriCheckAdminExists(): Promise<boolean> {
  try {
    const response = await invoke<boolean>('check_admin_exists', {})
    return response
  } catch (error: any) {
    const errorMessage =
      error?.message || error?.toString() || 'Check admin failed'
    throw new Error(errorMessage)
  }
}

// ============================================
// 用户管理 API
// ============================================

/**
 * 用户信息
 */
export interface TauriUserInfo {
  username: string
  enabled: boolean
}

/**
 * 用户查询参数
 */
export interface TauriUserQueryParams {
  page_no?: number
  page_size?: number
  username?: string
  search?: string // "accurate" | "blur"
}

/**
 * 用户列表响应
 */
export interface TauriUserListResponse {
  total_count: number
  page_number: number
  pages_available: number
  page_items: TauriUserInfo[]
}

/**
 * 用户详情信息
 */
export interface TauriUserDetail {
  username: string
  enabled: boolean
}

/**
 * 查询用户列表
 */
export async function tauriGetUserList(
  params: TauriUserQueryParams
): Promise<TauriUserListResponse> {
  try {
    const response = await invoke<TauriUserListResponse>('get_user_list_cmd', { params })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Get user list failed'
    throw new Error(errorMessage)
  }
}

/**
 * 查询用户详情
 */
export async function tauriGetUserDetail(
  username: string
): Promise<TauriUserDetail | null> {
  try {
    const response = await invoke<TauriUserDetail | null>('get_user_detail_cmd', { username })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Get user detail failed'
    throw new Error(errorMessage)
  }
}

/**
 * 创建用户
 */
export async function tauriCreateUser(
  username: string,
  password: string
): Promise<void> {
  try {
    await invoke('create_user_cmd', { username, password })
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Create user failed'
    throw new Error(errorMessage)
  }
}

/**
 * 删除用户
 */
export async function tauriDeleteUser(username: string): Promise<void> {
  try {
    await invoke('delete_user_cmd', { username })
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Delete user failed'
    throw new Error(errorMessage)
  }
}

/**
 * 重置用户密码
 */
export async function tauriUpdateUserPassword(
  username: string,
  newPassword: string
): Promise<void> {
  try {
    await invoke('update_user_password_cmd', { username, new_password: newPassword })
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Update user password failed'
    throw new Error(errorMessage)
  }
}

/**
 * 更新用户状态（启用/禁用）
 */
export async function tauriUpdateUserStatus(
  username: string,
  enabled: boolean
): Promise<void> {
  try {
    await invoke('update_user_status_cmd', { username, enabled })
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Update user status failed'
    throw new Error(errorMessage)
  }
}

// ============================================
// 角色管理 API
// ============================================

/**
 * 角色信息
 */
export interface TauriRoleInfo {
  role: string
  username: string
}

/**
 * 角色查询参数
 */
export interface TauriRoleQueryParams {
  page_no?: number
  page_size?: number
  username?: string
  role?: string
  search?: string // "accurate" | "blur"
}

/**
 * 角色列表响应
 */
export interface TauriRoleListResponse {
  total_count: number
  page_number: number
  pages_available: number
  page_items: TauriRoleInfo[]
}

/**
 * 查询角色列表
 */
export async function tauriGetRoleList(
  params: TauriRoleQueryParams
): Promise<TauriRoleListResponse> {
  try {
    const response = await invoke<TauriRoleListResponse>('get_role_list_cmd', { params })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Get role list failed'
    throw new Error(errorMessage)
  }
}

/**
 * 创建角色
 */
export async function tauriCreateRole(
  role: string,
  username: string
): Promise<void> {
  try {
    await invoke('create_role_cmd', { role, username })
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Create role failed'
    throw new Error(errorMessage)
  }
}

/**
 * 删除角色
 */
export async function tauriDeleteRole(
  role: string,
  username?: string
): Promise<void> {
  try {
    await invoke('delete_role_cmd', { role, username })
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Delete role failed'
    throw new Error(errorMessage)
  }
}

// ============================================
// 权限管理 API
// ============================================

/**
 * 权限信息
 */
export interface TauriPermissionInfo {
  role: string
  resource: string
  action: string
}

/**
 * 权限查询参数
 */
export interface TauriPermissionQueryParams {
  page_no?: number
  page_size?: number
  role?: string
  resource?: string
  action?: string
  search?: string // "accurate" | "blur"
}

/**
 * 权限列表响应
 */
export interface TauriPermissionListResponse {
  total_count: number
  page_number: number
  pages_available: number
  page_items: TauriPermissionInfo[]
}

/**
 * 查询权限列表
 */
export async function tauriGetPermissionList(
  params: TauriPermissionQueryParams
): Promise<TauriPermissionListResponse> {
  try {
    const response = await invoke<TauriPermissionListResponse>('get_permission_list_cmd', { params })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Get permission list failed'
    throw new Error(errorMessage)
  }
}

/**
 * 创建权限
 */
export async function tauriCreatePermission(
  role: string,
  resource: string,
  action: string
): Promise<void> {
  try {
    await invoke('create_permission_cmd', { role, resource, action })
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Create permission failed'
    throw new Error(errorMessage)
  }
}

/**
 * 删除权限
 */
export async function tauriDeletePermission(
  role: string,
  resource: string,
  action: string
): Promise<void> {
  try {
    await invoke('delete_permission_cmd', { role, resource, action })
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Delete permission failed'
    throw new Error(errorMessage)
  }
}

/**
 * 检查权限
 */
export async function tauriCheckPermission(
  role: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    const response = await invoke<boolean>('check_permission_cmd', { role, resource, action })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Check permission failed'
    throw new Error(errorMessage)
  }
}

// ============================================
// Token 管理 API
// ============================================

/**
 * Token 验证响应
 */
export interface TauriValidateTokenResponse {
  valid: boolean
  username?: string
  expires_at?: number
  remaining_ttl?: number
}

/**
 * Token 刷新响应
 */
export interface TauriRefreshTokenResponse {
  token: string
  token_ttl: number
  expires_at: number
}

/**
 * 验证 Token
 */
export async function tauriValidateToken(
  token: string
): Promise<TauriValidateTokenResponse> {
  try {
    const response = await invoke<TauriValidateTokenResponse>('validate_token_cmd', { token })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Validate token failed'
    throw new Error(errorMessage)
  }
}

/**
 * 刷新 Token
 */
export async function tauriRefreshToken(
  token: string
): Promise<TauriRefreshTokenResponse> {
  try {
    const response = await invoke<TauriRefreshTokenResponse>('refresh_token_cmd', { token })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Refresh token failed'
    throw new Error(errorMessage)
  }
}

/**
 * 清理过期 Token
 */
export async function tauriCleanupExpiredTokens(): Promise<number> {
  try {
    const response = await invoke<number>('cleanup_expired_tokens_cmd', {})
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Cleanup expired tokens failed'
    throw new Error(errorMessage)
  }
}

// ============================================
// 数据库管理 API
// ============================================

/**
 * 备份数据库
 */
export async function tauriBackupDatabase(
  backupPath: string
): Promise<string> {
  try {
    const response = await invoke<string>('backup_database_cmd', { backup_path: backupPath })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Backup database failed'
    throw new Error(errorMessage)
  }
}

/**
 * 恢复数据库
 */
export async function tauriRestoreDatabase(
  backupPath: string
): Promise<string> {
  try {
    const response = await invoke<string>('restore_database_cmd', { backup_path: backupPath })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Restore database failed'
    throw new Error(errorMessage)
  }
}

/**
 * 获取数据库文件路径
 */
export async function tauriGetDatabaseFilePath(): Promise<string> {
  try {
    const response = await invoke<string>('get_database_file_path_cmd', {})
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Get database file path failed'
    throw new Error(errorMessage)
  }
}

/**
 * 清理数据库（危险操作）
 */
export async function tauriCleanupDatabase(): Promise<string> {
  try {
    const response = await invoke<string>('cleanup_database_cmd', {})
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Cleanup database failed'
    throw new Error(errorMessage)
  }
}

// ============================================
// 配置管理 API
// ============================================

/**
 * 配置查询参数
 */
export interface TauriConfigQueryParams {
  data_id?: string
  group_id?: string
  tenant_id?: string
  page_no?: number
  page_size?: number
}

/**
 * 配置信息
 */
export interface TauriConfigInfo {
  id?: number
  data_id: string
  group_id: string
  tenant_id: string
  app_name?: string
  content: string
  md5?: string
  gmt_create: number
  gmt_modified: number
  src_user?: string
  src_ip?: string
  c_desc?: string
  c_use?: string
  effect?: string
  type?: string
  c_schema?: string
  encrypted_data_key?: string
}

/**
 * 配置列表响应
 */
export interface TauriConfigListResponse {
  total_count: number
  page_number: number
  pages_available: number
  page_items: TauriConfigInfo[]
}

/**
 * 创建配置请求
 */
export interface TauriCreateConfigRequest {
  data_id: string
  group_id: string
  tenant_id: string
  content: string
  app_name?: string
  c_desc?: string
  c_use?: string
  effect?: string
  type?: string
  c_schema?: string
}

/**
 * 更新配置请求
 */
export interface TauriUpdateConfigRequest {
  data_id: string
  group_id: string
  tenant_id: string
  content: string
  app_name?: string
  c_desc?: string
  c_use?: string
  effect?: string
  type?: string
  c_schema?: string
  encrypted_data_key?: string
}

/**
 * 查询配置列表
 */
export async function tauriGetConfigList(
  params: TauriConfigQueryParams
): Promise<TauriConfigListResponse> {
  try {
    const response = await invoke<TauriConfigListResponse>('get_config_list_cmd', { params })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Get config list failed'
    throw new Error(errorMessage)
  }
}

/**
 * 查询配置详情
 */
export async function tauriGetConfigDetail(
  dataId: string,
  groupId: string,
  tenantId: string
): Promise<TauriConfigInfo | null> {
  try {
    const response = await invoke<TauriConfigInfo | null>('get_config_detail_cmd', {
      data_id: dataId,
      group_id: groupId,
      tenant_id: tenantId,
    })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Get config detail failed'
    throw new Error(errorMessage)
  }
}

/**
 * 创建配置
 */
export async function tauriCreateConfig(
  request: TauriCreateConfigRequest
): Promise<TauriConfigInfo> {
  try {
    const response = await invoke<TauriConfigInfo>('create_config_cmd', { request })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Create config failed'
    throw new Error(errorMessage)
  }
}

/**
 * 更新配置
 */
export async function tauriUpdateConfig(
  request: TauriUpdateConfigRequest
): Promise<TauriConfigInfo> {
  try {
    const response = await invoke<TauriConfigInfo>('update_config_cmd', { request })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Update config failed'
    throw new Error(errorMessage)
  }
}

/**
 * 删除配置
 */
export async function tauriDeleteConfig(
  dataId: string,
  groupId: string,
  tenantId: string
): Promise<void> {
  try {
    await invoke('delete_config_cmd', {
      data_id: dataId,
      group_id: groupId,
      tenant_id: tenantId,
    })
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Delete config failed'
    throw new Error(errorMessage)
  }
}

/**
 * 查询配置历史
 */
export async function tauriGetConfigHistory(
  dataId: string,
  groupId: string,
  tenantId: string,
  pageNo?: number,
  pageSize?: number
): Promise<TauriConfigListResponse> {
  try {
    const response = await invoke<TauriConfigListResponse>('get_config_history_cmd', {
      data_id: dataId,
      group_id: groupId,
      tenant_id: tenantId,
      page_no: pageNo,
      page_size: pageSize,
    })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Get config history failed'
    throw new Error(errorMessage)
  }
}

// ============================================
// 服务管理 API
// ============================================

/**
 * 服务查询参数
 */
export interface TauriServiceQueryParams {
  namespace_id?: string
  group_name?: string
  service_name?: string
  page_no?: number
  page_size?: number
}

/**
 * 服务信息
 */
export interface TauriServiceInfo {
  id?: number
  namespace_id: string
  group_name: string
  service_name: string
  metadata?: string
  protect_threshold: number
  selector_type?: string
  selector?: string
  gmt_create: number
  gmt_modified: number
}

/**
 * 服务列表响应
 */
export interface TauriServiceListResponse {
  total_count: number
  page_number: number
  pages_available: number
  page_items: TauriServiceInfo[]
}

/**
 * 实例信息
 */
export interface TauriInstanceInfo {
  id?: number
  namespace_id: string
  group_name: string
  service_name: string
  instance_id: string
  ip: string
  port: number
  weight: number
  healthy: boolean
  enabled: boolean
  ephemeral: boolean
  cluster_name: string
  metadata?: string
  gmt_create: number
  gmt_modified: number
}

/**
 * 实例列表响应
 */
export interface TauriInstanceListResponse {
  instances: TauriInstanceInfo[]
}

/**
 * 创建服务请求
 */
export interface TauriCreateServiceRequest {
  namespace_id: string
  group_name: string
  service_name: string
  metadata?: string
  protect_threshold?: number
  selector_type?: string
  selector?: string
}

/**
 * 更新服务请求
 */
export interface TauriUpdateServiceRequest {
  namespace_id: string
  group_name: string
  service_name: string
  metadata?: string
  protect_threshold?: number
  selector_type?: string
  selector?: string
}

/**
 * 注册实例请求
 */
export interface TauriRegisterInstanceRequest {
  namespace_id: string
  group_name: string
  service_name: string
  ip: string
  port: number
  weight?: number
  healthy?: boolean
  enabled?: boolean
  ephemeral?: boolean
  cluster_name?: string
  metadata?: string
}

/**
 * 查询服务列表
 */
export async function tauriGetServiceList(
  params: TauriServiceQueryParams
): Promise<TauriServiceListResponse> {
  try {
    const response = await invoke<TauriServiceListResponse>('get_service_list_cmd', { params })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Get service list failed'
    throw new Error(errorMessage)
  }
}

/**
 * 查询服务详情
 */
export async function tauriGetServiceDetail(
  namespaceId: string,
  groupName: string,
  serviceName: string
): Promise<TauriServiceInfo | null> {
  try {
    const response = await invoke<TauriServiceInfo | null>('get_service_detail_cmd', {
      namespace_id: namespaceId,
      group_name: groupName,
      service_name: serviceName,
    })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Get service detail failed'
    throw new Error(errorMessage)
  }
}

/**
 * 创建服务
 */
export async function tauriCreateService(
  request: TauriCreateServiceRequest
): Promise<TauriServiceInfo> {
  try {
    const response = await invoke<TauriServiceInfo>('create_service_cmd', { request })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Create service failed'
    throw new Error(errorMessage)
  }
}

/**
 * 更新服务
 */
export async function tauriUpdateService(
  request: TauriUpdateServiceRequest
): Promise<TauriServiceInfo> {
  try {
    const response = await invoke<TauriServiceInfo>('update_service_cmd', { request })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Update service failed'
    throw new Error(errorMessage)
  }
}

/**
 * 删除服务
 */
export async function tauriDeleteService(
  namespaceId: string,
  groupName: string,
  serviceName: string
): Promise<void> {
  try {
    await invoke('delete_service_cmd', {
      namespace_id: namespaceId,
      group_name: groupName,
      service_name: serviceName,
    })
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Delete service failed'
    throw new Error(errorMessage)
  }
}

/**
 * 查询服务实例
 */
export async function tauriGetServiceInstances(
  namespaceId: string,
  groupName: string,
  serviceName: string
): Promise<TauriInstanceListResponse> {
  try {
    const response = await invoke<TauriInstanceListResponse>('get_service_instances_cmd', {
      namespace_id: namespaceId,
      group_name: groupName,
      service_name: serviceName,
    })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Get service instances failed'
    throw new Error(errorMessage)
  }
}

/**
 * 注册实例
 */
export async function tauriRegisterInstance(
  request: TauriRegisterInstanceRequest
): Promise<TauriInstanceInfo> {
  try {
    const response = await invoke<TauriInstanceInfo>('register_instance_cmd', { request })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Register instance failed'
    throw new Error(errorMessage)
  }
}

/**
 * 注销实例
 */
export async function tauriDeregisterInstance(
  namespaceId: string,
  groupName: string,
  serviceName: string,
  instanceId: string
): Promise<void> {
  try {
    await invoke('deregister_instance_cmd', {
      namespace_id: namespaceId,
      group_name: groupName,
      service_name: serviceName,
      instance_id: instanceId,
    })
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Deregister instance failed'
    throw new Error(errorMessage)
  }
}

/**
 * 更新实例健康状态
 */
export async function tauriUpdateInstanceHealth(
  namespaceId: string,
  groupName: string,
  serviceName: string,
  instanceId: string,
  healthy: boolean
): Promise<void> {
  try {
    await invoke('update_instance_health_cmd', {
      namespace_id: namespaceId,
      group_name: groupName,
      service_name: serviceName,
      instance_id: instanceId,
      healthy,
    })
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Update instance health failed'
    throw new Error(errorMessage)
  }
}

// ============================================
// 命名空间管理 API
// ============================================

/**
 * 命名空间信息
 */
export interface TauriTenantInfo {
  id?: number
  kp: string
  tenant_id: string
  tenant_name: string
  tenant_desc?: string
  create_source?: string
  gmt_create: number
  gmt_modified: number
}

/**
 * 命名空间列表响应
 */
export interface TauriTenantListResponse {
  tenants: TauriTenantInfo[]
}

/**
 * 创建命名空间请求
 */
export interface TauriCreateTenantRequest {
  tenant_id: string
  tenant_name: string
  tenant_desc?: string
}

/**
 * 更新命名空间请求
 */
export interface TauriUpdateTenantRequest {
  tenant_id: string
  tenant_name: string
  tenant_desc?: string
}

/**
 * 查询命名空间列表
 */
export async function tauriGetNamespaceList(): Promise<TauriTenantListResponse> {
  try {
    const response = await invoke<TauriTenantListResponse>('get_namespace_list_cmd', {})
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Get namespace list failed'
    throw new Error(errorMessage)
  }
}

/**
 * 创建命名空间
 */
export async function tauriCreateNamespace(
  request: TauriCreateTenantRequest
): Promise<TauriTenantInfo> {
  try {
    const response = await invoke<TauriTenantInfo>('create_namespace_cmd', { request })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Create namespace failed'
    throw new Error(errorMessage)
  }
}

/**
 * 更新命名空间
 */
export async function tauriUpdateNamespace(
  request: TauriUpdateTenantRequest
): Promise<TauriTenantInfo> {
  try {
    const response = await invoke<TauriTenantInfo>('update_namespace_cmd', { request })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Update namespace failed'
    throw new Error(errorMessage)
  }
}

/**
 * 删除命名空间
 */
export async function tauriDeleteNamespace(tenantId: string): Promise<void> {
  try {
    await invoke('delete_namespace_cmd', { tenant_id: tenantId })
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Delete namespace failed'
    throw new Error(errorMessage)
  }
}

/**
 * API 服务器状态
 */
export interface TauriServerStatus {
  running: boolean
  port: number | null
  start_time: number | null
  request_count: number
  error_count: number
}

/**
 * API 服务器配置
 */
export interface TauriServerConfig {
  port: number
  context_path: string
  ip_whitelist_enabled?: boolean
  ip_whitelist?: string[]
  rate_limit_enabled?: boolean
  rate_limit_capacity?: number
  rate_limit_refill_rate?: number
  rate_limit_tokens_per_request?: number
}

/**
 * 启动 API 服务器
 */
export async function tauriStartApiServer(port?: number): Promise<string> {
  try {
    const response = await invoke<string>('start_api_server_cmd', { port })
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Start API server failed'
    throw new Error(errorMessage)
  }
}

/**
 * 停止 API 服务器
 */
export async function tauriStopApiServer(): Promise<void> {
  try {
    await invoke('stop_api_server_cmd', {})
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Stop API server failed'
    throw new Error(errorMessage)
  }
}

/**
 * 查询 API 服务器状态
 */
export async function tauriGetApiServerStatus(): Promise<TauriServerStatus> {
  try {
    const response = await invoke<TauriServerStatus>('get_api_server_status_cmd', {})
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Get API server status failed'
    throw new Error(errorMessage)
  }
}

/**
 * 获取 API 服务器配置
 */
export async function tauriGetApiServerConfig(): Promise<TauriServerConfig> {
  try {
    const response = await invoke<TauriServerConfig>('get_api_server_config_cmd', {})
    return response
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Get API server config failed'
    throw new Error(errorMessage)
  }
}

/**
 * 更新 API 服务器配置
 */
export async function tauriUpdateApiServerConfig(config: TauriServerConfig): Promise<void> {
  try {
    await invoke('update_api_server_config_cmd', { config })
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Update API server config failed'
    throw new Error(errorMessage)
  }
}

