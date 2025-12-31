/**
 * Agent 管理主页面
 * Agent 列表、搜索、创建、编辑、删除
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/AI/AgentManagement/AgentManagement.js
 */

import { defineComponent, ref, reactive, onMounted } from 'vue'
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
  ElTag,
  ElIcon,
} from 'element-plus'
import { Plus, View, Edit, Delete, VideoPlay, VideoPause } from '@element-plus/icons-vue'
import { useAiStore } from '@/stores/ai'
import { useI18n } from '@/composables/useI18n'
import PageTitle from '@/components/PageTitle/index'
import NameSpaceList from '@/components/NameSpaceList/index'
import TotalRender from '@/components/Page/TotalRender'
import { urlParams } from '@/utils/urlParams'
import type { Agent } from '@/api/ai'

export default defineComponent({
  name: 'AgentManagement',
  setup() {
    const router = useRouter()
    const aiStore = useAiStore()
    const { t } = useI18n()

    // 命名空间状态
    const currentNamespace = ref(urlParams.getParams('namespace') || 'public')
    const currentNamespaceName = ref('public')
    const currentNamespaceDesc = ref('')

    // 搜索表单
    const searchForm = reactive({
      agentName: urlParams.getParams('searchName') || '',
    })

    // 表格选择
    const selectedRows = ref<Agent[]>([])
    const selectedRowKeys = ref<string[]>([])

    // 分页
    const pageSize = ref(10)
    const currentPage = ref(1)

    // 命名空间变化处理
    const handleNamespaceChange = (namespace: { id: string; name: string; desc?: string }) => {
      currentNamespace.value = namespace.id
      currentNamespaceName.value = namespace.name
      currentNamespaceDesc.value = namespace.desc || ''
      aiStore.agentSearchParams.namespaceId = namespace.id
      currentPage.value = 1
      handleSearch()
    }

    // 搜索
    const handleSearch = async () => {
      urlParams.setParams({
        searchName: searchForm.agentName,
        pageNo: String(currentPage.value),
        pageSize: String(pageSize.value),
      })

      await aiStore.fetchAgentList({
        agentName: searchForm.agentName || undefined,
        namespaceId: currentNamespace.value || undefined,
        pageNo: currentPage.value,
        pageSize: pageSize.value,
        search: 'blur',
      })
    }

    // 创建 Agent
    const handleCreate = () => {
      router.push({
        name: 'NewAgent',
        query: {
          namespace: currentNamespace.value,
        },
      })
    }

    // 查看详情
    const handleViewDetail = (row: Agent) => {
      router.push({
        name: 'AgentDetail',
        query: {
          namespace: currentNamespace.value,
          name: row.name,
        },
      })
    }

    // 编辑
    const handleEdit = (row: Agent) => {
      router.push({
        name: 'NewAgent',
        query: {
          namespace: currentNamespace.value,
          name: row.name,
          mode: 'edit',
        },
      })
    }

    // 删除
    const handleDelete = async (row: Agent) => {
      try {
        await ElMessageBox.confirm(
          t('agentManagement.deleteAgentConfirm', { 0: row.name }) || `确定要删除Agent "${row.name}" 吗？`,
          t('agentManagement.deleteConfirm') || '删除确认',
          {
            confirmButtonText: t('common.confirm') || '确定',
            cancelButtonText: t('common.cancel') || '取消',
            type: 'warning',
          }
        )

        await aiStore.removeAgent(row.name, currentNamespace.value)
        ElMessage.success(t('agentManagement.deleteSuccess') || '删除成功')
        await handleSearch()
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error(error.message || t('agentManagement.deleteFailed') || '删除失败')
        }
      }
    }

    // 启动 Agent
    const handleStart = async (row: Agent) => {
      try {
        await aiStore.startAgentInstance(row.name, currentNamespace.value)
        ElMessage.success(t('agentManagement.startSuccess') || '启动成功')
        await handleSearch()
      } catch (error: any) {
        ElMessage.error(error.message || t('agentManagement.startFailed') || '启动失败')
      }
    }

    // 停止 Agent
    const handleStop = async (row: Agent) => {
      try {
        await aiStore.stopAgentInstance(row.name, currentNamespace.value)
        ElMessage.success(t('agentManagement.stopSuccess') || '停止成功')
        await handleSearch()
      } catch (error: any) {
        ElMessage.error(error.message || t('agentManagement.stopFailed') || '停止失败')
      }
    }

    // 批量删除
    const handleBatchDelete = async () => {
      if (selectedRows.value.length === 0) {
        ElMessage.warning(t('agentManagement.selectAgentToDelete') || '请先选择要删除的Agent')
        return
      }

      try {
        await ElMessageBox.confirm(
          t('agentManagement.batchDeleteContent', { 0: selectedRows.value.length }) || `确定要删除以下 ${selectedRows.value.length} 个Agent吗？`,
          t('agentManagement.batchDeleteConfirm') || '批量删除确认',
          {
            confirmButtonText: t('common.confirm') || '确定',
            cancelButtonText: t('common.cancel') || '取消',
            type: 'warning',
          }
        )

        // 批量删除
        const deletePromises = selectedRows.value.map(row => aiStore.removeAgent(row.name, currentNamespace.value))
        await Promise.all(deletePromises)

        ElMessage.success(t('agentManagement.batchDeleteSuccess') || '批量删除成功')
        selectedRows.value = []
        selectedRowKeys.value = []
        await handleSearch()
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error(error.message || t('agentManagement.batchDeleteFailed') || '批量删除失败')
        }
      }
    }

    // 表格选择变化
    const handleSelectionChange = (selection: Agent[]) => {
      selectedRows.value = selection
      selectedRowKeys.value = selection.map(row => row.id || row.name)
    }

    // 分页变化
    const handlePageChange = (page: number) => {
      currentPage.value = page
      handleSearch()
    }

    const handlePageSizeChange = (size: number) => {
      pageSize.value = size
      currentPage.value = 1
      handleSearch()
    }

    // 渲染状态标签
    const renderStatus = (row: Agent) => {
      const status = row.status || 'stopped'
      const statusMap: Record<string, { type: 'success' | 'danger' | 'warning' | 'info', text: string }> = {
        running: { type: 'success', text: t('agentManagement.running') || '运行中' },
        stopped: { type: 'info', text: t('agentManagement.stopped') || '已停止' },
        error: { type: 'danger', text: t('agentManagement.error') || '错误' },
      }
      const statusInfo = statusMap[status] || statusMap.stopped
      return <ElTag type={statusInfo.type}>{statusInfo.text}</ElTag>
    }

    // 渲染操作列
    const renderOperation = (row: Agent) => (
      <div class="flex items-center gap-2">
        <ElButton
          type="primary"
          link
          size="small"
          onClick={() => handleViewDetail(row)}
        >
          {t('agentManagement.details') || '详情'}
        </ElButton>
        <span style="margin: 0 4px;">|</span>
        <ElButton
          type="primary"
          link
          size="small"
          onClick={() => handleEdit(row)}
        >
          {t('agentManagement.edit') || '编辑'}
        </ElButton>
        <span style="margin: 0 4px;">|</span>
        <ElButton
          type="danger"
          link
          size="small"
          onClick={() => handleDelete(row)}
        >
          {t('agentManagement.delete') || '删除'}
        </ElButton>
        <span style="margin: 0 4px;">|</span>
        {((row as any).status === 'running') ? (
          <ElButton
            type="warning"
            link
            size="small"
            onClick={() => handleStop(row)}
          >
            <ElIcon><VideoPause /></ElIcon>
            {t('agentManagement.stop') || '停止'}
          </ElButton>
        ) : (
          <ElButton
            type="success"
            link
            size="small"
            onClick={() => handleStart(row)}
          >
            <ElIcon><VideoPlay /></ElIcon>
            {t('agentManagement.start') || '启动'}
          </ElButton>
        )}
      </div>
    )

    // 初始化
    onMounted(async () => {
      if (currentNamespace.value) {
        aiStore.agentSearchParams.namespaceId = currentNamespace.value
      }
      await handleSearch()
    })

    return () => (
      <div class="p-6">
        {/* 页面标题 */}
        <PageTitle
          title={t('agentManagement.agentManagement') || 'Agent管理'}
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
                {t('agentManagement.newAgent') || '新建Agent'}
              </ElButton>
            </ElFormItem>
            <ElFormItem label={t('agentManagement.agentName') || 'Agent名称'}>
              <ElInput
                modelValue={searchForm.agentName}
                onUpdate:modelValue={(val: string) => (searchForm.agentName = val)}
                placeholder={t('agentManagement.agentName') || '请输入 Agent 名称'}
                style="width: 200px"
                onKeydown={(e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    currentPage.value = 1
                    handleSearch()
                  }
                }}
              />
            </ElFormItem>
            <ElFormItem>
              <ElButton type="primary" onClick={() => {
                currentPage.value = 1
                handleSearch()
              }}>
                {t('agentManagement.search') || '搜索'}
              </ElButton>
            </ElFormItem>
          </ElForm>
        </ElCard>

        {/* Agent 列表表格 */}
        <ElCard>
          <div class="mb-4">
            <ElButton
              type="danger"
              disabled={selectedRows.value.length === 0}
              onClick={handleBatchDelete}
            >
              <ElIcon><Delete /></ElIcon>
              {t('agentManagement.delete') || '删除'}
            </ElButton>
          </div>

          <ElTable
            {...{
              loading: aiStore.agentLoading,
              data: aiStore.agentList,
              onSelectionChange: handleSelectionChange,
              stripe: true,
            }}
            style="width: 100%"
          >
            <ElTableColumn type="selection" width="55" />
            <ElTableColumn
              prop="name"
              label={t('agentManagement.agentName') || 'Agent名称'}
              minWidth="200"
              showOverflowTooltip
            />
            <ElTableColumn
              label={t('agentManagement.status') || '状态'}
              minWidth="100"
              v-slots={{
                default: ({ row }: { row: Agent }) => renderStatus(row),
              }}
            />
            <ElTableColumn
              prop="version"
              label={t('agentManagement.version') || '版本'}
              minWidth="100"
            />
            <ElTableColumn
              prop="ip"
              label={t('agentManagement.ip') || 'IP'}
              minWidth="150"
            />
            <ElTableColumn
              prop="updateTime"
              label={t('agentManagement.updateTime') || '更新时间'}
              minWidth="180"
            />
            <ElTableColumn
              label={t('agentManagement.operation') || '操作'}
              minWidth="250"
              fixed="right"
              v-slots={{
                default: ({ row }: { row: Agent }) => renderOperation(row),
              }}
            />
          </ElTable>

          {/* 分页 */}
          {aiStore.agentTotal > 0 && (
            <div class="mt-4 flex justify-end">
              <ElPagination
                currentPage={currentPage.value}
                pageSize={pageSize.value}
                total={aiStore.agentTotal}
                pageSizes={[10, 20, 50, 100]}
                onUpdate:currentPage={handlePageChange}
                onUpdate:pageSize={handlePageSizeChange}
                v-slots={{
                  total: () => <TotalRender total={aiStore.agentTotal} />,
                }}
              />
            </div>
          )}
        </ElCard>
      </div>
    )
  },
})
