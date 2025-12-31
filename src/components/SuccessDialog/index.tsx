/**
 * 成功提示对话框组件
 * 使用 Vue 3 JSX + Composition API
 */

import { defineComponent, ref, computed } from 'vue'
import { ElDialog, ElRow, ElCol, ElIcon, ElButton } from 'element-plus'
import { SuccessFilled } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'

interface SuccessDialogPayload {
  title?: string
  content?: string
  dataId?: string
  group?: string
}

export default defineComponent({
  name: 'SuccessDialog',
  setup(_, { expose }) {
    // ✅ Composition API: 使用 composable
    const { t } = useI18n()
    
    // ✅ Composition API: 使用 ref 定义响应式状态
    const visible = ref(false)
    const title = ref('')
    const content = ref('')
    const dataId = ref('')
    const group = ref('')

    // ✅ Composition API: 使用 computed 派生状态
    const dialogTitle = computed(() => title.value || t('success.title'))
    const hasDataId = computed(() => !!dataId.value)
    const hasGroup = computed(() => !!group.value)

    // ✅ Composition API: 方法定义
    const openDialog = (payload: SuccessDialogPayload) => {
      visible.value = true
      title.value = payload.title || t('success.title')
      content.value = payload.content || ''
      dataId.value = payload.dataId || ''
      group.value = payload.group || ''
    }

    const closeDialog = () => {
      visible.value = false
    }

    // ✅ Composition API: 使用 expose 暴露方法
    expose({
      openDialog,
      closeDialog,
    })

    // ✅ Composition API: 返回渲染函数
    return () => (
      <ElDialog
        modelValue={visible.value}
        onUpdate:modelValue={(val: boolean) => (visible.value = val)}
        title={dialogTitle.value}
        width="555px"
        onClose={closeDialog}
        v-slots={{
          footer: () => (
            <ElButton type="primary" onClick={closeDialog}>
              {t('common.confirm')}
            </ElButton>
          ),
        }}
      >
        <div class="success-dialog-content py-4">
          <ElRow gutter={20}>
            <ElCol span={4} class="flex items-center justify-center">
              <ElIcon size={32} color="#67c23a">
                <SuccessFilled />
              </ElIcon>
            </ElCol>
            <ElCol span={20}>
              <div>
                <h3 class="text-lg font-semibold mb-2">{t('success.title')}</h3>
                {content.value && <p class="mb-1">{content.value}</p>}
                {hasDataId.value && (
                  <p class="mb-1">
                    <span class="text-gray-500 mr-2">Data ID:</span>
                    <span class="text-blue-600 font-mono">{dataId.value}</span>
                  </p>
                )}
                {hasGroup.value && (
                  <p class="mb-1">
                    <span class="text-gray-500 mr-2">Group:</span>
                    <span class="text-blue-600 font-mono">{group.value}</span>
                  </p>
                )}
              </div>
            </ElCol>
          </ElRow>
        </div>
      </ElDialog>
    )
  },
})
