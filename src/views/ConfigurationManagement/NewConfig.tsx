/**
 * NewConfig 页面
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/ConfigurationManagement/NewConfig/NewConfig.js
 */

import { defineComponent, ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
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
} from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'
import MonacoEditor from '@/components/MonacoEditor/index'
import SuccessDialog from '@/components/SuccessDialog/index'
import { getParams, setParams } from '@/utils/urlParams'
import { validate } from '@/utils/validateContent'
import { getConfigDetail, publishConfig } from '@/api/configuration'
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
  name: 'NewConfig',
  setup() {
    // ✅ Composition API: 使用 composables
    const router = useRouter()
    const { t } = useI18n()

    // ✅ Composition API: 使用 ref 定义响应式状态
    const formRef = ref<FormInstance>()
    const monacoEditorRef = ref<InstanceType<typeof MonacoEditor>>()
    const successDialogRef = ref<InstanceType<typeof SuccessDialog>>()
    const loading = ref(false)
    const showMore = ref(false)
    const editorClass = ref('editor-normal')

    // 表单数据
    const formData = reactive({
      dataId: '',
      group: 'DEFAULT_GROUP',
      appName: '',
      tags: [] as string[],
      desc: '',
      configType: 'text',
    })

    // 命名空间
    const namespace = ref(getParams('namespace') || 'public')
    const searchDataId = ref(getParams('searchDataId') || '')
    const searchGroup = ref(getParams('searchGroup') || '')

    // 表单验证规则
    const rules = reactive<FormRules>({
      dataId: [
        { required: true, message: t('newConfig.dataIdRequired'), trigger: 'blur' },
        {
          validator: (_rule, value, callback) => {
            const chartReg = /[@#\$%\^&\*\s]+/g
            if (chartReg.test(value)) {
              callback(new Error(t('newConfig.dataIdInvalid')))
            } else {
              callback()
            }
          },
          trigger: 'blur',
        },
      ],
      group: [
        { required: true, message: t('newConfig.groupRequired'), trigger: 'blur' },
        { max: 127, message: t('newConfig.groupMaxLength'), trigger: 'blur' },
        {
          validator: (_rule, value, callback) => {
            const chartReg = /[@#\$%\^&\*\s]+/g
            if (chartReg.test(value)) {
              callback(new Error(t('newConfig.doNotEnter')))
            } else {
              callback()
            }
          },
          trigger: 'blur',
        },
      ],
    })

    // ✅ Composition API: 使用 computed 派生状态
    const configTypeOptions = computed(() => CONFIG_TYPES)

    // ✅ Composition API: 方法定义
    const handleConfigTypeChange = (type: string) => {
      formData.configType = type
      // Monaco Editor 语言会自动更新（通过 watch）
    }

    const handlePublish = async () => {
      if (!formRef.value) return

      await formRef.value.validate(async (valid) => {
        if (!valid) return

        const content = (monacoEditorRef.value as any)?.getValue() || ''
        if (!content.trim()) {
          ElMessage.error(t('newConfig.dataRequired'))
          return
        }

        // 验证配置内容格式
        const isValid = validate({ content, type: formData.configType as any })
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

        // 检查配置是否存在
        try {
          await getConfigDetail({
            dataId: formData.dataId,
            group: formData.group,
            namespaceId: namespace.value,
          })
          // 如果存在，提示错误
          ElMessage.error(t('newConfig.dataIdExists'))
          return
        } catch (err: any) {
          // 404 或其他错误表示不存在，可以继续发布
          if (err?.response?.status === 403) {
            ElMessageBox.alert(t('newConfig.publishFailed403'), t('common.confirm'))
            return
          }
        }

        // 发布配置
        loading.value = true
        try {
          await publishConfig({
            dataId: formData.dataId,
            group: formData.group,
            content,
            type: formData.configType,
            namespaceId: namespace.value,
            appName: formData.appName || undefined,
            tags: formData.tags.join(',') || undefined,
            desc: formData.desc || undefined,
          })

          // 设置 URL 参数
          setParams({
            group: formData.group,
            dataId: formData.dataId,
          })

          // 显示成功对话框
          ;(successDialogRef.value as any)?.openDialog({
            title: t('newConfig.newListingMain'),
            content: t('newConfig.newListing'),
            dataId: formData.dataId,
            group: formData.group,
          })

          // 延迟跳转
          setTimeout(() => {
            router.push({
              name: 'ConfigurationManagement',
              query: {
                namespace: namespace.value,
                group: searchGroup.value,
                dataId: searchDataId.value,
              },
            })
          }, 1000)
        } catch (err: any) {
          ElMessage.error(err.message || t('newConfig.publishFailed'))
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

    // 初始化表单数据
    onMounted(() => {
      const dataId = getParams('dataId') || ''
      const group = getParams('group') || 'DEFAULT_GROUP'
      formData.dataId = dataId
      formData.group = group
    })

    // ✅ Composition API: 返回渲染函数
    return () => (
      <div class="new-config-page p-6">
        <ElCard>
          <h1 class="text-2xl font-bold mb-6">{t('newConfig.title')}</h1>
          <ElForm
            ref={formRef}
            model={formData}
            rules={rules}
            label-width="120px"
            v-loading={loading.value}
          >
            <ElFormItem label={t('newConfig.namespace')}>
              <p class="text-gray-600">{namespace.value || 'public'}</p>
            </ElFormItem>

            <ElFormItem label={t('newConfig.dataId')} prop="dataId">
              <ElInput
                v-model={formData.dataId}
                maxlength={255}
                placeholder={t('newConfig.dataIdRequired')}
              />
            </ElFormItem>

            <ElFormItem label={t('newConfig.group')} prop="group">
              <ElSelect
                v-model={formData.group}
                filterable
                allow-create
                placeholder={t('newConfig.groupPlaceholder')}
                style="width: 100%"
              >
                <ElOption label="DEFAULT_GROUP" value="DEFAULT_GROUP" />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label=" ">
              <div>
                <a
                  class="text-blue-600 text-sm cursor-pointer"
                  onClick={toggleMore}
                >
                  {showMore.value ? t('newConfig.collapse') : t('newConfig.dataIdLength')}
                </a>
              </div>
            </ElFormItem>

            <ElCollapseTransition>
              {showMore.value && (
                <>
                  <ElFormItem label={t('config.configTags')}>
                    <ElSelect
                      v-model={formData.tags}
                      multiple
                      filterable
                      allow-create
                      placeholder={t('newConfig.pleaseEnterTag')}
                      style="width: 100%"
                      max-collapse-tags={5}
                    />
                  </ElFormItem>

                  <ElFormItem label={t('config.appName')}>
                    <ElInput v-model={formData.appName} />
                  </ElFormItem>
                </>
              )}
            </ElCollapseTransition>

            <ElFormItem label={t('newConfig.description')}>
              <ElInput
                v-model={formData.desc}
                type="textarea"
                rows={3}
                placeholder={t('newConfig.description')}
              />
            </ElFormItem>

            <ElFormItem label={t('newConfig.targetEnvironment')}>
              <ElRadioGroup
                modelValue={formData.configType}
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
              <div class={editorClass.value} style="min-height: 450px">
                <MonacoEditor
                  ref={monacoEditorRef}
                  language={formData.configType}
                  height="450px"
                />
              </div>
            </ElFormItem>

            <ElFormItem label=" ">
              <div class="flex justify-end gap-4">
                <ElButton onClick={handleCancel}>{t('newConfig.cancel')}</ElButton>
                <ElButton type="primary" onClick={handlePublish}>
                  {t('newConfig.publish')}
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
