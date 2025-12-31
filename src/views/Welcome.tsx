/**
 * Welcome 页面
 * 欢迎页/首页
 * 使用 Vue 3 JSX + Composition API
 */

import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElCard,
  ElRow,
  ElCol,
  ElButton,
  ElIcon,
  ElStatistic,
  ElTag,
} from 'element-plus'
import {
  Document,
  Setting,
  User,
  Connection,
  DataAnalysis,
  Tools,
} from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'
import { useAuthStore } from '@/stores/auth'
import { getServerState } from '@/api/auth'

export default defineComponent({
  name: 'Welcome',
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    const authStore = useAuthStore()

    const loading = ref(false)
    const serverInfo = ref<any>(null)

    // 获取服务器信息
    const fetchServerInfo = async () => {
      try {
        loading.value = true
        const info = await getServerState()
        serverInfo.value = info
      } catch (error: any) {
        console.error('获取服务器信息失败:', error)
      } finally {
        loading.value = false
      }
    }

    // 快速导航
    const quickNavItems = [
      {
        title: t('welcome.configManagement') || '配置管理',
        desc: t('welcome.configManagementDesc') || '管理配置文件和配置历史',
        icon: Document,
        path: '/configurationManagement',
        color: '#409EFF',
      },
      {
        title: t('welcome.serviceManagement') || '服务管理',
        desc: t('welcome.serviceManagementDesc') || '管理服务注册和发现',
        icon: Connection,
        path: '/serviceManagement',
        color: '#67C23A',
      },
      {
        title: t('welcome.namespaceManagement') || '命名空间',
        desc: t('welcome.namespaceManagementDesc') || '管理命名空间和隔离环境',
        icon: Setting,
        path: '/namespace',
        color: '#E6A23C',
      },
      {
        title: t('welcome.userManagement') || '用户管理',
        desc: t('welcome.userManagementDesc') || '管理系统用户和权限',
        icon: User,
        path: '/userManagement',
        color: '#F56C6C',
      },
      {
        title: t('welcome.clusterManagement') || '集群管理',
        desc: t('welcome.clusterManagementDesc') || '管理集群节点和状态',
        icon: DataAnalysis,
        path: '/clusterManagement',
        color: '#909399',
      },
      {
        title: t('welcome.aiManagement') || 'AI 功能',
        desc: t('welcome.aiManagementDesc') || '管理 MCP 服务器和 Agent',
        icon: Tools,
        path: '/mcpServerManagement',
        color: '#9C27B0',
      },
    ]

    const handleQuickNav = (path: string) => {
      router.push(path)
    }

    onMounted(() => {
      fetchServerInfo()
    })

    return () => (
      <div class="p-6">
        {/* 欢迎标题 */}
        <div class="mb-6">
          <h1 class="text-3xl font-bold mb-2">
            {t('welcome.title') || '欢迎使用 Nacos Desktop'}
          </h1>
          <p class="text-gray-500 text-lg">
            {t('welcome.subtitle') || 'Nacos 配置中心和服务发现管理平台'}
          </p>
        </div>

        {/* 服务器信息卡片 */}
        {serverInfo.value && (
          <ElCard class="mb-6" v-loading={loading.value}>
            <div class="grid grid-cols-4 gap-4">
              <ElStatistic
                title={t('welcome.serverVersion') || '服务器版本'}
                value={serverInfo.value.version || '--'}
              />
              <ElStatistic
                title={t('welcome.serverMode') || '运行模式'}
                value={serverInfo.value.mode || '--'}
              />
              <ElStatistic
                title={t('welcome.serverStatus') || '服务器状态'}
                value={serverInfo.value.status || '--'}
              />
              <ElStatistic
                title={t('welcome.namespaceCount') || '命名空间数'}
                value={serverInfo.value.namespaceCount || 0}
              />
            </div>
          </ElCard>
        )}

        {/* 快速导航 */}
        <div class="mb-6">
          <h2 class="text-xl font-semibold mb-4">
            {t('welcome.quickNav') || '快速导航'}
          </h2>
          <ElRow gutter={20}>
            {quickNavItems.map((item) => (
              <ElCol xs={24} sm={12} md={8} lg={8} xl={8} key={item.path}>
                <ElCard
                  class="mb-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleQuickNav(item.path)}
                  style={{
                    borderTop: `4px solid ${item.color}`,
                  }}
                >
                  <div class="flex items-start">
                    <div
                      class="p-3 rounded-lg mr-4"
                      style={{
                        backgroundColor: `${item.color}15`,
                        color: item.color,
                      }}
                    >
                      <ElIcon size={24}>
                        <item.icon />
                      </ElIcon>
                    </div>
                    <div class="flex-1">
                      <h3 class="text-lg font-semibold mb-1">{item.title}</h3>
                      <p class="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                </ElCard>
              </ElCol>
            ))}
          </ElRow>
        </div>

        {/* 功能特性 */}
        <ElCard>
          <h2 class="text-xl font-semibold mb-4">
            {t('welcome.features') || '功能特性'}
          </h2>
          <ElRow gutter={20}>
            <ElCol xs={24} sm={12} md={6}>
              <div class="text-center p-4">
                <ElIcon size={40} color="#409EFF" class="mb-2">
                  <Document />
                </ElIcon>
                <h3 class="font-semibold mb-2">
                  {t('welcome.configCenter') || '配置中心'}
                </h3>
                <p class="text-sm text-gray-500">
                  {t('welcome.configCenterDesc') ||
                    '集中管理应用配置，支持动态刷新'}
                </p>
              </div>
            </ElCol>
            <ElCol xs={24} sm={12} md={6}>
              <div class="text-center p-4">
                <ElIcon size={40} color="#67C23A" class="mb-2">
                  <Connection />
                </ElIcon>
                <h3 class="font-semibold mb-2">
                  {t('welcome.serviceDiscovery') || '服务发现'}
                </h3>
                <p class="text-sm text-gray-500">
                  {t('welcome.serviceDiscoveryDesc') ||
                    '自动服务注册与发现，支持健康检查'}
                </p>
              </div>
            </ElCol>
            <ElCol xs={24} sm={12} md={6}>
              <div class="text-center p-4">
                <ElIcon size={40} color="#E6A23C" class="mb-2">
                  <Setting />
                </ElIcon>
                <h3 class="font-semibold mb-2">
                  {t('welcome.namespaceIsolation') || '命名空间隔离'}
                </h3>
                <p class="text-sm text-gray-500">
                  {t('welcome.namespaceIsolationDesc') ||
                    '多环境隔离，支持灰度发布'}
                </p>
              </div>
            </ElCol>
            <ElCol xs={24} sm={12} md={6}>
              <div class="text-center p-4">
                <ElIcon size={40} color="#9C27B0" class="mb-2">
                  <Tools />
                </ElIcon>
                <h3 class="font-semibold mb-2">
                  {t('welcome.aiIntegration') || 'AI 集成'}
                </h3>
                <p class="text-sm text-gray-500">
                  {t('welcome.aiIntegrationDesc') ||
                    'MCP 服务器和 Agent 管理'}
                </p>
              </div>
            </ElCol>
          </ElRow>
        </ElCard>
      </div>
    )
  },
})
