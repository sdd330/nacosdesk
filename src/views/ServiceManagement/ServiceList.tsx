/**
 * ServiceList 页面
 * 服务列表展示
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/ServiceManagement/ServiceList/ServiceList.js
 */

import { defineComponent, ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
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
  ElMessageBox,
  ElSwitch,
  ElLink,
  ElIcon,
} from 'element-plus'
import { Plus, View, Delete } from '@element-plus/icons-vue'
import { useServiceStore } from '@/stores/service'
import { useI18n } from '@/composables/useI18n'
import PageTitle from '@/components/PageTitle/index'
import NameSpaceList from '@/components/NameSpaceList/index'
import TotalRender from '@/components/Page/TotalRender'
import { urlParams } from '@/utils/urlParams'

export default defineComponent({
  name: 'ServiceList',
  setup() {
    // ✅ Composition API: 使用 composables
    const router = useRouter()
    const serviceStore = useServiceStore()
    const { t } = useI18n()

    // ✅ Composition API: 使用 ref 定义响应式状态
    const currentNamespace = ref(urlParams.getParams('namespace') || 'public')
    const currentNamespaceName = ref('public')
    const currentNamespaceDesc = ref('')

    // 搜索表单
    const searchForm = reactive({
      serviceName: urlParams.getParams('serviceNameParam') || '',
      groupName: urlParams.getParams('groupNameParam') || '',
    })

    const ignoreEmptyService = ref(
      localStorage.getItem('ignoreEmptyService') !== 'false'
    )

    // ✅ Composition API: 方法定义
    const handleNamespaceChange = (namespace: { id: string; name: string; desc?: string }) => {
      currentNamespace.value = namespace.id
      currentNamespaceName.value = namespace.name
      currentNamespaceDesc.value = namespace.desc || ''
      serviceStore.updateSearchParams({ namespaceId: namespace.id })
      serviceStore.pageNumber = 1
      handleSearch()
    }

    const handleSearch = async () => {
      // 更新 URL 参数
      urlParams.setParams({
        serviceNameParam: searchForm.serviceName,
        groupNameParam: searchForm.groupName,
      })

      await serviceStore.fetchServiceList({
        serviceNameParam: searchForm.serviceName || undefined,
        groupNameParam: searchForm.groupName || undefined,
        namespaceId: currentNamespace.value || undefined,
        ignoreEmptyService: ignoreEmptyService.value,
        withInstances: false,
      })
    }

    const handleCreate = () => {
      // TODO: 打开创建服务对话框
      ElMessage.info(t('service.createComingSoon') || '创建服务功能开发中')
    }

    const handleViewDetail = (row: any) => {
      router.push({
        name: 'ServiceDetail',
        query: {
          name: row.name,
          groupName: row.groupName,
          namespace: currentNamespace.value,
        },
      })
    }

    const handleViewSubscriber = (row: any) => {
      router.push({
        name: 'SubscriberList',
        query: {
          name: row.name,
          groupName: row.groupName,
          namespace: currentNamespace.value,
        },
      })
    }

    const handleDelete = async (row: any) => {
      try {
        await ElMessageBox.confirm(
          t('service.promptDelete') || '确定要删除该服务吗？',
          t('common.prompt') || '提示',
          {
            confirmButtonText: t('common.confirm') || '确定',
            cancelButtonText: t('common.cancel') || '取消',
            type: 'warning',
          }
        )

        const success = await serviceStore.removeService(
          row.name,
          row.groupName,
          currentNamespace.value
        )

        if (success) {
          ElMessage.success(t('service.deleteSuccess') || '服务删除成功')
        } else {
          ElMessage.error(serviceStore.error || t('service.deleteFailed') || '删除服务失败')
        }
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error(error.message || t('service.deleteFailed') || '删除服务失败')
        }
      }
    }

    const handleShowSampleCode = (row: any) => {
      // TODO: 显示示例代码
      ElMessage.info(t('service.sampleCodeComingSoon') || '示例代码功能开发中')
    }

    const handleIgnoreEmptyServiceChange = (val: boolean) => {
      ignoreEmptyService.value = val
      localStorage.setItem('ignoreEmptyService', String(val))
      serviceStore.pageNumber = 1
      handleSearch()
    }

    const handlePageChange = (page: number) => {
      serviceStore.pageNumber = page
      handleSearch()
    }

    const handlePageSizeChange = (size: number) => {
      serviceStore.pageSize = size
      serviceStore.pageNumber = 1
      handleSearch()
    }

    // ✅ Composition API: 生命周期钩子
    onMounted(async () => {
      if (currentNamespace.value) {
        serviceStore.updateSearchParams({
          namespaceId: currentNamespace.value,
        })
      }
      await handleSearch()
    })

    // ✅ Composition API: 返回渲染函数
    return () => (
      <div class="p-6">
        {/* 页面标题 */}
        <PageTitle
          title={t('service.serviceList') || '服务列表'}
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

        {/* 搜索表单 */}
        <ElCard class="mb-4">
          <ElForm inline>
            <ElFormItem>
              <ElButton type="primary" onClick={handleCreate}>
                <ElIcon><Plus /></ElIcon>
                {t('service.create') || '创建服务'}
              </ElButton>
            </ElFormItem>
            <ElFormItem label={t('service.serviceName') || '服务名'}>
              <ElInput
                modelValue={searchForm.serviceName}
                onUpdate:modelValue={(val: string) => (searchForm.serviceName = val)}
                placeholder={t('service.serviceNamePlaceholder') || '请输入服务名'}
                style="width: 200px"
                onKeydown={(e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    serviceStore.pageNumber = 1
                    handleSearch()
                  }
                }}
              />
            </ElFormItem>
            <ElFormItem label={t('service.groupName') || '分组名'}>
              <ElInput
                modelValue={searchForm.groupName}
                onUpdate:modelValue={(val: string) => (searchForm.groupName = val)}
                placeholder={t('service.groupNamePlaceholder') || '请输入分组名'}
                style="width: 200px"
                onKeydown={(e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    serviceStore.pageNumber = 1
                    handleSearch()
                  }
                }}
              />
            </ElFormItem>
            <ElFormItem label={t('service.hiddenEmptyService') || '隐藏空服务'}>
              <ElSwitch
                modelValue={ignoreEmptyService.value}
                onUpdate:modelValue={handleIgnoreEmptyServiceChange}
              />
            </ElFormItem>
            <ElFormItem>
              <ElButton type="primary" onClick={() => {
                serviceStore.pageNumber = 1
                handleSearch()
              }}>
                {t('common.query') || '查询'}
              </ElButton>
            </ElFormItem>
          </ElForm>
        </ElCard>

        {/* 服务列表表格 */}
        <ElCard>
          <ElTable
            {...{
              loading: serviceStore.loading,
              data: serviceStore.serviceList,
              stripe: true,
              style: 'width: 100%',
            }}
            rowClassName={(row: any) => (!row.healthyInstanceCount ? 'bg-red-50' : '')}
          >
            <ElTableColumn prop="name" label={t('service.columnServiceName') || '服务名'} minWidth={200} />
            <ElTableColumn prop="groupName" label={t('service.groupName') || '分组名'} width={150} />
            <ElTableColumn prop="clusterCount" label={t('service.columnClusterCount') || '集群数'} width={100} />
            <ElTableColumn prop="ipCount" label={t('service.columnIpCount') || '实例数'} width={100} />
            <ElTableColumn prop="healthyInstanceCount" label={t('service.columnHealthyInstanceCount') || '健康实例数'} width={120} />
            <ElTableColumn prop="triggerFlag" label={t('service.columnTriggerFlag') || '触发保护阈值'} width={120}>
              {{
                default: ({ row }: { row: any }) => (
                  <span>{row.triggerFlag ? t('common.yes') || '是' : t('common.no') || '否'}</span>
                ),
              }}
            </ElTableColumn>
            <ElTableColumn label={t('common.operation') || '操作'} width={300} fixed="right">
              {{
                default: ({ row }: { row: any }) => (
                  <div class="flex items-center gap-2">
                    <ElLink type="primary" onClick={() => handleViewDetail(row)}>
                      {t('common.detail') || '详情'}
                    </ElLink>
                    <span>|</span>
                    <ElLink type="primary" onClick={() => handleShowSampleCode(row)}>
                      {t('service.sampleCode') || '示例代码'}
                    </ElLink>
                    <span>|</span>
                    <ElLink type="primary" onClick={() => handleViewSubscriber(row)}>
                      {t('service.subscriber') || '订阅者'}
                    </ElLink>
                    <span>|</span>
                    <ElLink type="danger" onClick={() => handleDelete(row)}>
                      {t('common.delete') || '删除'}
                    </ElLink>
                  </div>
                ),
              }}
            </ElTableColumn>
          </ElTable>

          {/* 分页 */}
          <div class="mt-4 flex justify-end">
            <ElPagination
              {...{
                'current-page': serviceStore.pageNumber,
                'onUpdate:current-page': handlePageChange,
                'page-size': serviceStore.pageSize,
                'onUpdate:page-size': handlePageSizeChange,
                total: serviceStore.totalCount,
                'page-sizes': [10, 20, 50, 100],
                layout: 'total, sizes, prev, pager, next, jumper',
              }}
              v-slots={{
                total: () => <TotalRender total={serviceStore.totalCount} />,
              }}
            />
          </div>
        </ElCard>
      </div>
    )
  },
})
