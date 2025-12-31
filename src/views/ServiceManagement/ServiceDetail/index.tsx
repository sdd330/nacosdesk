/**
 * ServiceDetail 页面
 * 服务详情展示
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/ServiceManagement/ServiceDetail/ServiceDetail.js
 */

import { defineComponent, ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElMessage,
  ElLoading,
} from 'element-plus'
import { ArrowLeft, Edit } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'
import MonacoEditor from '@/components/MonacoEditor/index'
import { getServiceDetail, type ServiceDetail as ServiceDetailType, type Cluster } from '@/api/service'
import { urlParams } from '@/utils/urlParams'
import InstanceTable from './components/InstanceTable'
import InstanceFilter from './components/InstanceFilter'
import EditServiceDialog from './components/EditServiceDialog'
import EditClusterDialog from './components/EditClusterDialog'

export default defineComponent({
  name: 'ServiceDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const { t } = useI18n()

    // 从 URL 参数获取服务信息
    const serviceName = ref((route.query.name as string) || '')
    const groupName = ref((route.query.groupName as string) || '')
    const namespaceId = ref(urlParams.getParams('namespaceId') || undefined)

    // 状态管理
    const loading = ref(false)
    const service = ref<ServiceDetailType | null>(null)
    const clusters = ref<Cluster[]>([])
    const instanceFilters = reactive<Map<string, Map<string, string>>>(new Map())

    // 对话框引用
    const editServiceDialogRef = ref<InstanceType<typeof EditServiceDialog> | null>(null)
    const editClusterDialogRef = ref<InstanceType<typeof EditClusterDialog> | null>(null)

    // 如果没有服务名，返回上一页
    if (!serviceName.value) {
      router.back()
    }

    // 获取服务详情
    const fetchServiceDetail = async () => {
      if (!serviceName.value || !groupName.value) return

      loading.value = true
      try {
        const res = await getServiceDetail({
          serviceName: serviceName.value,
          groupName: groupName.value,
          namespaceId: namespaceId.value,
        })

        if (res.code === 0 && res.data) {
          service.value = res.data
          // 将 clusterMap 转换为数组
          const clusterMap = res.data.clusterMap || {}
          clusters.value = Object.values(clusterMap)
        } else {
          ElMessage.error(res.message || t('service.deleteFailed'))
        }
      } catch (error: any) {
        ElMessage.error(error.message || t('service.deleteFailed'))
      } finally {
        loading.value = false
      }
    }

    // 打开编辑服务对话框
    const openEditServiceDialog = () => {
      if (editServiceDialogRef.value && service.value) {
        ;(editServiceDialogRef.value as any).openDialog(service.value)
      }
    }

    // 打开编辑集群对话框
    const openClusterDialog = (cluster: Cluster) => {
      if (editClusterDialogRef.value && serviceName.value && groupName.value) {
        ;(editClusterDialogRef.value as any).openDialog(cluster, groupName.value, serviceName.value)
      }
    }

    // 设置实例筛选器
    const setFilters = (clusterName: string) => (filters: Map<string, string>) => {
      instanceFilters.set(clusterName, filters)
    }

    // 计算元数据文本
    const metadataText = computed(() => {
      if (!service.value?.metadata || Object.keys(service.value.metadata).length === 0) {
        return ''
      }
      return JSON.stringify(service.value.metadata, null, '\t')
    })

    // 组件挂载时获取服务详情
    onMounted(() => {
      fetchServiceDetail()
    })

    return () => {
      if (!service.value) {
        return null
      }

      const { selector = {} } = service.value

      return (
        <div class="service-detail-container p-4">
          <ElLoading v-loading={loading.value} text="Loading...">
            <div class="mb-4 flex items-center justify-between">
              <h1 class="text-2xl font-bold">{t('service.serviceDetails')}</h1>
              <div class="flex gap-2">
                <ElButton icon={ArrowLeft} onClick={() => router.back()}>
                  {t('service.back')}
                </ElButton>
                <ElButton type="primary" icon={Edit} onClick={openEditServiceDialog}>
                  {t('service.editService')}
                </ElButton>
              </div>
            </div>

            <ElCard class="mb-4">
              <ElForm label-width="120px">
                <ElFormItem label={t('service.serviceName')}>
                  <ElInput modelValue={service.value.serviceName} readonly />
                </ElFormItem>
                <ElFormItem label={t('service.groupName')}>
                  <ElInput modelValue={service.value.groupName} readonly />
                </ElFormItem>
                <ElFormItem label={t('service.protectThreshold')}>
                  <ElInput modelValue={String(service.value.protectThreshold)} readonly />
                </ElFormItem>
                <ElFormItem label={t('service.metadata')}>
                  <MonacoEditor
                    language="json"
                    width="100%"
                    height={200}
                    value={metadataText.value}
                    options={{ readOnly: true }}
                  />
                </ElFormItem>
                <ElFormItem label={t('service.type')}>
                  <ElInput modelValue={selector.type || 'none'} readonly />
                </ElFormItem>
                {selector.type && selector.type !== 'none' && (
                  <ElFormItem label={t('service.selector')}>
                    <ElInput modelValue={selector.expression || ''} readonly />
                  </ElFormItem>
                )}
              </ElForm>
            </ElCard>

            {clusters.value.map((cluster) => (
              <ElCard
                key={cluster.clusterName}
                class="mb-4"
                header={
                  <div class="flex items-center justify-between">
                    <span>
                      {t('service.cluster')}: {cluster.clusterName}
                    </span>
                    <ElButton type="primary" onClick={() => openClusterDialog(cluster)}>
                      {t('service.editCluster')}
                    </ElButton>
                  </div>
                }
              >
                <InstanceFilter
                  setFilters={setFilters(cluster.clusterName)}
                />
                <InstanceTable
                  clusterName={cluster.clusterName}
                  serviceName={serviceName.value}
                  groupName={groupName.value}
                  filters={instanceFilters.get(cluster.clusterName)}
                  onRefresh={fetchServiceDetail}
                />
              </ElCard>
            ))}
          </ElLoading>

          <EditServiceDialog
            ref={editServiceDialogRef}
            onRefresh={fetchServiceDetail}
          />
          <EditClusterDialog
            ref={editClusterDialogRef}
            onRefresh={fetchServiceDetail}
          />
        </div>
      )
    }
  },
})
