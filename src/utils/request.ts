/**
 * HTTP 请求封装
 * 统一的请求客户端，支持错误处理和拦截器
 */

export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | undefined>
  timeout?: number
}

export interface ApiResponse<T = any> {
  code?: number
  data?: T
  message?: string
  success?: boolean
}

class HttpClient {
  private baseURL: string
  private timeout: number

  constructor(baseURL: string, timeout = 10000) {
    this.baseURL = baseURL.replace(/\/$/, '')
    this.timeout = timeout
  }

  /**
   * 构建完整 URL
   */
  private buildURL(url: string, params?: Record<string, string | number | undefined>): string {
    const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`
    
    if (!params || Object.keys(params).length === 0) {
      return fullURL
    }

    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })

    const separator = fullURL.includes('?') ? '&' : '?'
    return `${fullURL}${separator}${searchParams.toString()}`
  }

  /**
   * 请求超时处理
   */
  private async fetchWithTimeout(
    url: string,
    config: RequestConfig
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      config.timeout || this.timeout
    )

    try {
      const response = await fetch(url, {
        ...config,
        signal: config.signal || controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }

  /**
   * 处理响应
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')
    const isJSON = contentType?.includes('application/json')

    if (!response.ok) {
      const errorText = isJSON
        ? (await response.json()).message || response.statusText
        : await response.text()
      throw new Error(errorText || `HTTP ${response.status}`)
    }

    if (isJSON) {
      return response.json()
    }

    return response.text() as unknown as T
  }

  /**
   * 通用请求方法
   */
  async request<T = any>(
    url: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { params, ...fetchConfig } = config
    const fullURL = this.buildURL(url, params)

    // 设置默认请求头
    const headers = new Headers(fetchConfig.headers)
    if (!headers.has('Content-Type') && fetchConfig.method !== 'GET') {
      headers.set('Content-Type', 'application/x-www-form-urlencoded')
    }

    try {
      const response = await this.fetchWithTimeout(fullURL, {
        ...fetchConfig,
        headers,
      })
      return this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred')
    }
  }

  /**
   * GET 请求
   */
  get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' })
  }

  /**
   * POST 请求
   */
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const body = data instanceof URLSearchParams 
      ? data 
      : data 
        ? new URLSearchParams(
            Object.entries(data).reduce(
              (acc, [key, value]) => {
                if (value !== undefined && value !== null) {
                  acc[key] = String(value)
                }
                return acc
              },
              {} as Record<string, string>
            )
          )
        : undefined

    return this.request<T>(url, {
      ...config,
      method: 'POST',
      body,
    })
  }

  /**
   * PUT 请求
   */
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const body = data instanceof URLSearchParams
      ? data
      : data
        ? new URLSearchParams(
            Object.entries(data).reduce(
              (acc, [key, value]) => {
                if (value !== undefined && value !== null) {
                  acc[key] = String(value)
                }
                return acc
              },
              {} as Record<string, string>
            )
          )
        : undefined

    return this.request<T>(url, {
      ...config,
      method: 'PUT',
      body,
    })
  }

  /**
   * DELETE 请求
   */
  delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'DELETE' })
  }
}

// 创建默认实例
// Nacos 3 Web Console 运行在 8080 端口
export const httpClient = new HttpClient(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
)

export default httpClient

