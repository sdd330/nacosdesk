/**
 * MainLayout 组件
 * 使用 Vue 3 JSX + Composition API
 */

import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMenu, ElMenuItem, ElSubMenu, ElBadge, ElAlert, ElDialog } from 'element-plus'
import Header from './Header'
import getMenuData, { type MenuItem } from './menu'
import { useAppStore } from '@/stores/app'
import { useI18n } from '@/composables/useI18n'

export default defineComponent({
  name: 'MainLayout',
  setup() {
    // ✅ Composition API: 使用 composables
    const route = useRoute()
    const router = useRouter()
    const appStore = useAppStore()
    const { t, currentLocale } = useI18n()

    // ✅ Composition API: 使用 ref 定义响应式状态
    const isCollapsed = ref(false)
    const dialogVisible = ref(true)

    // ✅ Composition API: 使用 computed 派生状态
    const menuData = computed<MenuItem[]>(() => {
      return getMenuData(appStore.functionMode)
    })

    const activeMenu = computed(() => {
      const currentPath = route.path
      for (let i = 0; i < menuData.value.length; i++) {
        const menu = menuData.value[i]
        if (menu.url === currentPath) {
          return String(i)
        }
        if (menu.children) {
          for (let j = 0; j < menu.children.length; j++) {
            if (menu.children[j].url === currentPath) {
              return `${i}-${j}`
            }
          }
        }
      }
      return ''
    })

    const defaultOpenKeys = computed(() => {
      const keys: string[] = []
      for (let i = 0; i < menuData.value.length; i++) {
        const menu = menuData.value[i]
        if (menu.children) {
          const hasActive = menu.children.some(child => child.url === route.path)
          if (hasActive) {
            keys.push(String(i))
          }
        }
      }
      return keys
    })

    const showAlert = computed(() => 
      appStore.authEnabled === 'false' && appStore.consoleUiEnable === 'true'
    )

    const showDialog = computed(() => appStore.consoleUiEnable === 'false')

    // ✅ Composition API: 方法定义
    const navTo = (url: string) => {
      // 保留命名空间参数
      const params = new URLSearchParams()
      const currentParams = new URLSearchParams(window.location.search)
      
      const pageParamMap: Record<string, string[]> = {
        '/configurationManagement': ['namespace', 'namespaceShowName', 'dataId', 'group', 'appName'],
        '/agentManagement': ['namespace', 'namespaceShowName', 'searchName'],
        '/mcpServerManagement': ['namespace', 'namespaceShowName'],
        '/serviceManagement': ['namespace', 'namespaceShowName'],
      }
      
      const allowedParams = pageParamMap[url] || ['namespace', 'namespaceShowName']
      
      allowedParams.forEach(param => {
        if (param === 'namespace') {
          const ns = (window as any).nownamespace || ''
          if (ns) params.set('namespace', ns)
        } else if (param === 'namespaceShowName') {
          const nsName = (window as any).namespaceShowName || ''
          if (nsName) params.set('namespaceShowName', nsName)
        } else if (currentParams.has(param)) {
          params.set(param, currentParams.get(param)!)
        }
      })
      
      const query = params.toString()
      router.push(query ? `${url}?${query}` : url)
    }

    const handleMenuSelect = (_index: string) => {
      // 菜单选择处理已在 navTo 中完成
    }

    // ✅ Composition API: 生命周期钩子
    onMounted(async () => {
      await appStore.fetchServerState()
      await appStore.fetchNotice(currentLocale)
      if (appStore.consoleUiEnable === 'false') {
        await appStore.fetchGuide()
      }
    })

    // ✅ Composition API: 返回渲染函数
    return () => (
      <div class="min-h-screen bg-gray-50">
        <Header />
        
        <div class="flex">
          {/* 侧边栏 */}
          <aside class={`w-64 bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed.value ? 'w-16' : ''}`}>
            <div class="p-4 border-b border-gray-200">
              <h1 class="text-lg font-bold text-gray-800 mb-2">
                {t('mainLayout.nacosName')}
                {appStore.version && (
                  <span class="text-sm text-gray-500 ml-2">{appStore.version}</span>
                )}
              </h1>
              <h2 class="text-sm text-gray-600">
                {t('mainLayout.nacosMode')}
                <span class="text-gray-800 ml-2">{appStore.startupMode}</span>
              </h2>
            </div>
            
            <ElMenu
              {...{
                defaultActive: activeMenu.value,
                defaultOpenedKeys: defaultOpenKeys.value,
                class: 'border-0',
                onSelect: handleMenuSelect,
              }}
            >
              {menuData.value.map((menu, idx) => (
                menu.children ? (
                  <ElSubMenu key={`menu-${idx}`} index={String(idx)}>
                    {{
                      title: () => (
                        <>
                          <span>{t(`mainLayout.${menu.key}`)}</span>
                          {menu.badge && (
                            <ElBadge value={menu.badge} class="ml-2" />
                          )}
                        </>
                      ),
                      default: () => (
                        menu.children?.map((child, childIdx) => (
                          <ElMenuItem
                            key={`child-${childIdx}`}
                            index={`${idx}-${childIdx}`}
                            onClick={() => navTo(child.url!)}
                          >
                            {t(`mainLayout.${child.key}`)}
                          </ElMenuItem>
                        ))
                      ),
                    }}
                  </ElSubMenu>
                ) : (
                  <ElMenuItem
                    key={`menu-${idx}`}
                    index={String(idx)}
                    onClick={() => navTo(menu.url!)}
                  >
                    {t(`mainLayout.${menu.key}`)}
                  </ElMenuItem>
                )
              ))}
            </ElMenu>
          </aside>
          
          {/* 主内容区 */}
          <main class="flex-1 p-6 overflow-auto">
            {showAlert.value && (
              <ElAlert type="info" closable={false} class="mb-4">
                <div innerHTML={appStore.notice} />
              </ElAlert>
            )}
            
            {showDialog.value && (
              <ElDialog
                modelValue={dialogVisible.value}
                onUpdate:modelValue={(val: boolean) => (dialogVisible.value = val)}
                title={t('mainLayout.consoleClosed')}
                width="600px"
                showClose={false}
              >
                <ElAlert type="info" closable={false}>
                  <div innerHTML={appStore.guideMsg} />
                </ElAlert>
              </ElDialog>
            )}
            
            <router-view />
          </main>
        </div>
      </div>
    )
  },
})

