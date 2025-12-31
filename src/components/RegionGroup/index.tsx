/**
 * RegionGroup 组件
 * 地域分组选择器和服务器切换
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/components/RegionGroup/RegionGroup.js
 */

import { defineComponent, ref, onMounted, watch, computed } from 'vue'
import { ElButton, ElButtonGroup } from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import { getParams, setParams } from '@/utils/urlParams'
import NameSpaceList, { type NameSpaceListProps } from '@/components/NameSpaceList/index'
import PageTitle from '@/components/PageTitle/index'

export interface RegionGroupProps {
  url?: string
  left?: string | any
  right?: any
  namespaceCallBack?: (needClean?: boolean) => void
  setNowNameSpace?: (name: string, id: string, desc?: string) => void
}

export interface RegionServer {
  serverId: string
  name: string
  domain?: string
  active?: boolean
}

export default defineComponent<RegionGroupProps>({
  name: 'RegionGroup',
  props: {
    url: {
      type: String,
      default: '/diamond-ops/env/domain',
    },
    left: [String, Object],
    right: [String, Object, Function],
    namespaceCallBack: Function,
    setNowNameSpace: Function,
  },
  setup(props) {
    const { t } = useI18n()

    // 状态管理
    const instanceData = ref<RegionServer[]>([])
    const currRegionId = ref<string>(getParams('serverId') || '')
    const hideRegionList = ref(false)
    const regionWidth = ref(700)
    const nameSpaceListRef = ref<InstanceType<typeof NameSpaceList> | null>(null)

    // 计算属性
    const showRegionList = computed(() => !hideRegionList.value && instanceData.value.length > 0)

    // 获取地域列表
    const getRegionList = async () => {
      // 如果已有缓存，直接使用
      if ((window as any)._regionList) {
        handleRegionList((window as any)._regionList)
        return
      }

      // 如果没有 URL 或不需要从服务器获取，使用默认数据
      // 注意：原项目中的地域列表通常由后端提供，这里简化处理
      // 如果需要从服务器获取，可以调用 API
      try {
        // TODO: 如果需要从服务器获取地域列表，可以在这里调用 API
        // const res = await httpClient.get(props.url)
        // if (res && res.data) {
        //   (window as any)._regionList = res.data
        //   handleRegionList(res.data)
        // }
        
        // 默认情况下，如果没有配置地域列表，则不显示地域选择器
        // 这符合大多数 Nacos 单机部署的场景
        hideRegionList.value = true
      } catch (error) {
        console.error('Failed to get region list:', error)
        hideRegionList.value = true
      }
    }

    // 处理地域列表数据
    const handleRegionList = (data: any) => {
      let envcontent = ''
      const { envGroups } = data || {}
      let instanceDataList: RegionServer[] = []

      if (envGroups && envGroups.length > 0) {
        for (let i = 0; i < envGroups.length; i++) {
          const obj = envGroups[i].envs || []
          instanceDataList = obj
          for (let j = 0; j < obj.length; j++) {
            if (obj[j].active) {
              envcontent = obj[j].serverId
            }
          }
        }
      }

      const defaultRegionId = envcontent || (instanceDataList[0] && instanceDataList[0].serverId) || ''
      
      if (defaultRegionId && !currRegionId.value) {
        currRegionId.value = defaultRegionId
        setParams('serverId', defaultRegionId)
      }

      instanceData.value = instanceDataList
      
      // 如果有命名空间列表，刷新命名空间
      if (nameSpaceListRef.value) {
        // 调用 NameSpaceList 的方法刷新命名空间列表
        const nameSpaceListInstance = nameSpaceListRef.value as any
        if (nameSpaceListInstance?.getNameSpaces) {
          nameSpaceListInstance.getNameSpaces()
        }
      }
    }

    // 切换服务器
    const changeTableData = (serverId: string) => {
      if (currRegionId.value === serverId) {
        return
      }

      setParams('serverId', serverId)
      currRegionId.value = serverId

      const server = instanceData.value.find(item => item.serverId === serverId)
      if (server && server.domain) {
        // 如果服务器有域名，跳转到该域名
        const lastHash = window.location.hash.split('?')[0]
        const url = `${window.location.protocol}//${server.domain}${window.location.search}${lastHash}`
        window.location.href = url
      } else {
        // 否则，触发命名空间刷新回调
        if (props.namespaceCallBack) {
          props.namespaceCallBack(true)
        }
      }
    }

    // 初始化
    onMounted(() => {
      getRegionList()
      
      // 如果有命名空间回调，初始化命名空间列表
      if (props.namespaceCallBack && nameSpaceListRef.value) {
        const nameSpaceListInstance = nameSpaceListRef.value as any
        if (nameSpaceListInstance?.getNameSpaces) {
          nameSpaceListInstance.getNameSpaces()
        }
      }
    })

    // 监听 URL 参数变化
    watch(() => getParams('serverId'), (newServerId) => {
      if (newServerId && newServerId !== currRegionId.value) {
        currRegionId.value = newServerId
      }
    })

    return () => (
      <div class="region-group-container" style={{ marginTop: props.left ? 0 : '-30px' }}>
        <div class="flex items-center justify-between">
          {/* 左侧：标题和地域选择器 */}
          <div class="flex items-center gap-4">
            {/* 标题 */}
            <div class="flex items-center">
              {typeof props.left === 'string' ? (
                <PageTitle title={props.left} />
              ) : (
                props.left
              )}
            </div>

            {/* 地域选择器 */}
            {showRegionList.value && (
              <div class="flex items-center gap-2">
                <ElButtonGroup>
                  {instanceData.value.map((server) => (
                    <ElButton
                      key={server.serverId}
                      type={currRegionId.value === server.serverId ? 'primary' : 'default'}
                      size="small"
                      onClick={() => changeTableData(server.serverId)}
                    >
                      {server.name}
                    </ElButton>
                  ))}
                </ElButtonGroup>
              </div>
            )}
          </div>

          {/* 右侧：额外内容 */}
          <div class="flex items-center">
            {typeof props.right === 'function' ? props.right() : props.right}
          </div>
        </div>

        {/* 命名空间列表 */}
        {props.namespaceCallBack && (
          <div class="mt-4">
            <NameSpaceList
              ref={nameSpaceListRef}
              namespaceCallBack={props.namespaceCallBack}
              setNowNameSpace={props.setNowNameSpace}
            />
          </div>
        )}
      </div>
    )
  },
})

