/**
 * 页面标题组件
 * 使用 Vue 3 JSX + Composition API
 */

import { defineComponent, computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import Copy from '../Copy/index'

interface PageTitleProps {
  title: string
  namespaceId?: string
  namespaceName?: string
  desc?: string
  nameSpace?: boolean
}

export default defineComponent<PageTitleProps>({
  name: 'PageTitle',
  props: {
    title: {
      type: String,
      required: true,
    },
    namespaceId: String,
    namespaceName: String,
    desc: String,
    nameSpace: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    // ✅ Composition API: 使用 composable
    const { t } = useI18n()

    // ✅ Composition API: 使用 computed 派生状态
    const showNamespace = computed(() => 
      props.namespaceId && props.namespaceId !== 'undefined'
    )
    const namespaceText = computed(() => 
      props.desc || props.namespaceName || ''
    )

    // ✅ Composition API: 返回渲染函数
    return () => (
      <div class="page-title flex items-center mt-2 mb-2">
        <span class="text-3xl h-10 font-medium">{props.title}</span>
        {showNamespace.value && (
          <span class="flex items-center ml-4">
            <span class="mr-4">{t('mainLayout.namespace')}</span>
            <Copy
              value={props.namespaceId!}
              textNode={namespaceText.value}
              title={t('config.copyNamespaceID')}
              className="h-8 flex items-center bg-gray-100 px-2 rounded"
            />
          </span>
        )}
      </div>
    )
  },
})
