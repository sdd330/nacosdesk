/**
 * NewNameSpace 组件
 * 新建命名空间对话框
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/components/NewNameSpace/NewNameSpace.js
 */

import { defineComponent, ref, reactive } from 'vue'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElMessage,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import { useNamespaceStore } from '@/stores/namespace'
import type { Namespace } from '@/api/namespace'

export default defineComponent({
  name: 'NewNameSpace',
  props: {
    onSuccess: {
      type: Function,
      default: () => {},
    },
  },
  setup(props, { expose }) {
    const { t } = useI18n()
    const namespaceStore = useNamespaceStore()

    const dialogVisible = ref(false)
    const loading = ref(false)
    const disabled = ref(false)
    const formData = reactive({
      customNamespaceId: '',
      namespaceShowName: '',
      namespaceDesc: '',
    })
    const errors = reactive<Record<string, string>>({})

    // 验证特殊字符
    const validateChart = (value: string): boolean => {
      const chartReg = /[@#\$%\^&\*]+/g
      return !chartReg.test(value)
    }

    // 验证命名空间ID
    const validateNamespaceId = (value: string): string => {
      if (!value || value.trim() === '') {
        return ''
      }
      if (value.length > 128) {
        return t('namespace.namespaceIdTooLong')
      }
      const chartReg = /^[\w-]+/g
      const matchResult = value.match(chartReg)
      if (matchResult) {
        if (matchResult.length > 1) {
          return t('namespace.input')
        }
        if (value.length !== matchResult[0].length) {
          return t('namespace.input')
        }
        return ''
      }
      return t('namespace.input')
    }

    // 验证表单
    const validate = (): boolean => {
      errors.customNamespaceId = ''
      errors.namespaceShowName = ''
      errors.namespaceDesc = ''

      // 验证命名空间ID（可选）
      if (formData.customNamespaceId) {
        const idError = validateNamespaceId(formData.customNamespaceId)
        if (idError) {
          errors.customNamespaceId = idError
          return false
        }
      }

      // 验证命名空间名称
      if (!formData.namespaceShowName) {
        errors.namespaceShowName = t('namespace.namespacenotnull')
        return false
      }
      if (!validateChart(formData.namespaceShowName)) {
        errors.namespaceShowName = t('namespace.input')
        return false
      }

      // 验证描述
      if (!formData.namespaceDesc) {
        errors.namespaceDesc = t('namespace.namespacedescnotnull')
        return false
      }
      if (!validateChart(formData.namespaceDesc)) {
        errors.namespaceDesc = t('namespace.input')
        return false
      }

      return true
    }

    // 确认创建
    const handleConfirm = async () => {
      if (!validate()) return

      disabled.value = true
      loading.value = true

      try {
        // 先检查命名空间ID是否存在
        if (formData.customNamespaceId) {
          const exists = await namespaceStore.checkExist(formData.customNamespaceId)
          if (exists) {
            ElMessage.error(t('namespace.namespaceIdAlreadyExist'))
            disabled.value = false
            loading.value = false
            return
          }
        }

        // 创建命名空间
        await namespaceStore.addNamespace({
          customNamespaceId: formData.customNamespaceId || undefined,
          namespaceName: formData.namespaceShowName,
          namespaceDesc: formData.namespaceDesc,
        })

        hide()
        props.onSuccess()
      } catch (error: any) {
        // 错误已在 store 中处理
      } finally {
        disabled.value = false
        loading.value = false
      }
    }

    // 显示对话框
    const show = (dataSource: Namespace[] = []) => {
      dialogVisible.value = true
      disabled.value = false
      resetForm()
    }

    // 隐藏对话框
    const hide = () => {
      dialogVisible.value = false
      resetForm()
    }

    // 重置表单
    const resetForm = () => {
      formData.customNamespaceId = ''
      formData.namespaceShowName = ''
      formData.namespaceDesc = ''
      errors.customNamespaceId = ''
      errors.namespaceShowName = ''
      errors.namespaceDesc = ''
    }

    // 暴露方法供父组件调用
    expose({
      show,
      hide,
    })

    return () => (
      <ElDialog
        v-model={dialogVisible.value}
        title={t('namespace.newnamespce')}
        width="50%"
        onClose={hide}
        v-slots={{
          footer: () => (
            <div class="flex justify-end gap-2">
              <ElButton onClick={hide}>{t('namespace.cancel')}</ElButton>
              <ElButton type="primary" loading={loading.value} disabled={disabled.value} onClick={handleConfirm}>
                {t('namespace.ok')}
              </ElButton>
            </div>
          ),
        }}
      >
        <ElForm label-width="120px">
          <ElFormItem label={t('namespace.namespaceId')} error={errors.customNamespaceId}>
            <ElInput
              modelValue={formData.customNamespaceId}
              placeholder={t('namespace.namespaceId')}
              onUpdate:modelValue={(val: string) => {
                formData.customNamespaceId = val
                errors.customNamespaceId = ''
              }}
            />
          </ElFormItem>
          <ElFormItem label={t('namespace.name')} required error={errors.namespaceShowName}>
            <ElInput
              modelValue={formData.namespaceShowName}
              placeholder={t('namespace.namespaceName')}
              onUpdate:modelValue={(val: string) => {
                formData.namespaceShowName = val
                errors.namespaceShowName = ''
              }}
            />
          </ElFormItem>
          <ElFormItem label={t('namespace.description')} required error={errors.namespaceDesc}>
            <ElInput
              type="textarea"
              modelValue={formData.namespaceDesc}
              placeholder={t('namespace.namespaceDesc')}
              autosize={{ minRows: 3, maxRows: 6 }}
              onUpdate:modelValue={(val: string) => {
                formData.namespaceDesc = val
                errors.namespaceDesc = ''
              }}
            />
          </ElFormItem>
        </ElForm>

        
      </ElDialog>
    )
  },
})

