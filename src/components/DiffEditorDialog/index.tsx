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
  language?: string // Monaco Editor 语言模式（如 json, yaml, xml, properties 等）
  onPublish?: (content: string) => void
}

/**
 * 根据配置内容自动检测语言类型
 */
function detectLanguage(content: string, type?: string): string {
  // 如果指定了类型，优先使用
  if (type) {
    const typeMap: Record<string, string> = {
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
      properties: 'properties',
      toml: 'toml',
      text: 'text',
      txt: 'text',
    }
    return typeMap[type.toLowerCase()] || 'text'
  }

  // 尝试根据内容检测
  const trimmed = content.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(content)
      return 'json'
    } catch {
      // 不是有效的 JSON
    }
  }
  if (trimmed.startsWith('<')) {
    return 'xml'
  }
  if (content.includes('=') && !content.includes('{')) {
    return 'properties'
  }

  return 'text'
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
    language: {
      type: String,
      default: '',
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
    const diffStats = ref({ added: 0, removed: 0, modified: 0 })
    let diffEditorInstance: editor.IStandaloneDiffEditor | null = null
    let monaco: typeof import('monaco-editor') | null = null
    let leftCode = ''
    let rightCode = ''
    let currentLanguage = 'text'

    // ✅ Composition API: 方法定义
    const initDiffEditor = async () => {
      if (!editorRef.value) return

      try {
        const monacoInstance = await loader.init()
        monaco = monacoInstance

        if (!monaco) return

        // 检测主题（跟随系统主题）
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const theme = isDark ? 'vs-dark' : 'vs'

        diffEditorInstance = monaco.editor.createDiffEditor(editorRef.value, {
          readOnly: true,
          automaticLayout: true,
          theme,
          renderSideBySide: true,
          enableSplitViewResizing: true,
          renderOverviewRuler: true,
          minimap: {
            enabled: true,
          },
          ignoreTrimWhitespace: false, // 显示空白字符差异
          renderIndicators: true, // 显示差异指示器
        })

        // 设置模型（使用检测到的语言）
        const originalModel = monaco.editor.createModel(rightCode || '', currentLanguage)
        const modifiedModel = monaco.editor.createModel(leftCode || '', currentLanguage)
        diffEditorInstance.setModel({
          original: originalModel,
          modified: modifiedModel,
        })

        // 计算差异统计（延迟执行，确保模型已设置）
        nextTick(() => {
          setTimeout(() => {
            updateDiffStats()
          }, 200)
        })
      } catch (error) {
        console.error('Failed to initialize Monaco Diff Editor:', error)
      }
    }

    /**
     * 计算差异统计信息
     */
    const updateDiffStats = () => {
      if (!diffEditorInstance || !monaco) return

      try {
        const originalModel = diffEditorInstance.getOriginalEditor().getModel()
        const modifiedModel = diffEditorInstance.getModifiedEditor().getModel()

        if (!originalModel || !modifiedModel) return

        // 简单的行差异统计（基于内容比较）
        const originalLines = originalModel.getLinesContent()
        const modifiedLines = modifiedModel.getLinesContent()

        let added = 0
        let removed = 0
        let modified = 0

        // 使用简单的行比较算法
        const maxLines = Math.max(originalLines.length, modifiedLines.length)
        for (let i = 0; i < maxLines; i++) {
          const origLine = originalLines[i]
          const modLine = modifiedLines[i]

          if (origLine === undefined) {
            added++
          } else if (modLine === undefined) {
            removed++
          } else if (origLine !== modLine) {
            modified++
          }
        }

        diffStats.value = { added, removed, modified }
      } catch (error) {
        console.error('Failed to calculate diff stats:', error)
        // 如果计算失败，使用简单的行数差异
        const originalLines = (rightCode || '').split('\n').length
        const modifiedLines = (leftCode || '').split('\n').length
        diffStats.value = {
          added: Math.max(0, modifiedLines - originalLines),
          removed: Math.max(0, originalLines - modifiedLines),
          modified: 0,
        }
      }
    }

    const updateDiffContent = (left: string, right: string, language?: string) => {
      leftCode = left || ''
      rightCode = right || ''

      // 检测语言
      if (language) {
        currentLanguage = language
      } else {
        currentLanguage = detectLanguage(leftCode || rightCode)
      }

      if (diffEditorInstance && monaco) {
        const originalModel = monaco.editor.createModel(rightCode, currentLanguage)
        const modifiedModel = monaco.editor.createModel(leftCode, currentLanguage)
        diffEditorInstance.setModel({
          original: originalModel,
          modified: modifiedModel,
        })
        updateDiffStats()
      }
    }

    const openDialog = (left: string, right: string, options?: { language?: string; title?: string; currentArea?: string; originalArea?: string }) => {
      visible.value = true
      
      // 更新 props（如果提供了选项）
      if (options) {
        if (options.title) {
          // 注意：这里无法直接更新 props，需要在调用时传递
        }
      }

      // 检测语言
      const language = options?.language || props.language || detectLanguage(left || right)
      updateDiffContent(left, right, language)

      // 等待 DOM 更新后初始化编辑器
      nextTick(() => {
        if (!diffEditorInstance) {
          initDiffEditor()
        } else {
          updateDiffContent(left, right, language)
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
          {/* 差异统计信息 */}
          {(diffStats.value.added > 0 || diffStats.value.removed > 0 || diffStats.value.modified > 0) && (
            <div class="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
              <span class="mr-4">
                <span class="text-green-600 dark:text-green-400">+{diffStats.value.added}</span>
                {' '}
                <span class="text-red-600 dark:text-red-400">-{diffStats.value.removed}</span>
                {' '}
                <span class="text-blue-600 dark:text-blue-400">~{diffStats.value.modified}</span>
              </span>
              {currentLanguage !== 'text' && (
                <span class="text-gray-500 dark:text-gray-400">
                  {t('diffEditor.language') || '语言'}: {currentLanguage}
                </span>
              )}
            </div>
          )}

          <ElRow class="mb-2">
            <ElCol span={12} class="text-center">
              <span class="font-semibold text-blue-600 dark:text-blue-400">{props.currentArea}</span>
            </ElCol>
            <ElCol span={12} class="text-center">
              <span class="font-semibold text-gray-600 dark:text-gray-400">{props.originalArea}</span>
            </ElCol>
          </ElRow>
          <div
            ref={editorRef}
            class="diff-editor-container border border-gray-300 dark:border-gray-600 rounded"
            style="height: 500px; min-height: 400px"
          />
        </div>
      </ElDialog>
    )
  },
})

