/**
 * 本地存储工具函数
 */

const TOKEN_KEY = 'token'

export const storage = {
  /**
   * 获取 token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },

  /**
   * 设置 token
   */
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },

  /**
   * 移除 token
   */
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY)
  },

  /**
   * 检查是否有 token
   */
  hasToken(): boolean {
    return !!this.getToken()
  },
}

