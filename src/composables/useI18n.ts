/**
 * I18n Composable
 * 提供便捷的国际化函数，统一使用方式
 */

import { useI18n as useVueI18n } from 'vue-i18n'
import { setLocale, getLocale } from '@/i18n'
import { ElMessage } from 'element-plus'

/**
 * 增强的 useI18n
 * 提供额外的工具函数
 */
export function useI18n() {
  const { t, locale, ...rest } = useVueI18n()

  /**
   * 切换语言（同步 Element Plus）
   * 注意：Element Plus 的语言需要在组件中使用 ElConfigProvider 来切换
   */
  const changeLocale = (lang: string) => {
    setLocale(lang)
    // Element Plus 语言切换需要在 App.vue 中使用 ElConfigProvider
    ElMessage.success(t('common.languageChanged') || 'Language changed')
  }

  /**
   * 带参数的翻译函数
   */
  const tWithParams = (key: string, params?: Record<string, string | number>) => {
    if (!params) return t(key)
    
    let message = t(key)
    Object.entries(params).forEach(([k, v]) => {
      message = message.replace(`{${k}}`, String(v))
    })
    return message
  }

  return {
    t,
    tWithParams,
    locale,
    changeLocale,
    currentLocale: getLocale(),
    ...rest,
  }
}

