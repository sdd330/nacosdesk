/**
 * 命名空间列表组件
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/components/NameSpaceList/NameSpaceList.js
 */

import { defineComponent, ref, onMounted, watch } from 'vue'
import { ElSelect, ElOption } from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import { getNamespaceList, type Namespace } from '@/api/namespace'
import { getParams, setParams } from '@/utils/urlParams'

export interface NameSpaceListProps {
  setNowNameSpace?: (name: string, id: string, desc?: string) => void
  namespaceCallBack?: (needClean?: boolean) => void
  title?: string
}

export default defineComponent<NameSpaceListProps>({
  name: 'NameSpaceList',
  props: {
    setNowNameSpace: Function,
    namespaceCallBack: Function,
    title: String,
  },
  setup(props) {
    // ✅ Composition API: 使用 composable
    const { t } = useI18n()

    // ✅ Composition API: 使用 ref 定义响应式状态
    const namespaceList = ref<Namespace[]>([])
    const currentNamespace = ref<string>(getParams('namespace') || '')
    const loading = ref(false)

    // ✅ Composition API: 方法定义
    const fetchNamespaces = async () => {
      loading.value = true
      try {
        const res = await getNamespaceList()
        if (res.code === 0) {
          namespaceList.value = res.data || []
          
          // 设置全局变量（兼容原项目）
          ;(window as any).namespaceList = res.data || []
          
          // 处理当前命名空间
          handleNamespaces(res.data || [])
        } else {
          console.error('Failed to get namespace list:', res.message)
          namespaceList.value = []
        }
      } catch (err) {
        console.error('Failed to get namespace list:', err)
        namespaceList.value = []
        ;(window as any).namespaceList = []
      } finally {
        loading.value = false
      }
    }

    const handleNamespaces = (data: Namespace[]) => {
      const nownamespace = getParams('namespace') || ''
      currentNamespace.value = nownamespace
      
      // 设置全局变量
      ;(window as any).nownamespace = nownamespace
      
      // 查找当前命名空间的显示名称和描述
      let namespaceShowName = ''
      let namespaceDesc = ''
      for (let i = 0; i < data.length; i++) {
        if (data[i].namespace === nownamespace) {
          namespaceShowName = data[i].namespaceShowName || ''
          namespaceDesc = data[i].namespaceDesc || ''
          break
        }
      }
      
      // 如果没有找到，使用第一个命名空间
      if (!namespaceShowName && data.length > 0) {
        const first = data[0]
        namespaceShowName = first.namespaceShowName || ''
        namespaceDesc = first.namespaceDesc || ''
        currentNamespace.value = first.namespace || ''
        ;(window as any).nownamespace = first.namespace || ''
      }
      
      ;(window as any).namespaceShowName = namespaceShowName
      ;(window as any).namespaceDesc = namespaceDesc
      
      // 调用回调
      if (props.setNowNameSpace) {
        props.setNowNameSpace(namespaceShowName, currentNamespace.value, namespaceDesc)
      }
    }

    const changeNameSpace = (ns: string) => {
      const namespace = namespaceList.value.find((n) => n.namespace === ns)
      if (!namespace) return

      const nsName = namespace.namespaceShowName || ''
      const nsDesc = namespace.namespaceDesc || ''

      // 保存到 localStorage
      localStorage.setItem('namespace', ns)

      // 更新状态
      currentNamespace.value = ns || ''
      ;(window as any).nownamespace = ns
      ;(window as any).namespaceShowName = nsName
      ;(window as any).namespaceDesc = nsDesc

      // 更新 URL 参数
      setParams({
        namespace: ns || '',
        namespaceShowName: nsName,
      })

      // 调用回调
      if (props.namespaceCallBack) {
        props.namespaceCallBack(true)
      }
      if (props.setNowNameSpace) {
        props.setNowNameSpace(nsName, ns, nsDesc)
      }
    }

    // ✅ Composition API: 生命周期钩子
    onMounted(() => {
      // 如果全局已有命名空间列表，直接使用
      if ((window as any).namespaceList && (window as any).namespaceList.length) {
        namespaceList.value = (window as any).namespaceList
        handleNamespaces((window as any).namespaceList)
      } else {
        fetchNamespaces()
      }
    })

    // ✅ Composition API: 返回渲染函数
    return () => (
      <div class="namespace-list">
        {props.title && <span class="mr-2">{props.title}</span>}
        <ElSelect
          modelValue={currentNamespace.value}
          onUpdate:modelValue={(val: string | number | boolean | undefined) => {
            if (typeof val === 'string') {
              changeNameSpace(val)
            }
          }}
          loading={loading.value}
          placeholder={t('namespace.selectNamespace')}
          style="width: 200px"
        >
          {namespaceList.value.map((ns) => (
            <ElOption
              key={ns.namespace}
              label={ns.namespaceShowName || ns.namespace || t('namespace.public')}
              value={ns.namespace || ''}
            >
              <div>
                <div class="font-semibold">{ns.namespaceShowName || ns.namespace || t('namespace.public')}</div>
                {ns.namespaceDesc && (
                  <div class="text-xs text-gray-500">{ns.namespaceDesc}</div>
                )}
              </div>
            </ElOption>
          ))}
        </ElSelect>
      </div>
    )
  },
})

