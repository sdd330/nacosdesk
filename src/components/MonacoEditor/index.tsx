/**
 * Monaco Editor 组件
 * 使用 Vue 3 JSX + Composition API
 */

import { defineComponent, ref, onMounted, onUnmounted, watch, computed } from 'vue'
import loader from '@monaco-editor/loader'
import type { editor } from 'monaco-editor'

export interface MonacoEditorProps {
  value?: string
  language?: string
  width?: string | number
  height?: string | number
  options?: editor.IStandaloneEditorConstructionOptions
  readOnly?: boolean
}

export default defineComponent<MonacoEditorProps>({
  name: 'MonacoEditor',
  props: {
    value: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'text',
    },
    width: {
      type: [String, Number],
      default: '100%',
    },
    height: {
      type: [String, Number],
      default: 400,
    },
    options: Object,
    readOnly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['change', 'update:value'],
  setup(props, { emit, expose }) {
    // ✅ Composition API: 使用 ref 定义响应式状态
    const editorRef = ref<HTMLDivElement>()
    let editorInstance: editor.IStandaloneCodeEditor | null = null
    let monaco: typeof import('monaco-editor') | null = null

    // ✅ Composition API: 使用 computed 派生状态
    const editorWidth = computed(() => 
      typeof props.width === 'number' ? `${props.width}px` : props.width
    )
    const editorHeight = computed(() => 
      typeof props.height === 'number' ? `${props.height}px` : props.height
    )

    // ✅ Composition API: 方法定义
    const getMonacoOptions = (): editor.IStandaloneEditorConstructionOptions => ({
      codeLens: true,
      selectOnLineNumbers: true,
      roundedSelection: false,
      readOnly: props.readOnly,
      lineNumbersMinChars: 3,
      theme: 'vs-dark',
      wordWrapColumn: 120,
      folding: true,
      showFoldingControls: 'always',
      wordWrap: 'wordWrapColumn',
      cursorStyle: 'line',
      automaticLayout: true,
      minimap: {
        enabled: true,
      },
    })

    const initEditor = async () => {
      if (!editorRef.value) return

      try {
        const monacoInstance = await loader.init()
        monaco = monacoInstance
        
        if (!monaco) return
        
        editorInstance = monaco.editor.create(editorRef.value, {
          ...getMonacoOptions(),
          ...props.options,
          language: props.language,
          value: props.value,
        })

        editorInstance.onDidChangeModelContent(() => {
          const value = editorInstance?.getValue() || ''
          emit('change', value)
          emit('update:value', value)
        })
      } catch (error) {
        console.error('Failed to initialize Monaco Editor:', error)
      }
    }

    const updateValue = (value: string) => {
      if (editorInstance && editorInstance.getValue() !== value) {
        editorInstance.setValue(value)
      }
    }

    const updateLanguage = (language: string) => {
      if (editorInstance && monaco) {
        const model = editorInstance.getModel()
        if (model && monaco.editor) {
          monaco.editor.setModelLanguage(model, language)
        }
      }
    }

    // ✅ Composition API: 使用 watch 响应式更新
    watch(() => props.value, (newVal) => {
      if (newVal !== undefined) updateValue(newVal)
    })
    watch(() => props.language, (newLang) => {
      if (newLang) updateLanguage(newLang)
    })
    watch([() => props.width, () => props.height], () => {
      editorInstance?.layout()
    })

    // ✅ Composition API: 生命周期钩子
    onMounted(() => {
      initEditor()
    })

    onUnmounted(() => {
      editorInstance?.dispose()
      editorInstance = null
    })

    // ✅ Composition API: 使用 expose 暴露方法
    expose({
      getValue: () => editorInstance?.getValue() || '',
      setValue: (value: string) => editorInstance?.setValue(value),
      focus: () => editorInstance?.focus(),
      editor: editorInstance,
    })

    // ✅ Composition API: 返回渲染函数
    return () => (
      <div
        ref={editorRef}
        class="monaco-editor border border-gray-300 rounded"
        style={{
          width: editorWidth.value,
          height: editorHeight.value,
        }}
      />
    )
  },
})
