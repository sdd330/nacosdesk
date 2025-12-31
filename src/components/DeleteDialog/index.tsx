/**
 * 删除确认对话框组件
 * 使用 Vue 3 JSX + Composition API
 */

import { defineComponent, ref, computed } from 'vue'
import { ElDialog, ElRow, ElCol, ElIcon, ElButton } from 'element-plus'
import { SuccessFilled, DeleteFilled } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'

interface DeleteDialogPayload {
  title?: string
  content?: string
  isok?: boolean
  dataId?: string
  group?: string
  message?: string
}

export default defineComponent({
  name: 'DeleteDialog',
  setup(_, { expose }) {
    // ✅ Composition API: 使用 composable
    const { t } = useI18n()
    
    // ✅ Composition API: 使用 ref 定义响应式状态
    const visible = ref(false)
    const title = ref('')
    const content = ref('')
    const isOk = ref(true)
    const dataId = ref('')
    const group = ref('')
    const message = ref('')

    // ✅ Composition API: 使用 computed 派生状态
    const dialogTitle = computed(() => title.value || t('delete.title'))
    const statusText = computed(() => 
      isOk.value ? t('delete.success') : t('delete.failed')
    )
    const iconColor = computed(() => isOk.value ? '#67c23a' : '#f56c6c')
    const showMessage = computed(() => !isOk.value && message.value)

    // ✅ Composition API: 方法定义
    const openDialog = (payload: DeleteDialogPayload) => {
      visible.value = true
      title.value = payload.title || t('delete.title')
      content.value = payload.content || ''
      isOk.value = payload.isok ?? true
      dataId.value = payload.dataId || ''
      group.value = payload.group || ''
      message.value = payload.message || ''
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
        <div class="delete-dialog-content py-4">
          <ElRow gutter={20}>
            <ElCol span={4} class="flex items-center justify-center">
              <ElIcon size={32} color={iconColor.value}>
                {isOk.value ? <SuccessFilled /> : <DeleteFilled />}
              </ElIcon>
            </ElCol>
            <ElCol span={20}>
              <div>
                <h3 class="text-lg font-semibold mb-2">
                  {statusText.value}
                </h3>
                {dataId.value && (
                  <p class="mb-1">
                    <span class="text-gray-500 mr-2">Data ID:</span>
                    <span class="text-red-600 font-mono">{dataId.value}</span>
                  </p>
                )}
                {group.value && (
                  <p class="mb-1">
                    <span class="text-gray-500 mr-2">Group:</span>
                    <span class="text-red-600 font-mono">{group.value}</span>
                  </p>
                )}
                {showMessage.value && (
                  <p class="text-red-600 mt-2">{message.value}</p>
                )}
              </div>
            </ElCol>
          </ElRow>
        </div>
      </ElDialog>
    )
  },
})
