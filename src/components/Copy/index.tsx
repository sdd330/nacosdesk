/**
 * 复制组件
 * 使用 Vue 3 JSX + Composition API
 */

import { defineComponent } from 'vue'
import { ElIcon, ElMessage } from 'element-plus'
import { DocumentCopy } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'

interface CopyProps {
  value: string
  textNode?: string
  title?: string
  className?: string
  style?: Record<string, any>
}

export default defineComponent<CopyProps>({
  name: 'Copy',
  props: {
    value: {
      type: String,
      required: true,
    },
    textNode: String,
    title: String,
    className: String,
    style: Object,
  },
  setup(props) {
    // ✅ Composition API: 使用 composable
    const { t } = useI18n()

    // ✅ Composition API: 方法定义
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(props.value)
        ElMessage.success(t('copy.success'))
      } catch (error) {
        // 降级方案
        const textarea = document.createElement('textarea')
        textarea.value = props.value
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        ElMessage.success(t('copy.success'))
      }
    }

    // ✅ Composition API: 返回渲染函数
    return () => (
      <div
        class={`copy-component inline-flex items-center cursor-pointer hover:bg-gray-200 transition-colors ${props.className || ''}`}
        style={props.style}
        onClick={handleCopy}
        title={props.title}
      >
        <ElIcon class="mr-1">
          <DocumentCopy />
        </ElIcon>
        <span class="text-sm">{props.textNode || props.value}</span>
      </div>
    )
  },
})
