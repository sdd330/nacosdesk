/**
 * 国际化状态管理
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import zhCN from '@/locales/zh-CN'

const LANGUAGE_KEY = 'language'

export const useLocaleStore = defineStore('locale', () => {
  // State
  const language = ref<string>(
    localStorage.getItem(LANGUAGE_KEY) || 
    (navigator.language === 'zh-CN' ? 'zh-CN' : 'en-US')
  )
  
  const locale = ref(zhCN)

  /**
   * 切换语言
   */
  function changeLanguage(lang: string) {
    language.value = lang
    localStorage.setItem(LANGUAGE_KEY, lang)
    
    // TODO: 加载对应语言包
    if (lang === 'zh-CN') {
      locale.value = zhCN
    } else {
      // TODO: 加载英文语言包
      locale.value = zhCN
    }
  }

  /**
   * 翻译函数
   */
  function t(key: string): string {
    const keys = key.split('.')
    let value: any = locale.value
    for (const k of keys) {
      value = value?.[k]
    }
    return value || key
  }

  return {
    language,
    locale,
    changeLanguage,
    t,
  }
})

