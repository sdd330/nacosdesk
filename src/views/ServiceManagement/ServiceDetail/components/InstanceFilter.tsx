/**
 * InstanceFilter 组件
 * 实例筛选组件
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/ServiceManagement/ServiceDetail/InstanceFilter.js
 */

import { defineComponent, ref, watch } from 'vue'
import { ElCard, ElForm, ElFormItem, ElInput, ElButton, ElTag } from 'element-plus'
import { useI18n } from '@/composables/useI18n'

export default defineComponent({
  name: 'InstanceFilter',
  props: {
    setFilters: {
      type: Function,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n()

    const key = ref('')
    const value = ref('')
    const keyState = ref('')
    const valueState = ref('')
    const filters = ref<Map<string, string>>(new Map())

    // 添加筛选条件
    const addFilter = () => {
      updateInput()

      if (key.value && value.value) {
        const newFilters = new Map(Array.from(filters.value))
        newFilters.set(key.value, value.value)
        filters.value = newFilters
        key.value = ''
        value.value = ''
        keyState.value = ''
        valueState.value = ''
      }
    }

    // 移除筛选条件
    const removeFilter = (filterKey: string) => {
      const newFilters = new Map(Array.from(filters.value))
      newFilters.delete(filterKey)
      filters.value = newFilters
    }

    // 清空所有筛选条件
    const clearFilters = () => {
      filters.value = new Map()
    }

    // 更新输入状态
    const updateInput = () => {
      if (!key.value) {
        keyState.value = 'error'
      } else {
        keyState.value = ''
      }

      if (!value.value) {
        valueState.value = 'error'
      } else {
        valueState.value = ''
      }
    }

    // 监听 filters 变化，通知父组件
    watch(
      filters,
      (newFilters) => {
        props.setFilters(newFilters)
      },
      { deep: true }
    )

    return () => (
      <ElCard class="mb-4">
        <ElForm inline size="small">
          <ElFormItem label={t('service.instanceFilter.title')}>
            <ElFormItem>
              <ElInput
                modelValue={key.value}
                placeholder="key"
                onUpdate:modelValue={(val: string) => {
                  key.value = val.trim()
                }}
                onKeydown={(e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    addFilter()
                  }
                }}
                error={keyState.value === 'error'}
              />
            </ElFormItem>
            <ElFormItem>
              <ElInput
                modelValue={value.value}
                placeholder="value"
                onUpdate:modelValue={(val: string) => {
                  value.value = val.trim()
                }}
                onKeydown={(e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    addFilter()
                  }
                }}
                error={valueState.value === 'error'}
              />
            </ElFormItem>
            <ElFormItem>
              <ElButton type="primary" onClick={addFilter}>
                {t('service.instanceFilter.add')}
              </ElButton>
            </ElFormItem>
          </ElFormItem>
        </ElForm>

        {filters.value.size > 0 && (
          <div class="mt-2">
            <div class="flex flex-wrap gap-2">
              {Array.from(filters.value.entries()).map(([k, v]) => (
                <ElTag
                  key={k}
                  closable
                  onClose={() => removeFilter(k)}
                >
                  {k}={v}
                </ElTag>
              ))}
            </div>
            <ElButton
              type="text"
              size="small"
              class="mt-2"
              onClick={clearFilters}
            >
              {t('service.instanceFilter.clear')}
            </ElButton>
          </div>
        )}
      </ElCard>
    )
  },
})

