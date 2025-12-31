/**
 * Nacos 工具函数
 * 参考 console-ui/src/utils/nacosutil.js
 */

/**
 * 判断是否为 JSON 字符串
 */
export function isJsonString(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

/**
 * 生成 URL
 */
export function generateUrl(baseUrl: string, params: Record<string, any>): string {
  const url = new URL(baseUrl, window.location.origin)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value))
    }
  })
  return url.pathname + url.search
}

