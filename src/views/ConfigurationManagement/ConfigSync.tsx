/**
 * ConfigSync 页面
 * 配置同步功能
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/ConfigurationManagement/ConfigSync/ConfigSync.js
 */

import { defineComponent, ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElMessage,
  ElMessageBox,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import SuccessDialog from '@/components/SuccessDialog/index'
import MonacoEditor from '@/components/MonacoEditor/index'
import { getConfigDetail } from '@/api/configuration'
import { urlParams } from '@/utils/urlParams'
import httpClient from '@/utils/request'

export default defineComponent({
  name: 'ConfigSync',
  setup() {
    // ✅ Composition API: 使用 composables
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()

    // ✅ Composition API: 使用 ref 定义响应式状态
    const successDialogRef = ref()
    const monacoEditorRef = ref()
    const loading = ref(false)

    const dataId = ref(urlParams.getParams('dataId') || '')
    const group = ref(urlParams.getParams('group') || 'DEFAULT_GROUP')
    const namespace = ref(urlParams.getParams('namespace') || 'public')
    const serverId = ref(urlParams.getParams('serverId') || '')

    const configContent = ref('')
    const configType = ref('text')
    const envList = ref<Array<{ label: string; value: string }>>([])
    const selectedEnvs = ref<string[]>([])

    // ✅ Composition API: 方法定义
    const fetchConfigDetail = async () => {
      if (!dataId.value) {
        ElMessage.error(t('config.dataIdRequired') || 'Data ID 不能为空')
        return
      }

      loading.value = true
      try {
        const response = await getConfigDetail({
          dataId: dataId.value,
          group: group.value,
          namespaceId: namespace.value,
        })

        if (response.code === 0 && response.data) {
          configContent.value = response.data.content || ''
          configType.value = response.data.type || 'text'
        } else {
          ElMessage.error(response.message || t('config.getConfigFailed') || '获取配置失败')
        }
      } catch (error: any) {
        ElMessage.error(error.message || t('config.getConfigFailed') || '获取配置失败')
      } finally {
        loading.value = false
      }
    }

    const fetchEnvList = async () => {
      // TODO: 根据实际 API 获取环境列表
      // 这里先使用模拟数据
      envList.value = [
        { label: '开发环境', value: 'dev' },
        { label: '测试环境', value: 'test' },
        { label: '生产环境', value: 'prod' },
      ]
    }

    const handleSync = async () => {
      if (selectedEnvs.value.length === 0) {
        ElMessage.warning(t('configSync.selectTargetEnv') || '请选择目标环境')
        return
      }

      if (!configContent.value) {
        ElMessage.warning(t('config.dataRequired') || '配置内容不能为空')
        return
      }

      try {
        await ElMessageBox.confirm(
          t('configSync.confirmSync') || '确定要同步配置到选中的环境吗？',
          t('common.prompt') || '提示',
          {
            confirmButtonText: t('common.confirm') || '确定',
            cancelButtonText: t('common.cancel') || '取消',
            type: 'warning',
          }
        )

        loading.value = true

        // TODO: 根据实际 API 实现同步逻辑
        // 这里先使用模拟数据
        const content = monacoEditorRef.value
          ? (monacoEditorRef.value as any).getValue()
          : configContent.value

        // 模拟同步请求
        const syncPromises = selectedEnvs.value.map(async (env) => {
          // 实际应该调用同步 API
          // await httpClient.post('/v3/console/cs/config/sync', {
          //   dataId: dataId.value,
          //   group: group.value,
          //   namespaceId: namespace.value,
          //   targetEnv: env,
          //   content: content,
          // })
          return Promise.resolve({ env, success: true })
        })

        const results = await Promise.all(syncPromises)
        const successCount = results.filter((r) => r.success).length

        loading.value = false

        if (successDialogRef.value) {
          ;(successDialogRef.value as any).openDialog({
            total: selectedEnvs.value.length,
            success: successCount,
            failed: selectedEnvs.value.length - successCount,
          })
        }

        ElMessage.success(
          t('configSync.syncSuccess') || `配置同步成功：${successCount}/${selectedEnvs.value.length}`
        )
      } catch (error: any) {
        loading.value = false
        if (error !== 'cancel') {
          ElMessage.error(error.message || t('configSync.syncFailed') || '配置同步失败')
        }
      }
    }

    const handleBack = () => {
      router.push({
        name: 'ConfigurationManagement',
        query: {
          namespace: namespace.value,
        },
      })
    }

    // ✅ Composition API: 生命周期钩子
    onMounted(async () => {
      await Promise.all([fetchConfigDetail(), fetchEnvList()])
    })

    // ✅ Composition API: 返回渲染函数
    return () => (
      <div class="p-6">
        <ElCard>
          <ElForm label-width="120px">
            <ElFormItem label={t('config.dataId') || 'Data ID'}>
              <ElInput
                modelValue={dataId.value}
                disabled
                style="width: 400px"
              />
            </ElFormItem>
            <ElFormItem label={t('config.group') || 'Group'}>
              <ElInput
                modelValue={group.value}
                disabled
                style="width: 400px"
              />
            </ElFormItem>
            <ElFormItem label={t('configSync.configContent') || '配置内容'} required>
              <div style="width: 100%; height: 400px">
                <MonacoEditor
                  ref={monacoEditorRef}
                  value={configContent.value}
                  language={configType.value}
                  readOnly={false}
                />
              </div>
            </ElFormItem>
            <ElFormItem label={t('configSync.target') || '目标环境'} required>
              <ElCheckboxGroup
                modelValue={selectedEnvs.value}
                onUpdate:modelValue={(val: string[]) => (selectedEnvs.value = val)}
              >
                {envList.value.map((env) => (
                  <ElCheckbox key={env.value} label={env.value}>
                    {env.label}
                  </ElCheckbox>
                ))}
              </ElCheckboxGroup>
            </ElFormItem>
            <ElFormItem>
              <div class="flex justify-end gap-2">
                <ElButton type="primary" onClick={handleSync} loading={loading.value}>
                  {t('configSync.sync') || '同步'}
                </ElButton>
                <ElButton onClick={handleBack}>
                  {t('common.back') || '返回'}
                </ElButton>
              </div>
            </ElFormItem>
          </ElForm>
        </ElCard>

        <SuccessDialog ref={successDialogRef} />
      </div>
    )
  },
})
