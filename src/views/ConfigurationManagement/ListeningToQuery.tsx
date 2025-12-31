/**
 * ListeningToQuery 页面
 * 监听查询功能
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/ConfigurationManagement/ListeningToQuery/ListeningToQuery.js
 */

import { defineComponent, ref, reactive, onMounted, computed } from 'vue'
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElButton,
  ElTable,
  ElTableColumn,
  ElPagination,
  ElMessage,
  ElRadioGroup,
  ElRadio,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import PageTitle from '@/components/PageTitle/index'
import NameSpaceList from '@/components/NameSpaceList/index'
import QueryResult from '@/components/QueryResult/index'
import TotalRender from '@/components/Page/TotalRender'
import { getListenersByConfig, getListenersByIp, type ListenerItem } from '@/api/configuration'
import { urlParams } from '@/utils/urlParams'

export default defineComponent({
  name: 'ListeningToQuery',
  setup() {
    // ✅ Composition API: 使用 composables
    const { t } = useI18n()

    // ✅ Composition API: 使用 ref 定义响应式状态
    const loading = ref(false)
    const allListeners = ref<ListenerItem[]>([]) // 存储所有数据
    const listenerList = ref<ListenerItem[]>([]) // 当前页数据
    const totalCount = ref(0)
    const pageNumber = ref(1)
    const pageSize = ref(10)

    const currentNamespace = ref(urlParams.getParams('namespace') || 'public')
    const currentNamespaceName = ref('public')
    const currentNamespaceDesc = ref('')

    const queryType = ref(0) // 0: 按配置查询, 1: 按 IP 查询
    const searchForm = reactive({
      dataId: urlParams.getParams('listeningDataId') || '',
      group: urlParams.getParams('listeningGroup') || '',
      ip: '',
    })

    // ✅ Composition API: 方法定义
    const handleNamespaceChange = (namespace: { id: string; name: string; desc?: string }) => {
      currentNamespace.value = namespace.id
      currentNamespaceName.value = namespace.name
      currentNamespaceDesc.value = namespace.desc || ''
    }

    const fetchListeners = async () => {
      if (queryType.value === 1) {
        // 按 IP 查询
        if (!searchForm.ip) {
          ElMessage.warning(t('listeningToQuery.ipRequired') || '请输入 IP 地址')
          return
        }
        await fetchListenersByIp()
      } else {
        // 按配置查询
        if (!searchForm.dataId || !searchForm.group) {
          ElMessage.warning(t('listeningToQuery.configRequired') || '请输入 Data ID 和 Group')
          return
        }
        await fetchListenersByConfig()
      }
    }

    const fetchListenersByConfig = async () => {
      loading.value = true
      try {
        const response = await getListenersByConfig({
          dataId: searchForm.dataId,
          groupName: searchForm.group,
        })

        const listeners: ListenerItem[] = []
        if (response.listenersStatus) {
          Object.keys(response.listenersStatus).forEach((key) => {
            listeners.push({
              ip: key,
              md5: response.listenersStatus[key],
            })
          })
        }

        allListeners.value = listeners
        totalCount.value = listeners.length
        pageNumber.value = 1
        updatePageData()
      } catch (error: any) {
        ElMessage.error(error.message || t('listeningToQuery.queryFailed') || '查询失败')
        allListeners.value = []
        listenerList.value = []
        totalCount.value = 0
      } finally {
        loading.value = false
      }
    }

    const fetchListenersByIp = async () => {
      loading.value = true
      try {
        const response = await getListenersByIp({
          ip: searchForm.ip,
          namespaceId: currentNamespace.value || undefined,
        })

        const listeners: ListenerItem[] = []
        if (response.listenersStatus) {
          Object.keys(response.listenersStatus).forEach((key) => {
            const [dataId, group] = key.split('+')
            listeners.push({
              dataId,
              group,
              md5: response.listenersStatus[key],
            })
          })
        }

        allListeners.value = listeners
        totalCount.value = listeners.length
        pageNumber.value = 1
        updatePageData()
      } catch (error: any) {
        ElMessage.error(error.message || t('listeningToQuery.queryFailed') || '查询失败')
        allListeners.value = []
        listenerList.value = []
        totalCount.value = 0
      } finally {
        loading.value = false
      }
    }

    const updatePageData = () => {
      const startIndex = (pageNumber.value - 1) * pageSize.value
      const endIndex = startIndex + pageSize.value
      listenerList.value = allListeners.value.slice(startIndex, endIndex)
    }

    const handleQuery = () => {
      urlParams.setParams({
        listeningDataId: queryType.value === 0 ? searchForm.dataId : '',
        listeningGroup: queryType.value === 0 ? searchForm.group : '',
      })
      fetchListeners()
    }

    const handlePageChange = (page: number) => {
      pageNumber.value = page
      updatePageData()
    }

    const handlePageSizeChange = (size: number) => {
      pageSize.value = size
      pageNumber.value = 1
      updatePageData()
    }

    // ✅ Composition API: 生命周期钩子
    onMounted(() => {
      if (searchForm.dataId && searchForm.group) {
        queryType.value = 0
        fetchListeners()
      }
    })

    // ✅ Composition API: 返回渲染函数
    return () => (
      <div class="p-6">
        {/* 页面标题 */}
        <PageTitle
          title={t('listeningToQuery.title') || '监听查询'}
          desc={currentNamespaceDesc.value}
          namespaceId={currentNamespace.value}
          namespaceName={currentNamespaceName.value}
          nameSpace={true}
        />

        {/* 命名空间选择 */}
        <div class="mb-4">
          <NameSpaceList
            onNamespaceChange={handleNamespaceChange}
          />
        </div>

        {/* 查询表单 */}
        <ElCard class="mb-4">
          <ElForm inline>
            <ElFormItem label={t('listeningToQuery.queryType') || '查询类型'}>
              <ElRadioGroup
                modelValue={queryType.value}
                onUpdate:modelValue={(val: number) => {
                  queryType.value = val
                  allListeners.value = []
                  listenerList.value = []
                  totalCount.value = 0
                }}
              >
                <ElRadio label={0}>{t('listeningToQuery.queryByConfig') || '按配置查询'}</ElRadio>
                <ElRadio label={1}>{t('listeningToQuery.queryByIp') || '按 IP 查询'}</ElRadio>
              </ElRadioGroup>
            </ElFormItem>
            {queryType.value === 0 ? (
              <>
                <ElFormItem label={t('config.dataId') || 'Data ID'} required>
                  <ElInput
                    modelValue={searchForm.dataId}
                    onUpdate:modelValue={(val: string) => (searchForm.dataId = val)}
                    placeholder={t('config.dataId') || '请输入 Data ID'}
                    style="width: 200px"
                  />
                </ElFormItem>
                <ElFormItem label={t('config.group') || 'Group'} required>
                  <ElInput
                    modelValue={searchForm.group}
                    onUpdate:modelValue={(val: string) => (searchForm.group = val)}
                    placeholder={t('config.group') || '请输入 Group'}
                    style="width: 200px"
                  />
                </ElFormItem>
              </>
            ) : (
              <ElFormItem label={t('listeningToQuery.ip') || 'IP 地址'} required>
                <ElInput
                  modelValue={searchForm.ip}
                  onUpdate:modelValue={(val: string) => (searchForm.ip = val)}
                  placeholder={t('listeningToQuery.ipPlaceholder') || '请输入 IP 地址'}
                  style="width: 200px"
                />
              </ElFormItem>
            )}
            <ElFormItem>
              <ElButton type="primary" onClick={handleQuery} loading={loading.value}>
                {t('common.query') || '查询'}
              </ElButton>
            </ElFormItem>
          </ElForm>
        </ElCard>

        {/* 查询结果 */}
        <div class="mb-4">
          <QueryResult total={totalCount.value} />
        </div>

        {/* 监听者列表 */}
        <ElCard>
          {queryType.value === 1 ? (
            <ElTable
              {...{
                loading: loading.value,
                data: listenerList.value,
                stripe: true,
                style: 'width: 100%',
                'max-height': '500px',
              }}
            >
              <ElTableColumn prop="dataId" label={t('config.dataId') || 'Data ID'} minWidth={200} />
              <ElTableColumn prop="group" label={t('config.group') || 'Group'} width={150} />
              <ElTableColumn prop="md5" label="MD5" minWidth={200} />
            </ElTable>
          ) : (
            <ElTable
              {...{
                loading: loading.value,
                data: listenerList.value,
                stripe: true,
                style: 'width: 100%',
                'max-height': '400px',
              }}
            >
              <ElTableColumn prop="ip" label={t('listeningToQuery.ip') || 'IP'} minWidth={150} />
              <ElTableColumn prop="md5" label="MD5" minWidth={200} />
            </ElTable>
          )}

          {/* 分页 */}
          {totalCount.value > 0 && (
            <div class="mt-4 flex justify-end">
              <ElPagination
                {...{
                  'current-page': pageNumber.value,
                  'onUpdate:current-page': handlePageChange,
                  'page-size': pageSize.value,
                  'onUpdate:page-size': handlePageSizeChange,
                  total: totalCount.value,
                  'page-sizes': [10, 20, 50, 100],
                  layout: 'total, sizes, prev, pager, next, jumper',
                }}
                v-slots={{
                  total: () => <TotalRender total={totalCount.value} />,
                }}
              />
            </div>
          )}
        </ElCard>
      </div>
    )
  },
})
