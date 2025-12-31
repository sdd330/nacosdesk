/**
 * ConfigDetail 页面
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/ConfigurationManagement/ConfigDetail/ConfigDetail.js
 */

import { defineComponent, ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElMessage,
  ElTag,
  ElCollapseTransition,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import MonacoEditor from '@/components/MonacoEditor/index'
import DiffEditorDialog from '@/components/DiffEditorDialog/index'
import { getParams } from '@/utils/urlParams'
import { getConfigDetail } from '@/api/configuration'

export default defineComponent({
  name: 'ConfigDetail',
  setup() {
    // ✅ Composition API: 使用 composables
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()

    // ✅ Composition API: 使用 ref 定义响应式状态
    const monacoEditorRef = ref<InstanceType<typeof MonacoEditor>>()
    const diffEditorDialogRef = ref<InstanceType<typeof DiffEditorDialog>>()
    const versionDiffDialogRef = ref<InstanceType<typeof DiffEditorDialog>>()
    const loading = ref(false)
    const showMore = ref(false)
    const editorClass = ref('editor-normal')

    // 配置信息
    const configInfo = reactive({
      dataId: '',
      group: '',
      appName: '',
      tags: [] as string[],
      desc: '',
      configType: 'text',
      md5: '',
      content: '',
    })

    // 命名空间
    const namespace = ref(getParams('namespace') || 'public')
    const searchDataId = ref(getParams('searchDataId') || '')
    const searchGroup = ref(getParams('searchGroup') || '')

    // ✅ Composition API: 方法定义
    const fetchConfigDetail = async () => {
      const dataId = getParams('dataId') || route.query.dataId as string || ''
      const group = getParams('group') || route.query.group as string || 'DEFAULT_GROUP'

      if (!dataId) {
        ElMessage.error(t('config.dataId') + ' 不能为空')
        router.push({ name: 'ConfigurationManagement' })
        return
      }

      loading.value = true
      try {
        const res = await getConfigDetail({
          dataId,
          group,
          namespaceId: namespace.value,
        })

        // 更新配置信息
        configInfo.dataId = dataId
        configInfo.group = group
        configInfo.configType = res.type || 'text'
        configInfo.md5 = res.md5 || ''
        configInfo.content = res.content || ''

        // 解析 tags
        if (res.tags) {
          configInfo.tags = res.tags.split(',').filter(Boolean)
        }

        // 设置 Monaco Editor 内容
        if (monacoEditorRef.value) {
          ;(monacoEditorRef.value as any).setValue(res.content || '')
        }
      } catch (err: any) {
        ElMessage.error(err.message || '获取配置详情失败')
        router.push({ name: 'ConfigurationManagement' })
      } finally {
        loading.value = false
      }
    }

    const handleEdit = () => {
      router.push({
        name: 'ConfigEditor',
        query: {
          dataId: configInfo.dataId,
          group: configInfo.group,
          namespace: namespace.value,
        },
      })
    }

    const handleCompare = () => {
      ElMessage.info('配置对比功能开发中，将使用 ConfigCompared 组件实现')
      // TODO: 实现配置对比功能，需要选择另一个配置进行对比
    }

    const handleVersionCompare = () => {
      if (versionDiffDialogRef.value) {
        const currentContent = configInfo.content || ''
        // TODO: 获取历史版本内容
        const historyContent = configInfo.content || ''
        ;(versionDiffDialogRef.value as any).openDialog(currentContent, historyContent)
      }
    }

    const handleBack = () => {
      router.push({
        name: 'ConfigurationManagement',
        query: {
          namespace: namespace.value,
          group: searchGroup.value,
          dataId: searchDataId.value,
        },
      })
    }

    const toggleMore = () => {
      showMore.value = !showMore.value
    }

    // 全屏快捷键
    onMounted(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'F1') {
          e.preventDefault()
          editorClass.value = 'editor-full-screen'
        }
        if (e.key === 'Escape') {
          editorClass.value = 'editor-normal'
        }
      }
      document.body.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.removeEventListener('keydown', handleKeyDown)
      }
    })

    // 初始化
    onMounted(() => {
      fetchConfigDetail()
    })

    // ✅ Composition API: 返回渲染函数
    return () => (
      <div class="config-detail-page p-6">
        <ElCard>
          <h1 class="text-2xl font-bold mb-6">{t('mainLayout.configdetail') || '配置详情'}</h1>
          <ElForm
            label-width="120px"
            v-loading={loading.value}
          >
            <ElFormItem label={t('newConfig.namespace')}>
              <p class="text-gray-600">{namespace.value || 'public'}</p>
            </ElFormItem>

            <ElFormItem label={t('newConfig.dataId')}>
              <ElInput
                modelValue={configInfo.dataId}
                readonly
                class="bg-gray-50"
              />
            </ElFormItem>

            <ElFormItem label={t('newConfig.group')}>
              <ElInput
                modelValue={configInfo.group}
                readonly
                class="bg-gray-50"
              />
            </ElFormItem>

            <ElFormItem label=" ">
              <a
                class="text-blue-600 text-sm cursor-pointer"
                onClick={toggleMore}
              >
                {showMore.value ? t('newConfig.collapse') : t('newConfig.dataIdLength')}
              </a>
            </ElFormItem>

            <ElCollapseTransition>
              {showMore.value && (
                <>
                  <ElFormItem label={t('config.configTags')}>
                    <div class="flex flex-wrap gap-2">
                      {configInfo.tags.length > 0 ? (
                        configInfo.tags.map((tag) => (
                          <ElTag key={tag} type="info">{tag}</ElTag>
                        ))
                      ) : (
                        <span class="text-gray-400 text-sm">无标签</span>
                      )}
                    </div>
                  </ElFormItem>

                  <ElFormItem label={t('config.appName')}>
                    <ElInput
                      modelValue={configInfo.appName || ''}
                      readonly
                      class="bg-gray-50"
                    />
                  </ElFormItem>

                  <ElFormItem label={t('newConfig.description')}>
                    <ElInput
                      modelValue={configInfo.desc || ''}
                      type="textarea"
                      rows={2}
                      readonly
                      class="bg-gray-50"
                    />
                  </ElFormItem>

                  <ElFormItem label="MD5">
                    <ElInput
                      modelValue={configInfo.md5 || ''}
                      readonly
                      class="bg-gray-50 font-mono text-xs"
                    />
                  </ElFormItem>

                  <ElFormItem label={t('config.type')}>
                    <ElTag type="success">{configInfo.configType.toUpperCase()}</ElTag>
                  </ElFormItem>
                </>
              )}
            </ElCollapseTransition>

            <ElFormItem label={t('newConfig.configurationFormat')} required>
              <div class={editorClass.value} style="min-height: 500px">
                <MonacoEditor
                  ref={monacoEditorRef}
                  language={configInfo.configType}
                  height="500px"
                  readOnly={true}
                />
              </div>
            </ElFormItem>
          </ElForm>

          <div class="flex justify-end gap-4 mt-6">
            <ElButton type="primary" onClick={handleCompare}>
              {t('config.configComparison') || '配置对比'}
            </ElButton>
            <ElButton type="primary" onClick={handleVersionCompare}>
              {t('config.versionComparison') || '版本对比'}
            </ElButton>
            <ElButton onClick={handleEdit}>
              {t('common.edit')}
            </ElButton>
            <ElButton onClick={handleBack}>
              {t('config.back') || '返回'}
            </ElButton>
          </div>
        </ElCard>

        <DiffEditorDialog
          ref={versionDiffDialogRef}
          title={t('config.versionComparison') || '版本对比'}
          currentArea={t('config.currentVersion') || '当前版本'}
          originalArea={t('config.historyVersion') || '历史版本'}
        />
      </div>
    )
  },
})
