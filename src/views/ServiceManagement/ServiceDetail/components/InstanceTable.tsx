/**
 * InstanceTable 组件
 * 实例列表组件
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/ServiceManagement/ServiceDetail/InstanceTable.js
 */

import { defineComponent, ref, onMounted, watch, computed } from 'vue'
import {
  ElTable,
  ElTableColumn,
  ElPagination,
  ElButton,
  ElMessage,
  ElTag,
  ElMessageBox,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import { getInstances, updateInstance, deleteInstance, type Instance } from '@/api/service'
import { urlParams } from '@/utils/urlParams'
import EditInstanceDialog from './EditInstanceDialog'

// 健康状态颜色映射
const HEALTHY_COLOR_MAPPING: Record<string, string> = {
  true: 'green',
  false: 'red',
}

// 实例筛选函数
function instanceFilter(array: Instance[], filters?: Map<string, string>): Instance[] {
  if (!filters || filters.size === 0) {
    return array
  }

  return array.filter((item) => {
    const { metadata = {} } = item
    let isTargetInstance = true

    filters.forEach((value, key) => {
      if (value !== metadata[key]) {
        isTargetInstance = false
        return false
      }
    })

    return isTargetInstance
  })
}

export default defineComponent({
  name: 'InstanceTable',
  props: {
    clusterName: {
      type: String,
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
    },
    groupName: {
      type: String,
      required: true,
    },
    filters: {
      type: Map,
      default: () => new Map(),
    },
    onRefresh: {
      type: Function,
      default: () => {},
    },
  },
  setup(props) {
    const { t } = useI18n()

    const loading = ref(false)
    const instanceList = ref<Instance[]>([])
    const totalCount = ref(0)
    const pageNum = ref(1)
    const pageSize = ref(10)

    const editInstanceDialogRef = ref<InstanceType<typeof EditInstanceDialog> | null>(null)

    // 获取实例列表
    const fetchInstanceList = async () => {
      if (!props.clusterName) return

      loading.value = true
      try {
        const namespaceId = urlParams.getParams('namespaceId') || undefined
        const res = await getInstances({
          serviceName: props.serviceName,
          clusterName: props.clusterName,
          groupName: props.groupName,
          pageNo: pageNum.value,
          pageSize: pageSize.value,
          namespaceId,
        })

        if (res.code === 0 && res.data) {
          instanceList.value = res.data.pageItems || []
          totalCount.value = res.data.totalCount || 0
        } else {
          ElMessage.error(res.message || t('service.instanceTable.updateFailed'))
        }
      } catch (error: any) {
        ElMessage.error(error.message || t('service.instanceTable.updateFailed'))
      } finally {
        loading.value = false
      }
    }

    // 切换实例状态（上线/下线）
    const switchState = async (instance: Instance, index: number) => {
      loading.value = true
      try {
        const namespaceId = urlParams.getParams('namespaceId') || undefined
        const res = await updateInstance({
          serviceName: props.serviceName,
          clusterName: props.clusterName,
          groupName: props.groupName,
          ip: instance.ip,
          port: instance.port,
          ephemeral: instance.ephemeral,
          weight: instance.weight,
          enabled: !instance.enabled,
          metadata: JSON.stringify(instance.metadata || {}),
          namespaceId,
        })

        if (res.code === 0 && res.data === 'ok') {
          instanceList.value[index].enabled = !instance.enabled
          ElMessage.success(t('service.instanceTable.updateSuccess'))
        } else {
          ElMessage.error(res.message || t('service.instanceTable.updateFailed'))
        }
      } catch (error: any) {
        ElMessage.error(error.message || t('service.instanceTable.updateFailed'))
      } finally {
        loading.value = false
      }
    }

    // 删除实例
    const handleDelete = async (instance: Instance) => {
      try {
        await ElMessageBox.confirm(
          t('service.instanceTable.confirmDelete'),
          t('service.delete'),
          {
            type: 'warning',
          }
        )

        loading.value = true
        const namespaceId = urlParams.getParams('namespaceId') || undefined
        const res = await deleteInstance({
          serviceName: props.serviceName,
          clusterName: props.clusterName,
          groupName: props.groupName,
          ip: instance.ip,
          port: instance.port,
          ephemeral: instance.ephemeral,
          namespaceId,
        })

        if (res.code === 0) {
          ElMessage.success(t('service.instanceTable.deleteSuccess'))
          await fetchInstanceList()
          props.onRefresh()
        } else {
          ElMessage.error(res.message || t('service.instanceTable.deleteFailed'))
        }
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error(error.message || t('service.instanceTable.deleteFailed'))
        }
      } finally {
        loading.value = false
      }
    }

    // 打开编辑实例对话框
    const openInstanceDialog = (instance: Instance) => {
      if (editInstanceDialogRef.value) {
        ;(editInstanceDialogRef.value as any).openDialog(instance)
      }
    }

    // 分页变化
    const handlePageChange = (page: number) => {
      pageNum.value = page
      fetchInstanceList()
    }

    const handlePageSizeChange = (size: number) => {
      pageSize.value = size
      pageNum.value = 1
      fetchInstanceList()
    }

    // 筛选后的实例列表
    const filteredInstanceList = computed(() => {
      return instanceFilter(instanceList.value, props.filters as Map<string, string>)
    })

    // 监听 filters 变化，重新获取数据
    watch(
      () => props.filters,
      () => {
        // 筛选不需要重新请求，只需要过滤本地数据
      },
      { deep: true }
    )

    // 组件挂载时获取实例列表
    onMounted(() => {
      fetchInstanceList()
    })

    return () => {
      if (filteredInstanceList.value.length === 0) {
        return null
      }

      return (
        <div>
          <ElTable
            data={filteredInstanceList.value}
            v-loading={loading.value}
            stripe
          >
            <ElTableColumn prop="ip" label={t('service.instanceTable.ip')} width="138" />
            <ElTableColumn prop="port" label={t('service.instanceTable.port')} width="100" />
            <ElTableColumn
              prop="ephemeral"
              label="临时实例"
              width="100"
              formatter={(row: Instance) => String(row.ephemeral)}
            />
            <ElTableColumn prop="weight" label={t('service.instanceTable.weight')} width="100" />
            <ElTableColumn
              prop="healthy"
              label={t('service.instanceTable.healthy')}
              width="100"
            >
              {{
                default: ({ row }: { row: Instance }) => (
                  <ElTag
                    type={row.healthy ? 'success' : 'danger'}
                  >
                    {String(row.healthy)}
                  </ElTag>
                ),
              }}
            </ElTableColumn>
            <ElTableColumn prop="enabled" label={t('service.instanceTable.enabled')} width="100">
              {{
                default: ({ row }: { row: Instance }) => (
                  <ElTag type={row.enabled ? 'success' : 'info'}>
                    {row.enabled ? '启用' : '禁用'}
                  </ElTag>
                ),
              }}
            </ElTableColumn>
            <ElTableColumn prop="metadata" label={t('service.instanceTable.metadata')}>
              {{
                default: ({ row }: { row: Instance }) => {
                  if (!row.metadata) return null
                  return Object.keys(row.metadata).map((k) => (
                    <div key={k}>
                      {k}={row.metadata![k]}
                    </div>
                  ))
                },
              }}
            </ElTableColumn>
            <ElTableColumn
              label={t('service.instanceTable.operation')}
              width="240"
              fixed="right"
            >
              {{
                default: ({ row, $index }: { row: Instance; $index: number }) => (
                  <div class="flex gap-2">
                    <ElButton
                      type="primary"
                      size="small"
                      onClick={() => openInstanceDialog(row)}
                    >
                      {t('service.instanceTable.edit')}
                    </ElButton>
                    <ElButton
                      type={row.enabled ? 'default' : 'success'}
                      size="small"
                      onClick={() => switchState(row, $index)}
                    >
                      {row.enabled ? t('service.instanceTable.offline') : t('service.instanceTable.online')}
                    </ElButton>
                    <ElButton
                      type="danger"
                      size="small"
                      onClick={() => handleDelete(row)}
                    >
                      {t('service.instanceTable.delete')}
                    </ElButton>
                  </div>
                ),
              }}
            </ElTableColumn>
          </ElTable>

          {totalCount.value > 10 && (
            <ElPagination
              class="mt-4"
              total={totalCount.value}
              page-size={pageSize.value}
              current-page={pageNum.value}
              page-sizes={[10, 20, 50, 100]}
              layout="total, sizes, prev, pager, next"
              onUpdate:current-page={handlePageChange}
              onUpdate:page-size={handlePageSizeChange}
            />
          )}

          <EditInstanceDialog
            ref={editInstanceDialogRef}
            serviceName={props.serviceName}
            clusterName={props.clusterName}
            groupName={props.groupName}
            onRefresh={fetchInstanceList}
          />
        </div>
      )
    }
  },
})

