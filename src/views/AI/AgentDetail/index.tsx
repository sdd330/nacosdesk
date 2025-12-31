/**
 * AgentDetail 页面
 * Agent 详情页面
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/AI/AgentDetail/AgentDetail.js
 */

import { defineComponent, ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ElCard,
  ElButton,
  ElMessage,
  ElMessageBox,
  ElTag,
  ElIcon,
  ElDivider,
} from 'element-plus'
import { ArrowLeft, Edit, VideoPlay, VideoPause } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'
import MonacoEditor from '@/components/MonacoEditor/index'
import PageTitle from '@/components/PageTitle/index'
import { urlParams } from '@/utils/urlParams'
import { useAiStore } from '@/stores/ai'
import type { Agent } from '@/api/ai'

export default defineComponent({
  name: 'AgentDetail',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()
    const aiStore = useAiStore()

    const loading = ref(false)
    const agentDetail = ref<Agent | null>(null)
    const currentNamespace = ref(urlParams.getParams('namespace') || 'public')
    const configEditorRef = ref<InstanceType<typeof MonacoEditor>>()
    const configEditing = ref(false)
    const configContent = ref('')

    // 获取 Agent 详情
    const fetchAgentDetail = async () => {
      const agentName = route.query.name as string

      if (!agentName) {
        ElMessage.error(t('agentManagement.agentNameRequired') || 'Agent 名称不能为空')
        router.back()
        return
      }

      loading.value = true
      try {
        const detail = await aiStore.fetchAgentDetail(agentName, currentNamespace.value)
        if (detail) {
          agentDetail.value = detail
          configContent.value = detail.config
            ? JSON.stringify(detail.config, null, 2)
            : '{}'
        }
      } catch (error: any) {
        ElMessage.error(error.message || '获取 Agent 详情失败')
      } finally {
        loading.value = false
      }
    }

    // 编辑配置
    const handleEditConfig = () => {
      configEditing.value = true
    }

    // 保存配置
    const handleSaveConfig = async () => {
      if (!agentDetail.value) return

      try {
        let config: any = {}
        try {
          config = JSON.parse(configContent.value)
        } catch (error) {
          ElMessage.error(t('agentManagement.configInvalid') || '配置必须是有效的 JSON 格式')
          return
        }

        await aiStore.updateAgentInfo(
          agentDetail.value.name,
          { config },
          currentNamespace.value
        )
        ElMessage.success(t('agentManagement.updateSuccess') || '更新成功')
        configEditing.value = false
        await fetchAgentDetail()
      } catch (error: any) {
        ElMessage.error(error.message || '更新失败')
      }
    }

    // 取消编辑
    const handleCancelEdit = () => {
      if (agentDetail.value) {
        configContent.value = agentDetail.value.config
          ? JSON.stringify(agentDetail.value.config, null, 2)
          : '{}'
      }
      configEditing.value = false
    }

    // 启动 Agent
    const handleStart = async () => {
      if (!agentDetail.value) return

      try {
        await ElMessageBox.confirm(
          t('agentManagement.startAgentConfirm') || `确定要启动 Agent "${agentDetail.value.name}" 吗？`,
          t('agentManagement.startConfirm') || '启动确认',
          {
            confirmButtonText: t('common.confirm') || '确定',
            cancelButtonText: t('common.cancel') || '取消',
            type: 'warning',
          }
        )

        await aiStore.startAgentInstance(agentDetail.value.name, currentNamespace.value)
        ElMessage.success(t('agentManagement.startSuccess') || '启动成功')
        await fetchAgentDetail()
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error(error.message || t('agentManagement.startFailed') || '启动失败')
        }
      }
    }

    // 停止 Agent
    const handleStop = async () => {
      if (!agentDetail.value) return

      try {
        await ElMessageBox.confirm(
          t('agentManagement.stopAgentConfirm') || `确定要停止 Agent "${agentDetail.value.name}" 吗？`,
          t('agentManagement.stopConfirm') || '停止确认',
          {
            confirmButtonText: t('common.confirm') || '确定',
            cancelButtonText: t('common.cancel') || '取消',
            type: 'warning',
          }
        )

        await aiStore.stopAgentInstance(agentDetail.value.name, currentNamespace.value)
        ElMessage.success(t('agentManagement.stopSuccess') || '停止成功')
        await fetchAgentDetail()
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error(error.message || t('agentManagement.stopFailed') || '停止失败')
        }
      }
    }

    // 编辑 Agent
    const handleEdit = () => {
      router.push({
        name: 'NewAgent',
        query: {
          name: agentDetail.value?.name,
          namespace: currentNamespace.value,
          mode: 'edit',
        },
      })
    }

    // 返回列表
    const handleBack = () => {
      router.back()
    }

    // 渲染状态标签
    const renderStatus = () => {
      if (!agentDetail.value) return null

      const status = (agentDetail.value as any).status || 'stopped'
      const statusMap: Record<string, { type: 'success' | 'danger' | 'warning' | 'info', text: string }> = {
        running: { type: 'success', text: t('agentManagement.running') || '运行中' },
        stopped: { type: 'info', text: t('agentManagement.stopped') || '已停止' },
        error: { type: 'danger', text: t('agentManagement.error') || '错误' },
      }
      const statusInfo = statusMap[status] || statusMap.stopped
      return <ElTag type={statusInfo.type} size="large">{statusInfo.text}</ElTag>
    }

    onMounted(() => {
      fetchAgentDetail()
    })

    return () => (
      <div class="p-6">
        <div class="mb-4 flex items-center">
          <ElButton
            icon={<ElIcon><ArrowLeft /></ElIcon>}
            onClick={handleBack}
            class="mr-4"
          >
            {t('common.back') || '返回'}
          </ElButton>
          <PageTitle
            title={t('agentManagement.agentDetail') || 'Agent 详情'}
            desc={agentDetail.value?.description}
            namespaceId={currentNamespace.value}
            namespaceName={currentNamespace.value}
            nameSpace={true}
          />
        </div>

        {/* 基本信息 */}
        {agentDetail.value && (
          <ElCard class="mb-4" v-loading={loading.value}>
            <div class="mb-4 flex justify-between items-center">
              <h3 class="text-lg font-bold">{t('agentManagement.basicInfo') || '基本信息'}</h3>
              <div class="flex gap-2">
                <ElButton type="primary" onClick={handleEdit}>
                  <ElIcon><Edit /></ElIcon>
                  {t('common.edit') || '编辑'}
                </ElButton>
                {(agentDetail.value as any).status === 'running' ? (
                  <ElButton type="warning" onClick={handleStop}>
                    <ElIcon><VideoPause /></ElIcon>
                    {t('agentManagement.stop') || '停止'}
                  </ElButton>
                ) : (
                  <ElButton type="success" onClick={handleStart}>
                    <ElIcon><VideoPlay /></ElIcon>
                    {t('agentManagement.start') || '启动'}
                  </ElButton>
                )}
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span class="text-gray-500">{t('agentManagement.agentName') || 'Agent 名称'}:</span>
                <span class="ml-2 font-semibold">{agentDetail.value.name}</span>
              </div>
              <div>
                <span class="text-gray-500">{t('agentManagement.status') || '状态'}:</span>
                <span class="ml-2">{renderStatus()}</span>
              </div>
              <div>
                <span class="text-gray-500">{t('agentManagement.description') || '描述'}:</span>
                <span class="ml-2">{agentDetail.value.description || '--'}</span>
              </div>
              {(agentDetail.value as any).version && (
                <div>
                  <span class="text-gray-500">{t('agentManagement.version') || '版本'}:</span>
                  <span class="ml-2">{(agentDetail.value as any).version}</span>
                </div>
              )}
              {(agentDetail.value as any).ip && (
                <div>
                  <span class="text-gray-500">{t('agentManagement.ip') || 'IP'}:</span>
                  <span class="ml-2">{(agentDetail.value as any).ip}</span>
                </div>
              )}
              {(agentDetail.value as any).updateTime && (
                <div>
                  <span class="text-gray-500">{t('agentManagement.updateTime') || '更新时间'}:</span>
                  <span class="ml-2">{(agentDetail.value as any).updateTime}</span>
                </div>
              )}
            </div>
          </ElCard>
        )}

        {/* 配置信息 */}
        {agentDetail.value && (
          <ElCard v-loading={loading.value}>
            <div class="mb-4 flex justify-between items-center">
              <h3 class="text-lg font-bold">{t('agentManagement.configInfo') || '配置信息'}</h3>
              {!configEditing.value ? (
                <ElButton type="primary" onClick={handleEditConfig}>
                  <ElIcon><Edit /></ElIcon>
                  {t('common.edit') || '编辑'}
                </ElButton>
              ) : (
                <div class="flex gap-2">
                  <ElButton type="success" onClick={handleSaveConfig}>
                    {t('common.save') || '保存'}
                  </ElButton>
                  <ElButton onClick={handleCancelEdit}>
                    {t('common.cancel') || '取消'}
                  </ElButton>
                </div>
              )}
            </div>

            <MonacoEditor
              ref={configEditorRef}
              modelValue={configContent.value}
              onUpdate:modelValue={(val: string) => (configContent.value = val)}
              language="json"
              height="500px"
              readOnly={!configEditing.value}
            />
          </ElCard>
        )}
      </div>
    )
  },
})
