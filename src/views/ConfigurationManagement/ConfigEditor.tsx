/**
 * ConfigEditor 页面
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/ConfigurationManagement/ConfigEditor/ConfigEditor.js
 */

import { defineComponent, ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElRadioGroup,
  ElRadio,
  ElButton,
  ElMessage,
  ElMessageBox,
  ElCollapseTransition,
  ElTooltip,
  ElIcon,
  ElSwitch,
} from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'
import MonacoEditor from '@/components/MonacoEditor/index'
import SuccessDialog from '@/components/SuccessDialog/index'
import DiffEditorDialog from '@/components/DiffEditorDialog/index'
import { getParams, setParams } from '@/utils/urlParams'
import { validate } from '@/utils/validateContent'
import { getConfigDetail, updateConfig } from '@/api/configuration'
import type { FormInstance, FormRules } from 'element-plus'

const CONFIG_TYPES = [
  { value: 'text', label: 'TEXT' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
  { value: 'html', label: 'HTML' },
  { value: 'properties', label: 'Properties' },
  { value: 'toml', label: 'TOML' },
]

export default defineComponent({
  name: 'ConfigEditor',
  setup() {
    // ✅ Composition API: 使用 composables
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()

    // ✅ Composition API: 使用 ref 定义响应式状态
    const formRef = ref<FormInstance>()
    const monacoEditorRef = ref<InstanceType<typeof MonacoEditor>>()
    const successDialogRef = ref<InstanceType<typeof SuccessDialog>>()
    const diffEditorDialogRef = ref<InstanceType<typeof DiffEditorDialog>>()
    const loading = ref(false)
    const showMore = ref(false)
    const showDiff = ref(false)
    const editorClass = ref('editor-normal')

    // 配置信息
    const configInfo = reactive({
      dataId: '',
      group: '',
      appName: '',
      tags: [] as string[],
      desc: '',
      configType: 'text',
      md5: '', // MD5 校验值
      originalContent: '', // 原始内容（用于对比）
    })

    // 命名空间
    const namespace = ref(getParams('namespace') || 'public')
    const searchDataId = ref(getParams('searchDataId') || '')
    const searchGroup = ref(getParams('searchGroup') || '')

    // 表单验证规则
    const rules = reactive<FormRules>({
      dataId: [
        { required: true, message: t('newConfig.dataIdRequired'), trigger: 'blur' },
      ],
      group: [
        { required: true, message: t('newConfig.groupRequired'), trigger: 'blur' },
      ],
    })

    // ✅ Composition API: 使用 computed 派生状态
    const configTypeOptions = computed(() => CONFIG_TYPES)

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
        configInfo.originalContent = res.content || ''

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

    const handleConfigTypeChange = (type: string) => {
      configInfo.configType = type
    }

    const handleUpdate = async () => {
      if (!formRef.value) return

      await formRef.value.validate(async (valid) => {
        if (!valid) return

        const content = (monacoEditorRef.value as any)?.getValue() || ''
        if (!content.trim()) {
          ElMessage.error(t('newConfig.dataRequired'))
          return
        }

        // 验证配置内容格式
        const isValid = validate({ content, type: configInfo.configType as any })
        if (!isValid) {
          try {
            await ElMessageBox.confirm(
              t('newConfig.confirmSyanx'),
              t('common.confirm'),
              {
                confirmButtonText: t('common.confirm'),
                cancelButtonText: t('common.cancel'),
                type: 'warning',
              }
            )
          } catch {
            return // 用户取消
          }
        }

        // 更新配置（需要传入 MD5 进行校验）
        loading.value = true
        try {
          await updateConfig({
            dataId: configInfo.dataId,
            group: configInfo.group,
            content,
            md5: configInfo.md5, // MD5 校验，防止并发修改
            type: configInfo.configType,
            namespaceId: namespace.value,
            appName: configInfo.appName || undefined,
            tags: configInfo.tags.join(',') || undefined,
            desc: configInfo.desc || undefined,
          })

          // 设置 URL 参数
          setParams({
            group: configInfo.group,
            dataId: configInfo.dataId,
          })

          // 显示成功对话框
          ;(successDialogRef.value as any)?.openDialog({
            title: t('config.editSuccess') || '编辑成功',
            content: t('config.editSuccess') || '配置已成功更新',
            dataId: configInfo.dataId,
            group: configInfo.group,
          })

          // 重新获取配置详情（更新 MD5）
          await fetchConfigDetail()
        } catch (err: any) {
          if (err?.response?.status === 409) {
            ElMessageBox.alert(
              '配置已被其他用户修改，请刷新页面后重试',
              '配置冲突',
              {
                confirmButtonText: t('common.confirm'),
                type: 'error',
              }
            ).then(() => {
              fetchConfigDetail()
            })
          } else {
            ElMessage.error(err.message || t('config.editFailed') || '更新配置失败')
          }
        } finally {
          loading.value = false
        }
      })
    }

    const handleCancel = () => {
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

    const toggleDiff = (checked: boolean) => {
      showDiff.value = checked
      if (checked && diffEditorDialogRef.value) {
        const currentContent = (monacoEditorRef.value as any)?.getValue() || ''
        const originalContent = configInfo.originalContent || ''
        ;(diffEditorDialogRef.value as any).openDialog(currentContent, originalContent)
      }
    }

    const handleVersionCompare = () => {
      if (diffEditorDialogRef.value) {
        const currentContent = (monacoEditorRef.value as any)?.getValue() || ''
        const originalContent = configInfo.originalContent || ''
        ;(diffEditorDialogRef.value as any).openDialog(
          currentContent,
          originalContent
        )
      }
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
      <div class="config-editor-page p-6">
        <ElCard>
          <h1 class="text-2xl font-bold mb-6">{t('mainLayout.configeditor') || '配置编辑'}</h1>
          <ElForm
            ref={formRef}
            model={configInfo}
            rules={rules}
            label-width="120px"
            v-loading={loading.value}
          >
            <ElFormItem label={t('newConfig.namespace')}>
              <p class="text-gray-600">{namespace.value || 'public'}</p>
            </ElFormItem>

            <ElFormItem label={t('newConfig.dataId')} prop="dataId">
              <ElInput
                v-model={configInfo.dataId}
                readonly
                class="bg-gray-50"
              />
            </ElFormItem>

            <ElFormItem label={t('newConfig.group')} prop="group">
              <ElInput
                v-model={configInfo.group}
                readonly
                class="bg-gray-50"
              />
            </ElFormItem>

            <ElFormItem label=" ">
              <div class="flex items-center gap-4">
                <a
                  class="text-blue-600 text-sm cursor-pointer"
                  onClick={toggleMore}
                >
                  {showMore.value ? t('newConfig.collapse') : t('newConfig.dataIdLength')}
                </a>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">显示对比</span>
                  <ElSwitch
                    modelValue={showDiff.value}
                    onUpdate:modelValue={toggleDiff}
                  />
                </div>
              </div>
            </ElFormItem>

            <ElCollapseTransition>
              {showMore.value && (
                <>
                  <ElFormItem label={t('config.configTags')}>
                    <ElSelect
                      v-model={configInfo.tags}
                      multiple
                      filterable
                      allow-create
                      placeholder={t('newConfig.pleaseEnterTag')}
                      style="width: 100%"
                      max-collapse-tags={5}
                    />
                  </ElFormItem>

                  <ElFormItem label={t('config.appName')}>
                    <ElInput v-model={configInfo.appName} />
                  </ElFormItem>
                </>
              )}
            </ElCollapseTransition>

            <ElFormItem label={t('newConfig.description')}>
              <ElInput
                v-model={configInfo.desc}
                type="textarea"
                rows={3}
                placeholder={t('newConfig.description')}
              />
            </ElFormItem>

            <ElFormItem label={t('newConfig.targetEnvironment')}>
              <ElRadioGroup
                modelValue={configInfo.configType}
                onUpdate:modelValue={(val: string | number | boolean | undefined) => {
                  if (typeof val === 'string') {
                    handleConfigTypeChange(val)
                  }
                }}
              >
                {configTypeOptions.value.map((item) => (
                  <ElRadio key={item.value} label={item.value}>
                    {item.label}
                  </ElRadio>
                ))}
              </ElRadioGroup>
            </ElFormItem>

            <ElFormItem
              label={t('newConfig.configurationFormat')}
              required
            >
              <div class="flex items-center">
                <span class="mr-2">{t('newConfig.configurationFormat')}</span>
                <ElTooltip
                  content={t('newConfig.configureContentsOf') + '\n' + t('newConfig.fullScreen')}
                  placement="top"
                >
                  <ElIcon class="cursor-pointer text-green-600">
                    <QuestionFilled />
                  </ElIcon>
                </ElTooltip>
              </div>
              <div class={editorClass.value} style="min-height: 450px; margin-top: 8px">
                <MonacoEditor
                  ref={monacoEditorRef}
                  language={configInfo.configType}
                  height="450px"
                />
              </div>
            </ElFormItem>

            {showDiff.value && (
              <ElFormItem label="配置对比">
                <ElButton
                  type="primary"
                  onClick={handleVersionCompare}
                >
                  {t('config.versionComparison') || '版本对比'}
                </ElButton>
              </ElFormItem>
            )}

            <ElFormItem label=" ">
              <div class="flex justify-end gap-4">
                <ElButton onClick={handleCancel}>{t('newConfig.cancel')}</ElButton>
                <ElButton type="primary" onClick={handleUpdate}>
                  {t('common.submit') || '提交'}
                </ElButton>
              </div>
            </ElFormItem>
          </ElForm>
        </ElCard>

        <SuccessDialog ref={successDialogRef} />
        <DiffEditorDialog
          ref={diffEditorDialogRef}
          title={t('config.versionComparison') || '版本对比'}
          currentArea={t('config.currentVersion') || '当前版本'}
          originalArea={t('config.originalVersion') || '原始版本'}
        />
      </div>
    )
  },
})
