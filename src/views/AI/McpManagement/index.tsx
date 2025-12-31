/**
 * MCP 管理主页面
 * MCP 服务器列表、搜索、创建、编辑、删除
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/AI/McpManagement/McpManagement.js
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
  ElTag,
  ElIcon,
  ElSwitch,
} from 'element-plus'
import { Plus, View, Edit, Delete, Upload, Download } from '@element-plus/icons-vue'
import ImportMcpDialog from '@/components/ImportMcpDialog/index'
import { useAiStore } from '@/stores/ai'
import { useI18n } from '@/composables/useI18n'
import PageTitle from '@/components/PageTitle/index'
import NameSpaceList from '@/components/NameSpaceList/index'
import RegionGroup from '@/components/RegionGroup/index'
import TotalRender from '@/components/Page/TotalRender'
import { urlParams } from '@/utils/urlParams'
import type { McpServer } from '@/api/ai'

export default defineComponent({
  name: 'McpManagement',
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
      mcpName: urlParams.getParams('mcpName') || '',
    })

    // 表格选择
    const selectedRows = ref<McpServer[]>([])
    const selectedRowKeys = ref<string[]>([])

    // 分页
    const pageSize = ref(10)
    const currentPage = ref(1)

    // 命名空间变化处理
    const handleNamespaceChange = (namespace: { id: string; name: string; desc?: string }) => {
      currentNamespace.value = namespace.id
      currentNamespaceName.value = namespace.name
      currentNamespaceDesc.value = namespace.desc || ''
      aiStore.mcpSearchParams.namespaceId = namespace.id
      currentPage.value = 1
      handleSearch()
    }

    // 搜索
    const handleSearch = async () => {
      urlParams.setParams({
        mcpName: searchForm.mcpName,
        pageNo: String(currentPage.value),
        pageSize: String(pageSize.value),
      })

      await aiStore.fetchMcpList({
        mcpName: searchForm.mcpName || undefined,
        namespaceId: currentNamespace.value || undefined,
        pageNo: currentPage.value,
        pageSize: pageSize.value,
        search: 'blur',
      })
    }

    // 创建 MCP 服务器
    const handleCreate = () => {
      router.push({
        name: 'NewMcpServer',
        query: {
          namespace: currentNamespace.value,
        },
      })
    }

    // 导入 MCP 服务器
    const importDialogVisible = ref(false)

    const handleImport = () => {
      importDialogVisible.value = true
    }

    const handleImportSuccess = () => {
      handleSearch()
    }

    // 查看详情
    const handleViewDetail = (row: McpServer) => {
      router.push({
        name: 'McpDetail',
        query: {
          namespace: currentNamespace.value,
          id: row.id,
        },
      })
    }

    // 编辑
    const handleEdit = (row: McpServer) => {
      router.push({
        name: 'NewMcpServer',
        query: {
          namespace: currentNamespace.value,
          id: row.id,
          mcptype: 'edit',
        },
      })
    }

    // 删除
    const handleDelete = async (row: McpServer) => {
      try {
        await ElMessageBox.confirm(
          t('mcpServerManagement.deleteMcpServer') || '确定要删除以下 MCP 服务吗？',
          t('common.prompt') || '提示',
          {
            confirmButtonText: t('common.confirm') || '确定',
            cancelButtonText: t('common.cancel') || '取消',
            type: 'warning',
            dangerouslyUseHTMLString: true,
            message: `
              <div style="margin-top: -20px;">
                <h3>${t('mcpServerManagement.deleteMcpServer') || '确定要删除以下 MCP 服务吗？'}</h3>
                <p>
                  <span style="color: #999; margin-right: 5px;">name</span>
                  <span style="color: #c7254e;">${row.name}</span>
                </p>
                ${row.description ? `
                  <p>
                    <span style="color: #999; margin-right: 5px;">${t('mcpServerManagement.description') || '描述'}</span>
                    <span style="color: #c7254e;">${row.description}</span>
                  </p>
                ` : ''}
              </div>
            `,
          }
        )

        await aiStore.removeMcp(row.id)
        ElMessage.success(t('mcpServerManagement.deleteSuccessfully') || '删除成功')
        await handleSearch()
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error(error.message || t('mcpServerManagement.deleteFailed') || '删除失败')
        }
      }
    }

    // 启用/禁用
    const handleToggleEnabled = async (row: McpServer) => {
      try {
        // TODO: 实现启用/禁用功能
        ElMessage.info(t('mcpServerManagement.updateSuccess') || '更新成功')
        await handleSearch()
      } catch (error: any) {
        ElMessage.error(error.message || t('mcpServerManagement.updateFailed') || '更新失败')
      }
    }

    // 批量删除
    const handleBatchDelete = async () => {
      if (selectedRows.value.length === 0) {
        ElMessage.warning(t('mcpServerManagement.delSelectedAlertContent') || '请先选择要删除的 MCP Server')
        return
      }

      try {
        await ElMessageBox.confirm(
          t('mcpServerManagement.deleteMcpServer') || '确定要删除以下 MCP 服务吗？',
          t('common.prompt') || '提示',
          {
            confirmButtonText: t('common.confirm') || '确定',
            cancelButtonText: t('common.cancel') || '取消',
            type: 'warning',
            dangerouslyUseHTMLString: true,
            message: `
              <div style="margin-top: -20px;">
                <h3>${t('mcpServerManagement.deleteMcpServer') || '确定要删除以下 MCP 服务吗？'}</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 1px solid #eee;">
                      <th style="padding: 8px; text-align: left;">MCP Server</th>
                      <th style="padding: 8px; text-align: left;">${t('mcpServerManagement.description') || '描述'}</th>
                      <th style="padding: 8px; text-align: left;">${t('mcpServerManagement.mcpServerType') || '类型'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${selectedRows.value.map(row => `
                      <tr>
                        <td style="padding: 8px;">${row.name}</td>
                        <td style="padding: 8px;">${row.description || '--'}</td>
                        <td style="padding: 8px;">${row.type || '--'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `,
          }
        )

        // 批量删除
        const deletePromises = selectedRows.value.map(row => aiStore.removeMcp(row.id))
        await Promise.all(deletePromises)

        ElMessage.success(t('mcpServerManagement.batchDeleteSuccessfully') || '批量删除成功')
        selectedRows.value = []
        selectedRowKeys.value = []
        await handleSearch()
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error(error.message || t('mcpServerManagement.batchDeleteFailed') || '批量删除失败')
        }
      }
    }

    // 表格选择变化
    const handleSelectionChange = (selection: McpServer[]) => {
      selectedRows.value = selection
      selectedRowKeys.value = selection.map(row => row.id)
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

    // 渲染操作列
    const renderOperation = (row: McpServer) => (
      <div class="flex items-center gap-2">
        <ElButton
          type="primary"
          link
          size="small"
          onClick={() => handleViewDetail(row)}
        >
          {t('mcpServerManagement.details') || '详情'}
        </ElButton>
        <span style="margin: 0 4px;">|</span>
        <ElButton
          type="primary"
          link
          size="small"
          onClick={() => handleEdit(row)}
        >
          {t('mcpServerManagement.edit') || '编辑'}
        </ElButton>
        <span style="margin: 0 4px;">|</span>
        <ElButton
          type="danger"
          link
          size="small"
          onClick={() => handleDelete(row)}
        >
          {t('mcpServerManagement.delete') || '删除'}
        </ElButton>
        <span style="margin: 0 4px;">|</span>
        <ElButton
          type="primary"
          link
          size="small"
          onClick={() => handleToggleEnabled(row)}
        >
          {row.enabled ? (t('mcpServerManagement.offline') || '禁用') : (t('mcpServerManagement.online') || '启用')}
        </ElButton>
      </div>
    )

    // 渲染能力标签
    const renderCapability = (row: McpServer) => {
      const capabilities = row.capability || []
      if (capabilities.length === 0) {
        return '--'
      }
      return (
        <div class="flex items-center gap-2 flex-wrap">
          {capabilities.map((cap, index) => (
            <ElTag key={index} type="primary" size="small">
              {cap}
            </ElTag>
          ))}
        </div>
      )
    }

    // 渲染类型
    const renderType = (row: McpServer) => {
      const protocol = (row as any).protocol
      const frontProtocol = (row as any).frontProtocol || row.type || '--'
      
      if (protocol === 'http' || protocol === 'https') {
        return (
          <div class="flex items-center gap-2">
            <span>{frontProtocol}</span>
            <ElTag type="success" size="small">
              {t('mcpServerManagement.convertService') || '存量转化'}
            </ElTag>
          </div>
        )
      }
      return frontProtocol
    }

    // 渲染版本
    const renderVersion = (row: McpServer) => {
      const versionDetail = (row as any).versionDetail
      return versionDetail?.version || '--'
    }

    // 初始化
    onMounted(async () => {
      if (currentNamespace.value) {
        aiStore.mcpSearchParams.namespaceId = currentNamespace.value
      }
      await handleSearch()
    })

    return () => (
      <div class="p-6">
        {/* 页面标题 */}
        <PageTitle
          title={t('mcpServerManagement.mcpManagement8') || 'MCP管理'}
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
                {t('mcpServerManagement.addNewMcpServer') || '创建 MCP Server'}
              </ElButton>
            </ElFormItem>
            <ElFormItem>
              <ElButton onClick={handleImport}>
                <ElIcon><Upload /></ElIcon>
                {t('mcpServerManagement.importMcpServer') || '导入 MCP Server'}
              </ElButton>
            </ElFormItem>
            <ElFormItem label={t('mcpServerManagement.mcpServerName') || 'Server Name'}>
              <ElInput
                modelValue={searchForm.mcpName}
                onUpdate:modelValue={(val: string) => (searchForm.mcpName = val)}
                placeholder={t('mcpServerManagement.mcpServerName') || '请输入 MCP 服务名'}
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
                {t('mcpServerManagement.search') || '查询'}
              </ElButton>
            </ElFormItem>
          </ElForm>
        </ElCard>

        {/* MCP 列表表格 */}
        <ElCard>
          <div class="mb-4">
            <ElButton
              type="danger"
              disabled={selectedRows.value.length === 0}
              onClick={handleBatchDelete}
            >
              <ElIcon><Delete /></ElIcon>
              {t('mcpServerManagement.delete') || '删除'}
            </ElButton>
          </div>

          <ElTable
            {...{
              loading: aiStore.mcpLoading,
              data: aiStore.mcpList,
              onSelectionChange: handleSelectionChange,
              stripe: true,
            }}
            style="width: 100%"
          >
            <ElTableColumn type="selection" width="55" />
            <ElTableColumn
              prop="name"
              label="MCP Server"
              minWidth="200"
              showOverflowTooltip
            />
            <ElTableColumn
              label={t('mcpServerManagement.capability') || '支持能力'}
              minWidth="150"
              v-slots={{
                default: ({ row }: { row: McpServer }) => renderCapability(row),
              }}
            />
            <ElTableColumn
              label={t('mcpServerManagement.mcpServerType') || '类型'}
              minWidth="120"
              v-slots={{
                default: ({ row }: { row: McpServer }) => renderType(row),
              }}
            />
            <ElTableColumn
              label={t('mcpServerManagement.mcpServerVersion') || '版本'}
              minWidth="100"
              v-slots={{
                default: ({ row }: { row: McpServer }) => renderVersion(row),
              }}
            />
            <ElTableColumn
              label={t('mcpServerManagement.operation') || '操作'}
              minWidth="200"
              fixed="right"
              v-slots={{
                default: ({ row }: { row: McpServer }) => renderOperation(row),
              }}
            />
          </ElTable>

          {/* 分页 */}
          {aiStore.mcpTotal > 0 && (
            <div class="mt-4 flex justify-end">
              <ElPagination
                currentPage={currentPage.value}
                pageSize={pageSize.value}
                total={aiStore.mcpTotal}
                pageSizes={[10, 20, 50, 100]}
                onUpdate:currentPage={handlePageChange}
                onUpdate:pageSize={handlePageSizeChange}
                v-slots={{
                  total: () => <TotalRender total={aiStore.mcpTotal} />,
                }}
              />
            </div>
          )}
        </ElCard>

        {/* 导入 MCP Server 对话框 */}
        <ImportMcpDialog
          modelValue={importDialogVisible.value}
          onUpdate:modelValue={(val: boolean) => (importDialogVisible.value = val)}
          onSuccess={handleImportSuccess}
        />
      </div>
    )
  },
})
