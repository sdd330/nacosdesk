/**
 * DiffEditorDialog 组件
 * 代码对比对话框
 * 使用 Vue 3 JSX + Composition API + Monaco Editor Diff Editor
 * 参考 console-ui/src/components/DiffEditorDialog/DiffEditorDialog.js
 */

import { defineComponent, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElDialog, ElButton, ElRow, ElCol } from 'element-plus'
import loader from '@monaco-editor/loader'
import type { editor } from 'monaco-editor'
import { useI18n } from '@/composables/useI18n'

export interface DiffEditorDialogProps {
  title?: string
  currentArea?: string
  originalArea?: string
  onPublish?: (content: string) => void
}

export default defineComponent<DiffEditorDialogProps>({
  name: 'DiffEditorDialog',
  props: {
    title: {
      type: String,
      default: '代码对比',
    },
    currentArea: {
      type: String,
      default: '当前版本',
    },
    originalArea: {
      type: String,
      default: '原始版本',
    },
    onPublish: Function,
  },
  emits: ['publish'],
  setup(props, { expose }) {
    // ✅ Composition API: 使用 composable
    const { t } = useI18n()

    // ✅ Composition API: 使用 ref 定义响应式状态
    const visible = ref(false)
    const editorRef = ref<HTMLDivElement>()
    let diffEditorInstance: editor.IStandaloneDiffEditor | null = null
    let monaco: typeof import('monaco-editor') | null = null
    let leftCode = ''
    let rightCode = ''

    // ✅ Composition API: 方法定义
    const initDiffEditor = async () => {
      if (!editorRef.value) return

      try {
        const monacoInstance = await loader.init()
        monaco = monacoInstance

        if (!monaco) return

        diffEditorInstance = monaco.editor.createDiffEditor(editorRef.value, {
          readOnly: true,
          automaticLayout: true,
          theme: 'vs-dark',
          renderSideBySide: true,
          enableSplitViewResizing: true,
          renderOverviewRuler: true,
          minimap: {
            enabled: true,
          },
        })

        // 设置模型
        const originalModel = monaco.editor.createModel(rightCode || '', 'text/plain')
        const modifiedModel = monaco.editor.createModel(leftCode || '', 'text/plain')
        diffEditorInstance.setModel({
          original: originalModel,
          modified: modifiedModel,
        })
      } catch (error) {
        console.error('Failed to initialize Monaco Diff Editor:', error)
      }
    }

    const updateDiffContent = (left: string, right: string) => {
      leftCode = left || ''
      rightCode = right || ''

      if (diffEditorInstance && monaco) {
        const originalModel = monaco.editor.createModel(rightCode, 'text/plain')
        const modifiedModel = monaco.editor.createModel(leftCode, 'text/plain')
        diffEditorInstance.setModel({
          original: originalModel,
          modified: modifiedModel,
        })
      }
    }

    const openDialog = (left: string, right: string) => {
      visible.value = true
      updateDiffContent(left, right)

      // 等待 DOM 更新后初始化编辑器
      nextTick(() => {
        if (!diffEditorInstance) {
          initDiffEditor()
        } else {
          updateDiffContent(left, right)
        }
      })
    }

    const closeDialog = () => {
      visible.value = false
    }

    const handlePublish = () => {
      if (diffEditorInstance && props.onPublish) {
        const modifiedModel = diffEditorInstance.getModifiedEditor().getModel()
        const content = modifiedModel?.getValue() || ''
        props.onPublish(content)
      }
    }

    // ✅ Composition API: 使用 watch 响应式更新
    watch(visible, (newVal) => {
      if (newVal && !diffEditorInstance) {
        nextTick(() => {
          initDiffEditor()
        })
      }
      if (newVal && diffEditorInstance) {
        nextTick(() => {
          diffEditorInstance?.layout()
        })
      }
    })

    // ✅ Composition API: 生命周期钩子
    onUnmounted(() => {
      diffEditorInstance?.dispose()
      diffEditorInstance = null
    })

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
        title={props.title}
        width="90%"
        onClose={closeDialog}
        v-slots={{
          footer: () => (
            <div class="flex justify-end gap-4">
              {props.onPublish ? (
                <ElButton type="primary" onClick={handlePublish}>
                  {t('newConfig.publish') || '发布'}
                </ElButton>
              ) : (
                <ElButton type="primary" onClick={closeDialog}>
                  {t('config.back') || '返回'}
                </ElButton>
              )}
            </div>
          ),
        }}
      >
        <div class="diff-editor-dialog">
          <ElRow class="mb-2">
            <ElCol span={12} class="text-center">
              <span class="font-semibold text-blue-600">{props.currentArea}</span>
            </ElCol>
            <ElCol span={12} class="text-center">
              <span class="font-semibold text-gray-600">{props.originalArea}</span>
            </ElCol>
          </ElRow>
          <div
            ref={editorRef}
            class="diff-editor-container border border-gray-300 rounded"
            style="height: 500px; min-height: 400px"
          />
        </div>
      </ElDialog>
    )
  },
})

