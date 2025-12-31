/**
 * 查询结果组件
 * 使用 Vue 3 JSX + Composition API
 */

import { defineComponent } from 'vue'
import { useI18n } from '@/composables/useI18n'

interface QueryResultProps {
  total: number
}

export default defineComponent<QueryResultProps>({
  name: 'QueryResult',
  props: {
    total: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    // ✅ Composition API: 使用 composable
    const { t } = useI18n()

    // ✅ Composition API: 返回渲染函数
    return () => (
      <div class="query-result text-sm text-gray-600 mb-4">
        {t('config.queryResults')}
        <strong class="font-bold text-gray-800 mx-1">{props.total}</strong>
        {t('config.articleMeetRequirements')}
      </div>
    )
  },
})
