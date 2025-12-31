/**
 * 批量操作组件
 * 使用 Vue 3 JSX + Composition API
 */

import { defineComponent, ref, computed } from 'vue'
import { ElDialog, ElTransfer, ElPagination, ElButton } from 'element-plus'
import type { TransferKey, TransferDirection } from 'element-plus'
import { useI18n } from '@/composables/useI18n'

interface BatchHandlePayload {
  dataSource: Array<{ label: string; value: string }>
  valueList?: string[]
  total: number
  pageSize?: number
  onSubmit?: (values: string[]) => void
}

export default defineComponent({
  name: 'BatchHandle',
  setup(_, { expose }) {
    // ✅ Composition API: 使用 composable
    const { t } = useI18n()
    
    // ✅ Composition API: 使用 ref 定义响应式状态
    const visible = ref(false)
    const selectedValues = ref<string[]>([])
    const dataSource = ref<Array<{ label: string; value: string }>>([])
    const currentPage = ref(1)
    const total = ref(0)
    const pageSize = ref(10)

    let onSubmitCallback: ((values: string[]) => void) | null = null

    // ✅ Composition API: 使用 computed 派生状态
    const transferTitles = computed((): [string, string] => [
      t('batchHandle.source'),
      t('batchHandle.target'),
    ])
    const hasSelection = computed(() => selectedValues.value.length > 0)

    // ✅ Composition API: 方法定义
    const openDialog = async (payload: BatchHandlePayload) => {
      visible.value = true
      dataSource.value = payload.dataSource || []
      selectedValues.value = payload.valueList || []
      total.value = payload.total || 0
      pageSize.value = payload.pageSize || 10
      currentPage.value = 1
      onSubmitCallback = payload.onSubmit || null
    }

    const handleClose = () => {
      visible.value = false
      selectedValues.value = []
    }

    const handleChange = (
      _value: TransferKey[],
      _direction: TransferDirection,
      _movedKeys: TransferKey[]
    ) => {
      // Transfer 变化处理
    }

    const handlePageChange = (page: number) => {
      currentPage.value = page
      // TODO: 重新加载数据
    }

    const handleSubmit = () => {
      if (onSubmitCallback) {
        onSubmitCallback(selectedValues.value)
      }
      handleClose()
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
        title={t('batchHandle.title')}
        width="500px"
        onClose={handleClose}
        v-slots={{
          footer: () => (
            <>
              <ElButton onClick={handleClose}>{t('common.cancel')}</ElButton>
              <ElButton
                type="primary"
                disabled={!hasSelection.value}
                onClick={handleSubmit}
              >
                {t('common.confirm')}
              </ElButton>
            </>
          ),
        }}
      >
        <ElTransfer
          modelValue={selectedValues.value}
          onUpdate:modelValue={(val: TransferKey[]) => {
            selectedValues.value = val as string[]
          }}
          data={dataSource.value}
          titles={transferTitles.value}
          filterable
          onChange={handleChange}
        />
        
        <div class="mt-4">
          <ElPagination
            {...{
              'current-page': currentPage.value,
              'onUpdate:current-page': (val: number) => {
                currentPage.value = val
              },
              total: total.value,
              'page-size': pageSize.value,
              layout: 'prev, pager, next',
              onCurrentChange: handlePageChange,
            }}
          />
        </div>
      </ElDialog>
    )
  },
})
