/**
 * HistoryDetail 页面
 * 历史详情展示
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/ConfigurationManagement/HistoryDetail/HistoryDetail.js
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
  ElTag,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import MonacoEditor from '@/components/MonacoEditor/index'
import { getHistoryDetail } from '@/api/configuration'

export default defineComponent({
  name: 'HistoryDetail',
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
      srcUser: '',
      srcIp: '',
      type: 'text',
    })

    const publishType = ref<'formal' | 'gray'>('formal')
    const grayRule = ref('')

    // ✅ Composition API: 方法定义
    const fetchHistoryDetail = async () => {
      if (!dataId.value || !group.value || !nid.value) {
        ElMessage.error(t('historyDetail.missingParams') || '缺少必要参数')
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
        formData.srcUser = response.srcUser || ''
        formData.srcIp = response.srcIp || ''
        formData.type = response.type || 'text'

        publishType.value = response.publishType || 'formal'

        if (response.extInfo) {
          try {
            const extInfo = JSON.parse(response.extInfo)
            if (extInfo.appName) {
              formData.appName = extInfo.appName
            }
            if (extInfo.type) {
              formData.type = extInfo.type
            }
            if (publishType.value === 'gray' && extInfo.gray_rule) {
              try {
                const grayRuleObj = JSON.parse(extInfo.gray_rule)
                grayRule.value = grayRuleObj.expr || ''
              } catch (e) {
                grayRule.value = ''
              }
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      } catch (error: any) {
        ElMessage.error(error.message || t('historyDetail.getHistoryFailed') || '获取历史详情失败')
      } finally {
        loading.value = false
      }
    }

    const getOpTypeLabel = (opType: string): string => {
      const typeMap: Record<string, string> = {
        U: t('historyDetail.update') || '更新',
        I: t('historyDetail.insert') || '插入',
        D: t('historyDetail.delete') || '删除',
      }
      return typeMap[opType] || opType
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
          <h1 class="text-xl font-bold mb-6">{t('historyDetail.title') || '历史详情'}</h1>
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
            <ElFormItem label={t('historyRollback.publishType') || '发布类型'}>
              <div>
                {publishType.value === 'formal' ? (
                  <ElTag>{t('historyRollback.formal') || '正式'}</ElTag>
                ) : (
                  <ElTag type="info">{t('historyRollback.gray') || '灰度'}</ElTag>
                )}
              </div>
            </ElFormItem>
            {publishType.value === 'gray' && grayRule.value && (
              <ElFormItem label={t('historyDetail.grayRule') || '灰度规则'}>
                <ElInput modelValue={grayRule.value} readonly />
              </ElFormItem>
            )}
            <ElFormItem label={t('historyRollback.operator') || '操作人'} required>
              <ElInput modelValue={formData.srcUser} readonly />
            </ElFormItem>
            <ElFormItem label={t('historyDetail.sourceIp') || '来源 IP'} required>
              <ElInput modelValue={formData.srcIp} readonly />
            </ElFormItem>
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
                  value={formData.content}
                  language={formData.type}
                  readOnly={true}
                />
              </div>
            </ElFormItem>
            <ElFormItem>
              <div class="flex justify-end">
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
