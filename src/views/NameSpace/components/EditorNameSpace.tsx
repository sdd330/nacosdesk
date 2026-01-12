/**
 * EditorNameSpace 组件
 * 编辑命名空间对话框
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/components/EditorNameSpace/EditorNameSpace.js
 */

import { defineComponent, ref, reactive } from 'vue'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import { useNamespaceStore } from '@/stores/namespace'
import type { Namespace } from '@/api/namespace'

export default defineComponent({
  name: 'EditorNameSpace',
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
    const namespaceType = ref<number>(1) // 0: 公共空间, 1: 自定义空间
    const formData = reactive({
      namespace: '',
      namespaceShowName: '',
      namespaceDesc: '',
    })
    const errors = reactive<Record<string, string>>({})

    // 验证特殊字符
    const validateChart = (value: string): boolean => {
      const chartReg = /[@#\$%\^&\*]+/g
      return !chartReg.test(value)
    }

    // 验证表单
    const validate = (): boolean => {
      errors.namespaceShowName = ''
      errors.namespaceDesc = ''

      // 验证命名空间名称
      if (!formData.namespaceShowName) {
        errors.namespaceShowName = t('namespace.namespacenotnull')
        return false
      }
      if (!validateChart(formData.namespaceShowName)) {
        errors.namespaceShowName = t('namespace.pleaseDo')
        return false
      }

      // 验证描述
      if (!formData.namespaceDesc) {
        errors.namespaceDesc = t('namespace.namespacedescnotnull')
        return false
      }
      if (!validateChart(formData.namespaceDesc)) {
        errors.namespaceDesc = t('namespace.pleaseDo')
        return false
      }

      return true
    }

    // 确认更新
    const handleConfirm = async () => {
      if (!validate()) return

      loading.value = true
      try {
        await namespaceStore.updateNamespaceInfo({
          namespaceId: formData.namespace,
          namespaceName: formData.namespaceShowName,
          namespaceDesc: formData.namespaceDesc,
        })

        hide()
        props.onSuccess()
      } catch (error: any) {
        // 错误已在 store 中处理
      } finally {
        loading.value = false
      }
    }

    // 显示对话框
    const show = async (record: Namespace) => {
      dialogVisible.value = true
      namespaceType.value = record.type || 1

      // 获取命名空间详情
      loading.value = true
      try {
        const detail = await namespaceStore.fetchNamespaceDetail(record.namespace)
        if (detail) {
          formData.namespace = detail.namespace
          formData.namespaceShowName = detail.namespaceShowName
          formData.namespaceDesc = detail.namespaceDesc || ''
        } else {
          // 如果获取详情失败，使用传入的记录数据
          formData.namespace = record.namespace
          formData.namespaceShowName = record.namespaceShowName
          formData.namespaceDesc = record.namespaceDesc || ''
        }
      } catch (error: any) {
        // 如果获取详情失败，使用传入的记录数据
        formData.namespace = record.namespace
        formData.namespaceShowName = record.namespaceShowName
        formData.namespaceDesc = record.namespaceDesc || ''
      } finally {
        loading.value = false
      }
    }

    // 隐藏对话框
    const hide = () => {
      dialogVisible.value = false
      resetForm()
    }

    // 重置表单
    const resetForm = () => {
      formData.namespace = ''
      formData.namespaceShowName = ''
      formData.namespaceDesc = ''
      errors.namespaceShowName = ''
      errors.namespaceDesc = ''
    }

    // 暴露方法供父组件调用
    expose({
      show,
      hide,
    })

    return () => {
      const isPublic = namespaceType.value === 0

      return (
      <ElDialog
        v-model={dialogVisible.value}
        title={t('namespace.confirmModify')}
        width="50%"
        onClose={hide}
        v-slots={{
          footer: () => (
            isPublic.value ? (
              <div />
            ) : (
              <div class="flex justify-end gap-2">
                <ElButton onClick={hide}>{t('namespace.cancel')}</ElButton>
                <ElButton type="primary" loading={loading.value} onClick={handleConfirm}>
                  {t('namespace.publicSpace')}
                </ElButton>
              </div>
            )
          ),
        }}
      >
        <ElForm label-width="120px">
          <ElFormItem label={t('namespace.load')} required error={errors.namespaceShowName}>
            <ElInput
              modelValue={formData.namespaceShowName}
              placeholder={t('namespace.namespaceName')}
              disabled={isPublic}
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
              disabled={isPublic}
              onUpdate:modelValue={(val: string) => {
                formData.namespaceDesc = val
                errors.namespaceDesc = ''
              }}
            />
          </ElFormItem>
        </ElForm>
      </ElDialog>
      )
    }
  },
})

