/**
 * App 根组件
 * 使用 Vue 3 JSX + Composition API
 */

import { defineComponent, computed } from 'vue'
import { RouterView } from 'vue-router'
import { ElConfigProvider } from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import { elementLocaleMap } from '@/i18n'

export default defineComponent({
  name: 'App',
  setup() {
    // ✅ Composition API: 使用 composable
    const { currentLocale } = useI18n()

    // ✅ Composition API: 使用 computed 派生状态
    const elementLocale = computed(() => {
      return elementLocaleMap[currentLocale] || elementLocaleMap['zh-CN']
    })

    // ✅ Composition API: 返回渲染函数
    return () => (
      <ElConfigProvider locale={elementLocale.value}>
        <RouterView
          v-slots={{
            default: ({ Component }: { Component: any }) => (
              <transition name="fade" mode="out-in">
                <Component />
              </transition>
            ),
          }}
        />
      </ElConfigProvider>
    )
  },
})

