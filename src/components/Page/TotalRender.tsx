/**
 * 分页总数渲染组件
 * 使用 Vue 3 JSX + Composition API
 */

import { defineComponent, computed } from 'vue'

export interface TotalRenderProps {
  total: number
  currentPage?: number
  pageSize?: number
}

export default defineComponent<TotalRenderProps>({
  name: 'TotalRender',
  props: {
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    currentPage: {
      type: Number,
      default: 1,
    },
    pageSize: {
      type: Number,
      default: 10,
    },
  },
  setup(props) {
    // ✅ Composition API: 使用 computed 格式化总数显示
    const formattedTotal = computed(() => {
      const { total, currentPage = 1, pageSize = 10 } = props
      const start = (currentPage - 1) * pageSize + 1
      const end = Math.min(currentPage * pageSize, total)
      
      if (total === 0) {
        return '0'
      }
      
      return `${start}-${end} / ${total}`
    })

    return () => (
      <span class="total-render text-gray-600 text-sm">
        {formattedTotal.value}
      </span>
    )
  },
})

