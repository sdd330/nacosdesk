/**
 * NewAgent 页面
 * 新建/编辑 Agent
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/AI/NewAgent/NewAgent.js
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
  ElIcon,
} from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'
import MonacoEditor from '@/components/MonacoEditor/index'
import { urlParams } from '@/utils/urlParams'
import { useAiStore } from '@/stores/ai'
import type { FormInstance, FormRules } from 'element-plus'

const defaultConfig = `{
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 2000
}`

export default defineComponent({
  name: 'NewAgent',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()
    const aiStore = useAiStore()

    const formRef = ref<FormInstance>()
    const monacoEditorRef = ref<InstanceType<typeof MonacoEditor>>()
    const loading = ref(false)
    const isEdit = computed(() => route.query.mode === 'edit' && route.query.name)
    const currentNamespace = ref(urlParams.getParams('namespace') || 'public')

    // 表单数据
    const formData = reactive({
      name: '',
      description: '',
      config: defaultConfig,
    })

    // 表单验证规则
    const rules = reactive<FormRules>({
      name: [
        { required: true, message: t('agentManagement.agentNameRequired') || 'Agent 名称不能为空', trigger: 'blur' },
        {
          validator: (_rule, value, callback) => {
            const chartReg = /^[a-zA-Z0-9_/\-\.]+$/
            if (!chartReg.test(value)) {
              callback(new Error(t('agentManagement.agentNameInvalid') || '只能包含字母、数字、下划线、斜杠、连字符和点'))
            } else {
              callback()
            }
          },
          trigger: 'blur',
        },
      ],
      description: [
        { max: 256, message: t('agentManagement.descriptionMaxLength') || '描述不能超过 256 个字符', trigger: 'blur' },
      ],
      config: [
        { required: true, message: t('agentManagement.configRequired') || '配置不能为空', trigger: 'blur' },
        {
          validator: (_rule, value, callback) => {
            if (!value || value.trim() === '') {
              callback(new Error(t('agentManagement.configRequired') || '配置不能为空'))
              return
            }
            try {
              JSON.parse(value)
              callback()
            } catch (error) {
              callback(new Error(t('agentManagement.configInvalid') || '配置必须是有效的 JSON 格式'))
            }
          },
          trigger: 'blur',
        },
      ],
    })

    // 初始化编辑数据
    const initEditedData = async () => {
      if (!isEdit.value) return

      const agentName = route.query.name as string
      const namespaceId = currentNamespace.value

      try {
        const agentDetail = await aiStore.fetchAgentDetail(agentName, namespaceId)
        if (!agentDetail) return

        formData.name = agentDetail.name || ''
        formData.description = agentDetail.description || ''
        formData.config = agentDetail.config
          ? JSON.stringify(agentDetail.config, null, 2)
          : defaultConfig
      } catch (error: any) {
        ElMessage.error(error.message || '获取 Agent 详情失败')
      }
    }

    // 提交表单
    const handleSubmit = async () => {
      if (!formRef.value) return

      await formRef.value.validate(async (valid) => {
        if (!valid) {
          ElMessage.warning(t('agentManagement.formValidationFailed') || '表单验证失败')
          return
        }

        loading.value = true
        try {
          let config: any = {}
          try {
            config = JSON.parse(formData.config)
          } catch (error) {
            ElMessage.error(t('agentManagement.configInvalid') || '配置必须是有效的 JSON 格式')
            loading.value = false
            return
          }

          const agentData = {
            name: formData.name,
            description: formData.description || undefined,
            config,
          }

          if (isEdit.value) {
            const agentName = route.query.name as string
            await aiStore.updateAgentInfo(agentName, agentData, currentNamespace.value)
            ElMessage.success(t('agentManagement.updateSuccess') || '更新成功')
          } else {
            await aiStore.addAgent(agentData)
            ElMessage.success(t('agentManagement.createSuccess') || '创建成功')
          }

          router.back()
        } catch (error: any) {
          ElMessage.error(error.message || (isEdit.value ? '更新失败' : '创建失败'))
        } finally {
          loading.value = false
        }
      })
    }

    // 返回列表
    const handleBack = () => {
      router.back()
    }

    onMounted(async () => {
      if (!currentNamespace.value) {
        router.push({ name: 'AgentManagement' })
        return
      }

      await initEditedData()
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
          <h2 class="text-xl font-bold">
            {isEdit.value
              ? t('agentManagement.editAgent') || '编辑 Agent'
              : t('agentManagement.newAgent') || '新建 Agent'}
          </h2>
        </div>

        <ElCard>
          <ElForm
            ref={formRef}
            model={formData}
            rules={rules}
            labelWidth="120px"
          >
            {/* 基本信息 */}
            <ElFormItem
              label={t('agentManagement.agentName') || 'Agent 名称'}
              prop="name"
              required
            >
              <ElInput
                v-model={formData.name}
                placeholder={t('agentManagement.agentNamePlaceholder') || '请输入 Agent 名称'}
                disabled={isEdit.value}
                maxLength={128}
              />
            </ElFormItem>

            <ElFormItem
              label={t('agentManagement.description') || '描述'}
              prop="description"
            >
              <ElInput
                v-model={formData.description}
                type="textarea"
                rows={3}
                placeholder={t('agentManagement.descriptionPlaceholder') || '请输入描述'}
                maxLength={256}
              />
            </ElFormItem>

            {/* 配置信息 */}
            <ElFormItem
              label={t('agentManagement.config') || '配置'}
              prop="config"
              required
            >
              <MonacoEditor
                ref={monacoEditorRef}
                modelValue={formData.config}
                onUpdate:modelValue={(val: string) => (formData.config = val)}
                language="json"
                height="400px"
              />
              <div class="text-sm text-gray-500 mt-2">
                {t('agentManagement.configHelp') || '请输入有效的 JSON 配置，例如：{"model": "gpt-4", "temperature": 0.7}'}
              </div>
            </ElFormItem>

            {/* 操作按钮 */}
            <ElFormItem>
              <div class="flex gap-4">
                <ElButton
                  type="primary"
                  loading={loading.value}
                  onClick={handleSubmit}
                >
                  {t('common.save') || '保存'}
                </ElButton>
                <ElButton onClick={handleBack}>
                  {t('common.cancel') || '取消'}
                </ElButton>
              </div>
            </ElFormItem>
          </ElForm>
        </ElCard>
      </div>
    )
  },
})
