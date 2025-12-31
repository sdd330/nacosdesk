/**
 * ClusterNodeList 页面
 * 集群节点列表
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/ClusterManagement/ClusterNodeList/ClusterNodeList.js
 */

import { defineComponent, ref, reactive, onMounted } from 'vue'
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
  ElLoading,
  ElTag,
  ElCollapse,
  ElCollapseItem,
} from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'
import PageTitle from '@/components/PageTitle/index'
import { getClusterNodes, leaveCluster, type ClusterNode } from '@/api/cluster'
import MonacoEditor from '@/components/MonacoEditor/index'

export default defineComponent({
  name: 'ClusterNodeList',
  setup() {
    const { t } = useI18n()

    // 状态管理
    const loading = ref(false)
    const nodeList = ref<ClusterNode[]>([])
    const totalCount = ref(0)
    const pageNo = ref(1)
    const pageSize = ref(10)
    const keyword = ref('')

    // 获取集群节点列表
    const fetchClusterNodes = async () => {
      loading.value = true
      try {
        const res = await getClusterNodes({
          pageNo: pageNo.value,
          pageSize: pageSize.value,
          keyword: keyword.value || undefined,
          withInstances: false,
        })

        if (res.code === 0) {
          nodeList.value = res.data || []
          totalCount.value = res.count || 0
        } else {
          ElMessage.error(res.message || t('cluster.queryFailed'))
          nodeList.value = []
          totalCount.value = 0
        }
      } catch (error: any) {
        ElMessage.error(error.message || t('cluster.queryFailed'))
        nodeList.value = []
        totalCount.value = 0
      } finally {
        loading.value = false
      }
    }

    // 搜索
    const handleSearch = () => {
      pageNo.value = 1
      fetchClusterNodes()
    }

    // 分页变化
    const handlePageChange = (page: number) => {
      pageNo.value = page
      fetchClusterNodes()
    }

    // 节点离开集群
    const handleLeave = async (node: ClusterNode) => {
      try {
        await ElMessageBox.confirm(t('cluster.confirmLeave'), t('cluster.confirm'), {
          type: 'warning',
        })

        loading.value = true
        try {
          const res = await leaveCluster([node.address])
          if (res.code === 0) {
            ElMessage.success(t('cluster.leaveSuccess'))
            await fetchClusterNodes()
          } else {
            ElMessage.error(res.message || t('cluster.leaveFailed'))
          }
        } catch (error: any) {
          ElMessage.error(error.message || t('cluster.leaveFailed'))
        } finally {
          loading.value = false
        }
      } catch (error: any) {
        if (error !== 'cancel') {
          // 用户取消操作
        }
      }
    }

    // 渲染节点状态
    const renderState = (state: string) => {
      const stateMap: Record<string, { type: string; color: string }> = {
        UP: { type: 'success', color: 'green' },
        DOWN: { type: 'danger', color: 'red' },
        SUSPICIOUS: { type: 'warning', color: 'orange' },
      }

      const stateConfig = stateMap[state] || { type: 'info', color: 'turquoise' }

      return (
        <ElTag type={stateConfig.type as any} color={stateConfig.color}>
          {state}
        </ElTag>
      )
    }

    // 渲染扩展信息
    const renderExtendInfo = (extendInfo: Record<string, any> | undefined) => {
      if (!extendInfo || Object.keys(extendInfo).length === 0) {
        return '-'
      }

      return (
        <ElCollapse>
          <ElCollapseItem title={t('cluster.extendInfo')} name="extendInfo">
            <MonacoEditor
              language="json"
              width="100%"
              height={200}
              modelValue={JSON.stringify(extendInfo, null, 4)}
              options={{ readOnly: true }}
            />
          </ElCollapseItem>
        </ElCollapse>
      )
    }

    // 组件挂载时获取节点列表
    onMounted(() => {
      // 延迟查询，确保页面渲染完成
      setTimeout(() => {
        fetchClusterNodes()
      }, 0)
    })

    return () => (
      <div class="cluster-node-list-container p-4">
        <ElLoading v-loading={loading.value} text="Loading...">
          <PageTitle title={t('cluster.clusterNodeList')} />

          <ElCard class="mb-4">
            <ElForm inline>
              <ElFormItem label={t('cluster.nodeIp')}>
                <ElInput
                  modelValue={keyword.value}
                  placeholder={t('cluster.nodeIpPlaceholder')}
                  style="width: 200px"
                  onUpdate:modelValue={(val: string) => {
                    keyword.value = val
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
                  {t('cluster.query')}
                </ElButton>
              </ElFormItem>
            </ElForm>
          </ElCard>

          <ElCard>
            <ElTable
              data={nodeList.value}
              v-loading={loading.value}
              empty-text={t('cluster.noData')}
            >
              <ElTableColumn
                prop="address"
                label={t('cluster.nodeIp')}
                width="20%"
                align="center"
              />
              <ElTableColumn
                prop="state"
                label={t('cluster.nodeState')}
                width="10%"
                align="center"
              >
                {{
                  default: ({ row }: { row: ClusterNode }) => renderState(row.state),
                }}
              </ElTableColumn>
              <ElTableColumn
                prop="extendInfo"
                label={t('cluster.extendInfo')}
                width="50%"
              >
                {{
                  default: ({ row }: { row: ClusterNode }) => renderExtendInfo(row.extendInfo),
                }}
              </ElTableColumn>
              <ElTableColumn label={t('cluster.operation')} width="20%" align="center">
                {{
                  default: ({ row }: { row: ClusterNode }) => (
                    <ElButton type="warning" size="small" onClick={() => handleLeave(row)}>
                      {t('cluster.leave')}
                    </ElButton>
                  ),
                }}
              </ElTableColumn>
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
