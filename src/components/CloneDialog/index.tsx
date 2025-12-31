/**
 * 克隆配置对话框组件
 * 使用 Vue 3 JSX + Composition API
 */

import { defineComponent, ref, computed } from 'vue'
import { ElDialog, ElForm, ElFormItem, ElSelect, ElOption, ElButton, ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useI18n } from '@/composables/useI18n'

interface CloneDialogPayload {
  title?: string
  sourceNamespace: { name: string; id: string }
  total: number
  query?: string
  dataId?: string
  group?: string
  appName?: string
  configTags?: string
}

export default defineComponent({
  name: 'CloneDialog',
  setup(_, { expose }) {
    // ✅ Composition API: 使用 composable
    const { t } = useI18n()
    
    // ✅ Composition API: 使用 ref 定义响应式状态
    const visible = ref(false)
    const title = ref('')
    const formRef = ref<FormInstance>()
    const sourceNamespace = ref<{ name: string; id: string }>({ name: '', id: '' })
    const total = ref(0)
    const query = ref('')
    const namespaceList = ref<Array<{ label: string; value: string }>>([])

    const form = ref({
      targetNamespace: '',
      policy: 'abort',
    })

    // ✅ Composition API: 使用 computed 派生状态
    const dialogTitle = computed(() => title.value || t('clone.title'))
    const canClone = computed(() => total.value > 0)
    const policyOptions = computed(() => [
      { value: 'abort', label: t('clone.terminate') },
      { value: 'skip', label: t('clone.skip') },
      { value: 'cover', label: t('clone.cover') },
    ])

    // ✅ Composition API: 表单验证规则
    const rules: FormRules = {
      targetNamespace: [
        { required: true, message: t('clone.selectNamespace'), trigger: 'change' },
      ],
    }

    // ✅ Composition API: 方法定义
    const openDialog = async (payload: CloneDialogPayload) => {
      visible.value = true
      title.value = payload.title || t('clone.title')
      sourceNamespace.value = payload.sourceNamespace
      total.value = payload.total
      query.value = payload.query || ''
      
      // TODO: 加载命名空间列表
      // namespaceList.value = await fetchNamespaces()
      
      form.value = {
        targetNamespace: '',
        policy: 'abort',
      }
    }

    const handleClose = () => {
      visible.value = false
    }

    const handleClone = async () => {
      if (!formRef.value) return
      
      await formRef.value.validate(async (valid) => {
        if (!valid) return
        
        try {
          // TODO: 实现克隆逻辑
          ElMessage.success(t('clone.success'))
          handleClose()
        } catch (error) {
          ElMessage.error(t('clone.failed'))
        }
      })
    }

    // ✅ Composition API: 使用 expose 暴露方法
    expose({
      openDialog,
      closeDialog: handleClose,
    })

    // ✅ Composition API: 返回渲染函数
    return () => (
      <ElDialog
        modelValue={visible.value}
        onUpdate:modelValue={(val: boolean) => (visible.value = val)}
        title={dialogTitle.value}
        width="555px"
        onClose={handleClose}
        v-slots={{
          footer: () => (
            <>
              <ElButton onClick={handleClose}>{t('common.cancel')}</ElButton>
              <ElButton
                type="primary"
                disabled={!canClone.value}
                onClick={handleClone}
              >
                {t('clone.startClone')}
              </ElButton>
            </>
          ),
        }}
      >
        <ElForm
          ref={formRef}
          model={form.value}
          rules={rules}
          label-width="120px"
        >
          <ElFormItem label={t('clone.source')}>
            <p>
              <span class="text-blue-500">{sourceNamespace.value.name}</span>
              <span class="text-gray-600"> | {sourceNamespace.value.id}</span>
            </p>
          </ElFormItem>
          
          <ElFormItem label={t('clone.configCount')}>
            <p>
              <span class="text-blue-500 font-semibold">{total.value}</span>
              {query.value && <span>{query.value}</span>}
            </p>
          </ElFormItem>
          
          <ElFormItem label={t('clone.target')} prop="targetNamespace">
            <ElSelect
              modelValue={form.value.targetNamespace}
              onUpdate:modelValue={(val: string) => (form.value.targetNamespace = val)}
              placeholder={t('clone.selectNamespace')}
              style="width: 80%"
              filterable
            >
              {namespaceList.value.map((ns) => (
                <ElOption key={ns.value} label={ns.label} value={ns.value} />
              ))}
            </ElSelect>
          </ElFormItem>
          
          <ElFormItem label={t('clone.conflict')}>
            <ElSelect
              modelValue={form.value.policy}
              onUpdate:modelValue={(val: string) => (form.value.policy = val)}
              style="width: 80%"
            >
              {policyOptions.value.map((policy) => (
                <ElOption key={policy.value} label={policy.label} value={policy.value} />
              ))}
            </ElSelect>
          </ElFormItem>
        </ElForm>
      </ElDialog>
    )
  },
})
