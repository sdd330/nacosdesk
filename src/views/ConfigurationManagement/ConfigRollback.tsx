/**
 * ConfigRollback 页面
 * 配置回滚功能
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/ConfigurationManagement/ConfigRollback/ConfigRollback.js
 */

import { defineComponent, ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElMessage,
  ElMessageBox,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import MonacoEditor from '@/components/MonacoEditor/index'
import { getHistoryDetail, rollbackConfig } from '@/api/configuration'
import { urlParams } from '@/utils/urlParams'

export default defineComponent({
  name: 'ConfigRollback',
  setup() {
    // ✅ Composition API: 使用 composables
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()

    // ✅ Composition API: 使用 ref 定义响应式状态
    const monacoEditorRef = ref()
    const loading = ref(false)
    const showMore = ref(false)

    const dataId = ref(route.query.dataId as string || '')
    const group = ref(route.query.group as string || 'DEFAULT_GROUP')
    const nid = ref(route.query.nid as string || '')
    const namespace = ref(route.query.namespace as string || 'public')

    const formData = reactive({
      dataId: '',
      group: '',
      appName: '',
      content: '',
      md5: '',
      opType: '',
      type: 'text',
    })

    const extInfo = ref<any>({})

    // ✅ Composition API: 方法定义
    const fetchHistoryDetail = async () => {
      if (!dataId.value || !group.value || !nid.value) {
        ElMessage.error(t('configRollback.missingParams') || '缺少必要参数')
        return
      }

      loading.value = true
      try {
        const response = await getHistoryDetail({
          dataId: dataId.value,
          groupName: group.value,
          nid: nid.value,
        })

        formData.dataId = response.dataId
        formData.group = response.groupName
        formData.content = response.content || ''
        formData.md5 = response.md5 || ''
        formData.opType = response.opType?.trim() || ''
        formData.type = response.type || 'text'

        if (response.extInfo) {
          try {
            extInfo.value = JSON.parse(response.extInfo)
            if (extInfo.value.type) {
              formData.type = extInfo.value.type
            }
          } catch (e) {
            extInfo.value = {}
          }
        }

        // 尝试获取 appName（如果 extInfo 中有）
        if (extInfo.value.appName) {
          formData.appName = extInfo.value.appName
        }
      } catch (error: any) {
        ElMessage.error(error.message || t('configRollback.getHistoryFailed') || '获取历史版本失败')
      } finally {
        loading.value = false
      }
    }

    const getOpTypeLabel = (opType: string): string => {
      const typeMap: Record<string, string> = {
        U: t('configRollback.update') || '更新',
        I: t('configRollback.insert') || '插入',
        D: t('configRollback.delete') || '删除',
      }
      return typeMap[opType] || opType
    }

    const handleRollback = async () => {
      try {
        const additionalMsg = formData.opType === 'I' 
          ? t('configRollback.additionalRollbackMessage') || '（删除配置）'
          : ''

        await ElMessageBox.confirm(
          <div>
            <h3 style="margin-top: -20px; max-width: 500px;">
              {t('configRollback.confirmRollback') || '确定要回滚以下配置吗？'}{additionalMsg}
            </h3>
            <p>
              <span style="color: #999; margin-right: 5px;">Data ID</span>
              <span style="color: #c7254e;">{formData.dataId}</span>
            </p>
            <p>
              <span style="color: #999; margin-right: 5px;">Group</span>
              <span style="color: #c7254e;">{formData.group}</span>
            </p>
          </div>,
          t('configRollback.rollback') || '配置回滚',
          {
            confirmButtonText: t('common.confirm') || '确定',
            cancelButtonText: t('common.cancel') || '取消',
            type: 'warning',
            dangerouslyUseHTMLString: false,
          }
        )

        loading.value = true

        // 使用专门的回滚 API
        const result = await rollbackConfig({
          dataId: formData.dataId,
          groupName: formData.group,
          nid: nid.value,
          namespaceId: namespace.value !== 'public' ? namespace.value : undefined,
        })

        if (result.code === 0) {
          ElMessage.success(result.message || t('configRollback.rollbackSuccessful') || '回滚成功')
        } else {
          throw new Error(result.message || t('configRollback.rollbackFailed') || '回滚失败')
        }
        
        // 跳转回历史版本列表
        router.push({
          name: 'HistoryRollback',
          query: {
            historyDataId: formData.dataId,
            historyGroup: formData.group,
            namespace: namespace.value,
          },
        })
      } catch (error: any) {
        loading.value = false
        if (error !== 'cancel') {
          ElMessage.error(error.message || t('configRollback.rollbackFailed') || '回滚失败')
        }
      }
    }

    const handleBack = () => {
      router.push({
        name: 'HistoryRollback',
        query: {
          historyDataId: formData.dataId,
          historyGroup: formData.group,
          namespace: namespace.value,
        },
      })
    }

    // ✅ Composition API: 生命周期钩子
    onMounted(async () => {
      await fetchHistoryDetail()
    })

    // ✅ Composition API: 返回渲染函数
    return () => (
      <div class="p-6">
        <ElCard>
          <h1 class="text-xl font-bold mb-6">{t('configRollback.configurationRollback') || '配置回滚'}</h1>
          <ElForm label-width="120px">
            <ElFormItem label={t('config.namespace') || '命名空间'}>
              <ElInput modelValue={namespace.value} disabled />
            </ElFormItem>
            <ElFormItem label={t('config.dataId') || 'Data ID'} required>
              <ElInput modelValue={formData.dataId} readonly />
              <div class="mt-2">
                <a
                  class="text-sm text-blue-500 cursor-pointer"
                  onClick={() => (showMore.value = !showMore.value)}
                >
                  {showMore.value ? t('common.collapse') || '收起' : t('common.more') || '更多'}
                </a>
              </div>
            </ElFormItem>
            {showMore.value && (
              <>
                <ElFormItem label={t('config.group') || 'Group'} required>
                  <ElInput modelValue={formData.group} readonly />
                </ElFormItem>
                <ElFormItem label={t('config.appName') || '应用名'}>
                  <ElInput modelValue={formData.appName} readonly />
                </ElFormItem>
              </>
            )}
            <ElFormItem label={t('configRollback.actionType') || '操作类型'} required>
              <ElInput modelValue={getOpTypeLabel(formData.opType)} readonly />
            </ElFormItem>
            <ElFormItem label="MD5" required>
              <ElInput modelValue={formData.md5} readonly />
            </ElFormItem>
            <ElFormItem label={t('config.configurationFormat') || '配置内容'} required>
              <div style="width: 100%; height: 400px">
                <MonacoEditor
                  ref={monacoEditorRef}
                  modelValue={formData.content}
                  language={formData.type}
                  readOnly={true}
                />
              </div>
            </ElFormItem>
            <ElFormItem>
              <div class="flex justify-end gap-2">
                <ElButton type="primary" onClick={handleRollback} loading={loading.value}>
                  {t('configRollback.rollback') || '回滚'}
                </ElButton>
                <ElButton onClick={handleBack}>
                  {t('common.back') || '返回'}
                </ElButton>
              </div>
            </ElFormItem>
          </ElForm>
        </ElCard>
      </div>
    )
  },
})
