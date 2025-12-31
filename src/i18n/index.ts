/**
 * Vue I18n 配置
 * 参考 Vue 3 国际化最佳实践
 */

import { createI18n } from 'vue-i18n'
import type { I18n, I18nOptions } from 'vue-i18n'
import zhCN from '@/locales/zh-CN'
import enUS from '@/locales/en-US'
import elementZhCN from 'element-plus/es/locale/lang/zh-cn'
import elementEnUS from 'element-plus/es/locale/lang/en'

const LANGUAGE_KEY = 'language'

// 获取默认语言
function getDefaultLocale(): string {
  const saved = localStorage.getItem(LANGUAGE_KEY)
  if (saved) return saved
  
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.includes('zh')) return 'zh-CN'
  return 'en-US'
}

// Element Plus 语言映射
export const elementLocaleMap: Record<string, any> = {
  'zh-CN': elementZhCN,
  'en-US': elementEnUS,
}

// I18n 配置
const i18nOptions: I18nOptions = {
  legacy: false, // 使用 Composition API 模式
  locale: getDefaultLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
  // 全局注入 $t 函数（兼容选项式 API）
  globalInjection: true,
  // 警告模式：开发环境显示警告
  warnHtmlMessage: import.meta.env.DEV,
}

// 创建 I18n 实例
export const i18n: I18n = createI18n(i18nOptions)

// 切换语言
export function setLocale(locale: string): void {
  const localeValue = i18n.global.locale
  if (typeof localeValue === 'string') {
    ;(i18n.global.locale as any) = locale
  } else {
    localeValue.value = locale as any
  }
  localStorage.setItem(LANGUAGE_KEY, locale)
}

// 获取当前语言
export function getLocale(): string {
  const localeValue = i18n.global.locale
  if (typeof localeValue === 'string') {
    return localeValue
  }
  return localeValue.value as string
}

export default i18n

