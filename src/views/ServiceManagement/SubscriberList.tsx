/**
 * SubscriberList 页面
 * 订阅者列表展示
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/ServiceManagement/SubscriberList/SubscriberList.js
 */

import { defineComponent, ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElTable,
  ElTableColumn,
  ElPagination,
  ElMessage,
  ElLoading,
} from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'
import PageTitle from '@/components/PageTitle/index'
import NameSpaceList from '@/components/NameSpaceList/index'
import { getSubscribers, type Subscriber } from '@/api/service'
import { urlParams } from '@/utils/urlParams'

export default defineComponent({
  name: 'SubscriberList',
  setup() {
    const route = useRoute()
    const { t } = useI18n()

    // 状态管理
    const loading = ref(false)
    const subscriberList = ref<Subscriber[]>([])
    const totalCount = ref(0)
    const pageNo = ref(1)
    const pageSize = ref(10)

    // 命名空间
    const currentNamespace = ref(urlParams.getParams('namespace') || 'public')
    const currentNamespaceName = ref('public')
    const currentNamespaceDesc = ref('')

    // 搜索表单
    const searchForm = reactive({
      serviceName: urlParams.getParams('name') || '',
      groupName: urlParams.getParams('groupName') || '',
    })

    // 获取订阅者列表
    const fetchSubscriberList = async () => {
      if (!searchForm.serviceName) {
        ElMessage.error(t('service.subscriber.serviceNameRequired'))
        return
      }

      loading.value = true
      try {
        const res = await getSubscribers({
          serviceName: searchForm.serviceName,
          groupName: searchForm.groupName || 'DEFAULT_GROUP',
          namespaceId: currentNamespace.value !== 'public' ? currentNamespace.value : undefined,
        })

        if (res.code === 0 && res.data) {
          // 处理不同的响应格式
          if (Array.isArray(res.data)) {
            subscriberList.value = res.data
            totalCount.value = res.data.length
          } else if (res.data.pageItems) {
            subscriberList.value = res.data.pageItems
            totalCount.value = res.data.totalCount || res.data.count || res.data.pageItems.length
          } else if (res.data.subscribers) {
            subscriberList.value = res.data.subscribers
            totalCount.value = res.data.totalCount || res.data.count || res.data.subscribers.length
          } else {
            subscriberList.value = []
            totalCount.value = 0
          }
        } else {
          ElMessage.error(res.message || t('service.subscriber.queryFailed'))
        }
      } catch (error: any) {
        ElMessage.error(error.message || t('service.subscriber.queryFailed'))
      } finally {
        loading.value = false
      }
    }

    // 命名空间变化处理
    const handleNamespaceChange = (namespace: { id: string; name: string; desc?: string }) => {
      currentNamespace.value = namespace.id
      currentNamespaceName.value = namespace.name
      currentNamespaceDesc.value = namespace.desc || ''
      subscriberList.value = []
      totalCount.value = 0
    }

    // 搜索处理
    const handleSearch = () => {
      pageNo.value = 1
      urlParams.setParams({
        name: searchForm.serviceName,
        groupName: searchForm.groupName,
      })
      fetchSubscriberList()
    }

    // 分页变化
    const handlePageChange = (page: number) => {
      pageNo.value = page
      fetchSubscriberList()
    }

    // 组件挂载时，如果有服务名则自动查询
    onMounted(() => {
      if (searchForm.serviceName) {
        fetchSubscriberList()
      }
    })

    return () => (
      <div class="subscriber-list-container p-4">
        <ElLoading v-loading={loading.value} text="Loading...">
          <PageTitle
            title={t('service.subscriber.subscriberList')}
            desc={currentNamespaceDesc.value}
            namespaceId={currentNamespace.value}
            namespaceName={currentNamespaceName.value}
          />

          <NameSpaceList
            modelValue={currentNamespace.value}
            onUpdate:modelValue={(val: string) => {
              currentNamespace.value = val
            }}
            onChange={handleNamespaceChange}
          />

          <ElCard class="mb-4">
            <ElForm inline>
              <ElFormItem label={t('service.serviceName')} required>
                <ElInput
                  modelValue={searchForm.serviceName}
                  placeholder={t('service.serviceNamePlaceholder')}
                  style="width: 200px"
                  onUpdate:modelValue={(val: string) => {
                    searchForm.serviceName = val
                  }}
                  onKeydown={(e: KeyboardEvent) => {
                    if (e.key === 'Enter') {
                      handleSearch()
                    }
                  }}
                />
              </ElFormItem>
              <ElFormItem label={t('service.groupName')}>
                <ElInput
                  modelValue={searchForm.groupName}
                  placeholder={t('service.groupNamePlaceholder')}
                  style="width: 200px"
                  onUpdate:modelValue={(val: string) => {
                    searchForm.groupName = val
                  }}
                  onKeydown={(e: KeyboardEvent) => {
                    if (e.key === 'Enter') {
                      handleSearch()
                    }
                  }}
                />
              </ElFormItem>
              <ElFormItem>
                <ElButton type="primary" icon={Search} onClick={handleSearch}>
                  {t('service.query')}
                </ElButton>
              </ElFormItem>
            </ElForm>
          </ElCard>

          <ElCard>
            <ElTable data={subscriberList.value} empty-text={t('service.subscriber.noData')}>
              <ElTableColumn prop="groupName" label={t('service.groupName')} />
              <ElTableColumn prop="serviceName" label={t('service.serviceName')} />
              <ElTableColumn prop="address" label={t('service.subscriber.address')} />
              <ElTableColumn prop="agent" label={t('service.subscriber.clientVersion')} />
              <ElTableColumn prop="appName" label={t('service.subscriber.appName')} />
            </ElTable>

            {totalCount.value > pageSize.value && (
              <ElPagination
                class="mt-4"
                total={totalCount.value}
                page-size={pageSize.value}
                current-page={pageNo.value}
                layout="total, prev, pager, next"
                onUpdate:current-page={handlePageChange}
              />
            )}
          </ElCard>
        </ElLoading>
      </div>
    )
  },
})
