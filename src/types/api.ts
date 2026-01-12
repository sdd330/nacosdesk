/**
 * API 类型定义
 */

export interface ApiResponse<T = any> {
  code?: number
  data?: T
  message?: string
  success?: boolean
}

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenTtl: number
  globalAdmin: boolean
  username: string
}

export interface ServerState {
  version: string
  standalone_mode: string
  function_mode: string
  login_page_enabled: string
  auth_enabled: string
  console_ui_enabled: string
  auth_admin_request: string
  startup_mode: string
  config_retention_days: number
}
