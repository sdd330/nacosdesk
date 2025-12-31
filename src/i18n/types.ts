/**
 * I18n 类型定义
 * 提供类型安全的翻译键
 */

import zhCN from '@/locales/zh-CN'

// 从中文语言包推断类型
type LocaleMessage = typeof zhCN

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends LocaleMessage {}
}

