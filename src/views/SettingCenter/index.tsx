/**
 * SettingCenter 页面
 * 设置中心
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/SettingCenter/SettingCenter.js
 */

import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElRadioGroup,
  ElRadio,
  ElButton,
  ElMessage,
  ElSwitch,
  ElInputNumber,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import { setLocale, getLocale } from '@/i18n'
import { THEME_KEY, NAME_SHOW_KEY } from '@/utils/constants'
import PageTitle from '@/components/PageTitle/index'
import { isTauri } from '@/utils/tauriApi'
import {
  tauriStartApiServer,
  tauriStopApiServer,
  tauriGetApiServerStatus,
  tauriGetApiServerConfig,
  tauriUpdateApiServerConfig,
  type TauriServerStatus,
  type TauriServerConfig,
} from '@/utils/tauriApi'

export default defineComponent({
  name: 'SettingCenter',
  setup() {
    const { t } = useI18n()

    // 状态管理
    const theme = ref<'light' | 'dark'>(() => {
      const saved = localStorage.getItem(THEME_KEY)
      return saved === 'dark' ? 'dark' : 'light'
    })

    const language = ref<'zh-CN' | 'en-US'>(() => {
      const saved = getLocale()
      return saved === 'en-US' ? 'en-US' : 'zh-CN'
    })

    const nameShow = ref<'select' | 'label'>(() => {
      const saved = localStorage.getItem(NAME_SHOW_KEY)
      return saved === 'select' ? 'select' : 'label'
    })

    // API 服务器状态
    const apiServerEnabled = ref(false)
    const apiServerStatus = ref<TauriServerStatus | null>(null)
    const apiServerConfig = ref<TauriServerConfig | null>(null)
    const apiServerLoading = ref(false)
    const apiServerPort = ref(8848)
    
    // 限流配置
    const rateLimitEnabled = ref(false)
    const rateLimitCapacity = ref(100)
    const rateLimitRefillRate = ref(10)
    const rateLimitTokensPerRequest = ref(1)

    // 主题列表
    const themeList = [
      { value: 'light', label: t('settingCenter.settingLight') },
      { value: 'dark', label: t('settingCenter.settingDark') },
    ]

    // 语言列表
    const languageList = [
      { value: 'en-US', label: 'English' },
      { value: 'zh-CN', label: '中文' },
    ]

    // 命名空间显示方式列表
    const nameShowList = [
      { value: 'select', label: t('settingCenter.settingShowSelect') },
      { value: 'label', label: t('settingCenter.settingShowLabel') },
    ]

    // 提交设置
    const handleSubmit = () => {
      // 保存主题设置
      localStorage.setItem(THEME_KEY, theme.value)
      
      // 保存语言设置
      setLocale(language.value)
      
      // 保存命名空间显示方式
      localStorage.setItem(NAME_SHOW_KEY, nameShow.value)

      ElMessage.success(t('settingCenter.settingSubmitSuccess') || '设置已保存')

      // 应用主题（如果需要动态切换主题，可以在这里添加逻辑）
      if (theme.value === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      // 触发命名空间显示方式变更事件（供 NameSpaceList 组件监听）
      window.dispatchEvent(new CustomEvent('nameShowChanged', { detail: nameShow.value }))
    }

    // 获取 API 服务器状态
    const fetchApiServerStatus = async () => {
      if (!isTauri()) return
      
      try {
        apiServerLoading.value = true
        const status = await tauriGetApiServerStatus()
        apiServerStatus.value = status
        apiServerEnabled.value = status.running
        if (status.port) {
          apiServerPort.value = status.port
        }
      } catch (error: any) {
        console.error('获取 API 服务器状态失败:', error)
        ElMessage.error(error?.message || '获取 API 服务器状态失败')
      } finally {
        apiServerLoading.value = false
      }
    }

    // 获取 API 服务器配置
    const fetchApiServerConfig = async () => {
      if (!isTauri()) return
      
      try {
        const config = await tauriGetApiServerConfig()
        apiServerConfig.value = config
        apiServerPort.value = config.port
        // 加载限流配置
        rateLimitEnabled.value = config.rate_limit_enabled ?? false
        rateLimitCapacity.value = config.rate_limit_capacity ?? 100
        rateLimitRefillRate.value = config.rate_limit_refill_rate ?? 10
        rateLimitTokensPerRequest.value = config.rate_limit_tokens_per_request ?? 1
      } catch (error: any) {
        console.error('获取 API 服务器配置失败:', error)
      }
    }

    // 切换 API 服务器状态
    const handleApiServerToggle = async (enabled: boolean) => {
      if (!isTauri()) {
        ElMessage.warning('此功能仅在桌面应用中可用')
        return
      }

      try {
        apiServerLoading.value = true
        
        if (enabled) {
          // 启动服务器
          await tauriStartApiServer(apiServerPort.value)
          ElMessage.success(t('settingCenter.apiServerStartSuccess') || 'API 服务器已启动')
          apiServerEnabled.value = true
        } else {
          // 停止服务器
          await tauriStopApiServer()
          ElMessage.success(t('settingCenter.apiServerStopSuccess') || 'API 服务器已停止')
          apiServerEnabled.value = false
        }
        
        // 刷新状态
        await fetchApiServerStatus()
      } catch (error: any) {
        console.error('切换 API 服务器状态失败:', error)
        ElMessage.error(error?.message || (enabled ? '启动 API 服务器失败' : '停止 API 服务器失败'))
        // 恢复开关状态
        apiServerEnabled.value = !enabled
      } finally {
        apiServerLoading.value = false
      }
    }

    // 更新端口配置
    const handlePortChange = async (port: number) => {
      if (!isTauri() || !apiServerConfig.value) return
      
      try {
        const newConfig: TauriServerConfig = {
          ...apiServerConfig.value,
          port,
        }
        await tauriUpdateApiServerConfig(newConfig)
        apiServerConfig.value = newConfig
        ElMessage.success(t('settingCenter.apiServerPortUpdated') || '端口配置已更新')
      } catch (error: any) {
        console.error('更新端口配置失败:', error)
        ElMessage.error(error?.message || '更新端口配置失败')
      }
    }

    // 更新限流配置
    const handleRateLimitConfigChange = async () => {
      if (!isTauri() || !apiServerConfig.value) return
      
      try {
        const newConfig: TauriServerConfig = {
          ...apiServerConfig.value,
          rate_limit_enabled: rateLimitEnabled.value,
          rate_limit_capacity: rateLimitCapacity.value,
          rate_limit_refill_rate: rateLimitRefillRate.value,
          rate_limit_tokens_per_request: rateLimitTokensPerRequest.value,
        }
        await tauriUpdateApiServerConfig(newConfig)
        apiServerConfig.value = newConfig
        ElMessage.success(t('settingCenter.rateLimitConfigUpdated') || '限流配置已更新')
      } catch (error: any) {
        console.error('更新限流配置失败:', error)
        ElMessage.error(error?.message || '更新限流配置失败')
      }
    }

    let statusInterval: ReturnType<typeof setInterval> | null = null

    onMounted(() => {
      if (isTauri()) {
        fetchApiServerConfig()
        fetchApiServerStatus()
        // 定期刷新状态（每 5 秒）
        statusInterval = setInterval(() => {
          if (apiServerEnabled.value) {
            fetchApiServerStatus()
          }
        }, 5000)
      }
    })

    onUnmounted(() => {
      if (statusInterval) {
        clearInterval(statusInterval)
      }
    })

    return () => (
      <div class="setting-center-container p-4">
        <PageTitle title={t('settingCenter.settingTitle')} />

        <ElCard>
          <ElForm label-width="150px" class="setting-form">
            <ElFormItem label={t('settingCenter.settingTheme')}>
              <ElRadioGroup
                modelValue={theme.value}
                onUpdate:modelValue={(val: 'light' | 'dark') => {
                  theme.value = val
                }}
              >
                {themeList.map((item) => (
                  <ElRadio key={item.value} label={item.value}>
                    {item.label}
                  </ElRadio>
                ))}
              </ElRadioGroup>
            </ElFormItem>

            <ElFormItem label={t('settingCenter.settingLocale')}>
              <ElRadioGroup
                modelValue={language.value}
                onUpdate:modelValue={(val: 'zh-CN' | 'en-US') => {
                  language.value = val
                }}
              >
                {languageList.map((item) => (
                  <ElRadio key={item.value} label={item.value}>
                    {item.label}
                  </ElRadio>
                ))}
              </ElRadioGroup>
            </ElFormItem>

            <ElFormItem label={t('settingCenter.settingShow')}>
              <ElRadioGroup
                modelValue={nameShow.value}
                onUpdate:modelValue={(val: 'select' | 'label') => {
                  nameShow.value = val
                }}
              >
                {nameShowList.map((item) => (
                  <ElRadio key={item.value} label={item.value}>
                    {item.label}
                  </ElRadio>
                ))}
              </ElRadioGroup>
            </ElFormItem>

            {/* API 服务器控制（仅 Tauri 环境） */}
            {isTauri() && (
              <>
                <ElFormItem label={t('settingCenter.apiServerEnabled')}>
                  <div class="flex items-center gap-4">
                    <ElSwitch
                      modelValue={apiServerEnabled.value}
                      onUpdate:modelValue={handleApiServerToggle}
                      disabled={apiServerLoading.value}
                      loading={apiServerLoading.value}
                    />
                    <span class="text-sm text-gray-500">
                      {apiServerEnabled.value
                        ? t('settingCenter.apiServerRunning') || '运行中'
                        : t('settingCenter.apiServerStopped') || '已停止'}
                    </span>
                  </div>
                </ElFormItem>

                {apiServerEnabled.value && apiServerStatus.value && (
                  <ElFormItem label={t('settingCenter.apiServerStatus')}>
                    <div class="text-sm text-gray-600">
                      <div>
                        {t('settingCenter.apiServerPort')}: {apiServerStatus.value.port || '--'}
                      </div>
                      <div>
                        {t('settingCenter.apiServerRequests')}: {apiServerStatus.value.request_count || 0}
                      </div>
                      <div>
                        {t('settingCenter.apiServerErrors')}: {apiServerStatus.value.error_count || 0}
                      </div>
                    </div>
                  </ElFormItem>
                )}

                <ElFormItem label={t('settingCenter.apiServerPort')}>
                  <ElInputNumber
                    modelValue={apiServerPort.value}
                    onUpdate:modelValue={(val: number | null) => {
                      if (val !== null) {
                        apiServerPort.value = val
                        handlePortChange(val)
                      }
                    }}
                    min={1024}
                    max={65535}
                    disabled={apiServerEnabled.value || apiServerLoading.value}
                    style={{ width: '200px' }}
                  />
                  <span class="ml-2 text-sm text-gray-500">
                    {t('settingCenter.apiServerPortHint') || '（停止服务器后可修改）'}
                  </span>
                </ElFormItem>

                {/* 请求限流配置 */}
                <ElFormItem label={t('settingCenter.rateLimitEnabled') || '请求限流'}>
                  <div class="flex items-center gap-4">
                    <ElSwitch
                      modelValue={rateLimitEnabled.value}
                      onUpdate:modelValue={(val: boolean) => {
                        rateLimitEnabled.value = val
                        handleRateLimitConfigChange()
                      }}
                      disabled={apiServerLoading.value}
                    />
                    <span class="text-sm text-gray-500">
                      {rateLimitEnabled.value
                        ? t('settingCenter.rateLimitEnabled') || '已启用'
                        : t('settingCenter.rateLimitDisabled') || '已禁用'}
                    </span>
                  </div>
                </ElFormItem>

                {rateLimitEnabled.value && (
                  <>
                    <ElFormItem label={t('settingCenter.rateLimitCapacity') || '令牌桶容量'}>
                      <ElInputNumber
                        modelValue={rateLimitCapacity.value}
                        onUpdate:modelValue={(val: number | null) => {
                          if (val !== null && val > 0) {
                            rateLimitCapacity.value = val
                            handleRateLimitConfigChange()
                          }
                        }}
                        min={1}
                        max={10000}
                        style={{ width: '200px' }}
                      />
                      <span class="ml-2 text-sm text-gray-500">
                        {t('settingCenter.rateLimitCapacityHint') || '令牌桶的最大容量'}
                      </span>
                    </ElFormItem>

                    <ElFormItem label={t('settingCenter.rateLimitRefillRate') || '每秒补充令牌数'}>
                      <ElInputNumber
                        modelValue={rateLimitRefillRate.value}
                        onUpdate:modelValue={(val: number | null) => {
                          if (val !== null && val > 0) {
                            rateLimitRefillRate.value = val
                            handleRateLimitConfigChange()
                          }
                        }}
                        min={1}
                        max={1000}
                        style={{ width: '200px' }}
                      />
                      <span class="ml-2 text-sm text-gray-500">
                        {t('settingCenter.rateLimitRefillRateHint') || '每秒补充的令牌数量'}
                      </span>
                    </ElFormItem>

                    <ElFormItem label={t('settingCenter.rateLimitTokensPerRequest') || '每个请求消耗令牌数'}>
                      <ElInputNumber
                        modelValue={rateLimitTokensPerRequest.value}
                        onUpdate:modelValue={(val: number | null) => {
                          if (val !== null && val > 0) {
                            rateLimitTokensPerRequest.value = val
                            handleRateLimitConfigChange()
                          }
                        }}
                        min={1}
                        max={100}
                        style={{ width: '200px' }}
                      />
                      <span class="ml-2 text-sm text-gray-500">
                        {t('settingCenter.rateLimitTokensPerRequestHint') || '每个请求消耗的令牌数量'}
                      </span>
                    </ElFormItem>
                  </>
                )}
              </>
            )}

            <ElFormItem>
              <ElButton type="primary" onClick={handleSubmit}>
                {t('settingCenter.settingSubmit')}
              </ElButton>
            </ElFormItem>
          </ElForm>
        </ElCard>
      </div>
    )
  },
})
