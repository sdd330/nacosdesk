/**
 * 常量定义
 * 参考 console-ui/src/constants.js
 */

export const LANGUAGE_KEY = 'language'
export const THEME_KEY = 'setting_theme'
export const NAME_SHOW_KEY = 'setting_name_show'
export const LOGINPAGE_ENABLED = 'loginPageEnabled'

/**
 * 生成随机密码
 * @param length 密码长度，默认 10
 */
export function generateRandomPassword(length = 10): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

