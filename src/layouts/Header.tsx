/**
 * Header 组件
 * 使用 Vue 3 JSX + Composition API
 */

import { defineComponent, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'

export default defineComponent({
  name: 'Header',
  setup() {
    // ✅ Composition API: 使用 composables
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()
    const { t, changeLocale, currentLocale } = useI18n()

    // ✅ Composition API: 使用 computed 派生状态
    const isLoginPage = computed(() => route.path === '/login')

    const username = computed(() => {
      const token = authStore.token
      if (!token) return ''
      
      try {
        const tokenData = JSON.parse(token)
        return tokenData.username || ''
      } catch {
        return ''
      }
    })

    // ✅ Composition API: 方法定义
    const goHome = () => {
      router.push('/')
    }

    const switchLang = () => {
      const newLang = currentLocale === 'en-US' ? 'zh-CN' : 'en-US'
      changeLocale(newLang)
    }

    const handleCommand = (command: string) => {
      if (command === 'logout') {
        authStore.logout()
        router.push('/login')
      } else if (command === 'changePassword') {
        // TODO: 实现修改密码功能
        console.log('Change password')
      }
    }

    // ✅ Composition API: 返回渲染函数
    return () => (
      <header class="w-full h-16 bg-white border-b border-gray-200">
        <div class="flex items-center justify-between h-full px-6 max-w-screen-xl mx-auto">
          <a href="#" onClick={(e) => { e.preventDefault(); goHome() }} class="flex items-center">
            <img src="/img/logo-2000-390.svg" class="h-8" alt="Nacos" title="Nacos" />
          </a>
          
          {!isLoginPage.value && (
            <div class="flex items-center gap-4">
              <ElDropdown onCommand={handleCommand}>
                {{
                  default: () => (
                    <span class="cursor-pointer text-gray-700 hover:text-primary">
                      {username.value}
                    </span>
                  ),
                  dropdown: () => (
                    <ElDropdownMenu>
                      <ElDropdownItem command="logout">
                        {t('header.logout')}
                      </ElDropdownItem>
                      <ElDropdownItem command="changePassword">
                        {t('header.changePassword')}
                      </ElDropdownItem>
                    </ElDropdownMenu>
                  ),
                }}
              </ElDropdown>
              
              <span
                class="cursor-pointer text-gray-700 hover:text-primary"
                onClick={switchLang}
              >
                {t('header.languageSwitchButton')}
              </span>
            </div>
          )}
        </div>
      </header>
    )
  },
})

