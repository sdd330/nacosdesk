/**
 * McpDetail 页面
 * MCP 服务器详情页面
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/AI/McpDetail/McpDetail.js
 */

import { defineComponent, ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ElCard,
  ElButton,
  ElTable,
  ElTableColumn,
  ElMessage,
  ElMessageBox,
  ElTag,
  ElIcon,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSwitch,
  ElCollapse,
  ElCollapseItem,
} from 'element-plus'
import { ArrowLeft, Plus, Edit, Delete, View } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'
import MonacoEditor from '@/components/MonacoEditor/index'
import PageTitle from '@/components/PageTitle/index'
import { urlParams } from '@/utils/urlParams'
import { useAiStore } from '@/stores/ai'
import type { McpServer, McpTool } from '@/api/ai'

export default defineComponent({
  name: 'McpDetail',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()
    const aiStore = useAiStore()

    const loading = ref(false)
    const mcpDetail = ref<McpServer | null>(null)
    const toolList = ref<McpTool[]>([])
    const currentNamespace = ref(urlParams.getParams('namespace') || 'public')

    // 工具对话框
    const toolDialogVisible = ref(false)
    const toolDialogMode = ref<'create' | 'edit'>('create')
    const currentTool = ref<McpTool | null>(null)
    const toolFormRef = ref()
    const toolFormData = reactive({
      name: '',
      description: '',
      inputSchema: '',
      outputSchema: '',
    })

    // 工具详情对话框
    const toolDetailDialogVisible = ref(false)
    const toolDetailData = ref<McpTool | null>(null)

    // 获取 MCP 详情
    const fetchMcpDetail = async () => {
      const mcpId = route.query.id as string
      const version = route.query.version as string || ''

      if (!mcpId) {
        ElMessage.error(t('mcpDetail.mcpIdRequired') || 'MCP ID 不能为空')
        router.back()
        return
      }

      loading.value = true
      try {
        const detail = await aiStore.fetchMcpDetail(mcpId, version)
        if (detail) {
          mcpDetail.value = detail

          // 获取工具列表
          const tools = await aiStore.fetchMcpTools(mcpId)
          toolList.value = tools || []
        }
      } catch (error: any) {
        ElMessage.error(error.message || '获取 MCP 详情失败')
      } finally {
        loading.value = false
      }
    }

    // 打开工具对话框
    const openToolDialog = (mode: 'create' | 'edit', tool?: McpTool) => {
      toolDialogMode.value = mode
      currentTool.value = tool || null

      if (mode === 'edit' && tool) {
        toolFormData.name = tool.name || ''
        toolFormData.description = tool.description || ''
        toolFormData.inputSchema = tool.inputSchema
          ? JSON.stringify(tool.inputSchema, null, 2)
          : ''
        toolFormData.outputSchema = ''
      } else {
        toolFormData.name = ''
        toolFormData.description = ''
        toolFormData.inputSchema = ''
        toolFormData.outputSchema = ''
      }

      toolDialogVisible.value = true
    }

    // 保存工具
    const handleSaveTool = async () => {
      if (!toolFormRef.value) return

      await toolFormRef.value.validate(async (valid) => {
        if (!valid) return

        try {
          let inputSchema: any = {}
          if (toolFormData.inputSchema) {
            try {
              inputSchema = JSON.parse(toolFormData.inputSchema)
            } catch (error) {
              ElMessage.error(t('mcpDetail.toolInputSchemaParseError') || '入参配置不是合法 JSON，请检查')
              return
            }
          }

          const toolData: McpTool = {
            name: toolFormData.name,
            description: toolFormData.description,
            inputSchema,
          }

          if (toolDialogMode.value === 'edit' && currentTool.value) {
            // 更新工具 - 先删除旧工具，再添加新工具
            await aiStore.removeMcpTool(mcpDetail.value!.id, currentTool.value.name)
            await aiStore.addMcpToolItem(mcpDetail.value!.id, toolData)
            ElMessage.success(t('mcpDetail.editToolSuccess') || '编辑 Tool 成功')
          } else {
            // 创建工具
            await aiStore.addMcpToolItem(mcpDetail.value!.id, toolData)
            ElMessage.success(t('mcpDetail.createToolSuccess') || '创建 Tool 成功')
          }

          toolDialogVisible.value = false
          await fetchMcpDetail()
        } catch (error: any) {
          ElMessage.error(error.message || (toolDialogMode.value === 'edit' ? '编辑失败' : '创建失败'))
        }
      })
    }

    // 删除工具
    const handleDeleteTool = async (tool: McpTool) => {
      try {
        await ElMessageBox.confirm(
          t('mcpDetail.deleteToolContent') || '确定要删除 Tool 吗？',
          t('mcpDetail.deleteToolTitle') || '删除 Tool',
          {
            confirmButtonText: t('common.confirm') || '确定',
            cancelButtonText: t('common.cancel') || '取消',
            type: 'warning',
          }
        )

        await aiStore.removeMcpTool(mcpDetail.value!.id, tool.name)
        ElMessage.success(t('mcpDetail.deleteToolSuccess') || '删除 Tool 成功')
        await fetchMcpDetail()
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error(error.message || t('mcpDetail.deleteToolFailed') || '删除 Tool 失败')
        }
      }
    }

    // 查看工具详情
    const handleViewToolDetail = (tool: McpTool) => {
      toolDetailData.value = tool
      toolDetailDialogVisible.value = true
    }

    // 返回列表
    const handleBack = () => {
      router.back()
    }

    // 编辑 MCP
    const handleEdit = () => {
      router.push({
        name: 'NewMcpServer',
        query: {
          id: mcpDetail.value?.id,
          namespace: currentNamespace.value,
          mode: 'edit',
        },
      })
    }

    // 渲染基本信息
    const renderBasicInfo = () => {
      if (!mcpDetail.value) return null

      const detail = mcpDetail.value as any
      const serverSpec = detail.serverSpecification
        ? JSON.parse(detail.serverSpecification)
        : {}
      const toolSpec = detail.toolSpecification
        ? JSON.parse(detail.toolSpecification)
        : {}

      return (
        <ElCard class="mb-4">
          <div class="mb-4 flex justify-between items-center">
            <h3 class="text-lg font-bold">{t('mcpDetail.basicInformation') || '基本信息'}</h3>
            <ElButton type="primary" onClick={handleEdit}>
              <ElIcon><Edit /></ElIcon>
              {t('common.edit') || '编辑'}
            </ElButton>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-gray-500">{t('mcpDetail.serverName') || '名称'}:</span>
              <span class="ml-2">{serverSpec.name || detail.name || '--'}</span>
            </div>
            <div>
              <span class="text-gray-500">{t('mcpDetail.serverDescription') || '描述'}:</span>
              <span class="ml-2">{serverSpec.description || detail.description || '--'}</span>
            </div>
            <div>
              <span class="text-gray-500">{t('mcpDetail.version') || '版本'}:</span>
              <span class="ml-2">{serverSpec.versionDetail?.version || detail.version || '--'}</span>
            </div>
            <div>
              <span class="text-gray-500">{t('mcpDetail.serverType') || '类型'}:</span>
              <span class="ml-2">{serverSpec.protocol || detail.type || '--'}</span>
            </div>
            <div>
              <span class="text-gray-500">{t('mcpDetail.backendProtocol') || '后端协议'}:</span>
              <span class="ml-2">{serverSpec.frontProtocol || '--'}</span>
            </div>
            <div>
              <span class="text-gray-500">{t('mcpDetail.exportPath') || '访问路径'}:</span>
              <span class="ml-2">{serverSpec.remoteServerConfig?.exportPath || '--'}</span>
            </div>
          </div>

          <div class="mt-4">
            <h4 class="mb-2 font-semibold">{t('mcpDetail.serverSpecification') || '服务器规范'}:</h4>
            <MonacoEditor
              value={detail.serverSpecification || '{}'}
              language="json"
              height="300px"
              readOnly
            />
          </div>
        </ElCard>
      )
    }

    // 渲染工具列表
    const renderToolList = () => {
      return (
        <ElCard>
          <div class="mb-4 flex justify-between items-center">
            <h3 class="text-lg font-bold">{t('mcpDetail.toolMeta') || 'Tool 元数据'}</h3>
            <ElButton type="primary" onClick={() => openToolDialog('create')}>
              <ElIcon><Plus /></ElIcon>
              {t('mcpDetail.newMcpTool') || '添加'}
            </ElButton>
          </div>

          <ElTable
            data={toolList.value}
            loading={loading.value}
            stripe
            style="width: 100%"
          >
            <ElTableColumn
              prop="name"
              label={t('mcpDetail.toolName') || '名称'}
              minWidth="150"
              showOverflowTooltip
            />
            <ElTableColumn
              prop="description"
              label={t('mcpDetail.toolDescription') || '描述'}
              minWidth="200"
              showOverflowTooltip
            />
            <ElTableColumn
              label={t('mcpDetail.toolOnline') || '是否启用'}
              width="100"
            >
              {({ row }: { row: McpTool }) => (
                <ElTag type={(row as any).enabled !== false ? 'success' : 'info'}>
                  {(row as any).enabled !== false
                    ? t('mcpDetail.online') || '启用'
                    : t('mcpDetail.offline') || '禁用'}
                </ElTag>
              )}
            </ElTableColumn>
            <ElTableColumn
              label={t('mcpDetail.toolOperation') || '操作'}
              width="250"
              fixed="right"
            >
              {({ row }: { row: McpTool }) => (
                <div class="flex items-center gap-2">
                  <ElButton
                    type="primary"
                    link
                    size="small"
                    onClick={() => handleViewToolDetail(row)}
                  >
                    <ElIcon><View /></ElIcon>
                    {t('mcpDetail.toolDetail') || '详情'}
                  </ElButton>
                  <ElButton
                    type="primary"
                    link
                    size="small"
                    onClick={() => openToolDialog('edit', row)}
                  >
                    <ElIcon><Edit /></ElIcon>
                    {t('common.edit') || '编辑'}
                  </ElButton>
                  <ElButton
                    type="danger"
                    link
                    size="small"
                    onClick={() => handleDeleteTool(row)}
                  >
                    <ElIcon><Delete /></ElIcon>
                    {t('common.delete') || '删除'}
                  </ElButton>
                </div>
              )}
            </ElTableColumn>
          </ElTable>
        </ElCard>
      )
    }

    onMounted(() => {
      fetchMcpDetail()
    })

    return () => (
      <div class="p-6">
        <div class="mb-4 flex items-center">
          <ElButton
            icon={<ElIcon><ArrowLeft /></ElIcon>}
            onClick={handleBack}
            class="mr-4"
          >
            {t('common.back') || '返回'}
          </ElButton>
          <PageTitle
            title={t('mcpDetail.mcpServerDetail') || 'MCP Server 详情'}
            desc={mcpDetail.value?.description}
            namespaceId={currentNamespace.value}
            namespaceName={currentNamespace.value}
            nameSpace={true}
          />
        </div>

        {renderBasicInfo()}
        {renderToolList()}

        {/* 工具对话框 */}
        <ElDialog
          modelValue={toolDialogVisible.value}
          onUpdate:modelValue={(val: boolean) => (toolDialogVisible.value = val)}
          title={toolDialogMode.value === 'edit' ? (t('mcpDetail.editTool') || '编辑 Tool') : (t('mcpDetail.newMcpTool') || '添加 Tool')}
          width="800px"
          v-slots={{
            footer: () => (
              <div class="flex justify-end gap-2">
                <ElButton onClick={() => (toolDialogVisible.value = false)}>
                  {t('common.cancel') || '取消'}
                </ElButton>
                <ElButton type="primary" onClick={handleSaveTool}>
                  {t('common.confirm') || '确定'}
                </ElButton>
              </div>
            ),
          }}
        >
          <ElForm
            ref={toolFormRef}
            model={toolFormData}
            labelWidth="120px"
            rules={{
              name: [
                { required: true, message: t('mcpDetail.toolNameRequired') || 'Tool 名称不能为空', trigger: 'blur' },
              ],
              description: [
                { required: true, message: t('mcpDetail.toolDescriptionRequired') || 'Tool 描述不能为空', trigger: 'blur' },
              ],
              inputSchema: [
                { required: true, message: t('mcpDetail.toolInputSchemaRequired') || 'Tool 参数描述不能为空', trigger: 'blur' },
              ],
            }}
          >
            <ElFormItem label={t('mcpDetail.toolName') || '名称'} prop="name">
              <ElInput
                v-model={toolFormData.name}
                placeholder={t('mcpDetail.placeInput') || '请输入'}
                disabled={toolDialogMode.value === 'edit'}
              />
            </ElFormItem>
            <ElFormItem label={t('mcpDetail.toolDescription') || '描述'} prop="description">
              <ElInput
                v-model={toolFormData.description}
                type="textarea"
                rows={3}
                placeholder={t('mcpDetail.placeInput') || '请输入'}
              />
            </ElFormItem>
            <ElFormItem label={t('mcpDetail.toolInputSchema') || 'Tool 入参描述'} prop="inputSchema">
              <MonacoEditor
                value={toolFormData.inputSchema}
                onUpdate:value={(val: string) => (toolFormData.inputSchema = val)}
                language="json"
                height="300px"
              />
            </ElFormItem>
            <ElFormItem label={t('mcpDetail.toolOutputSchema') || 'Tool 出参描述'} prop="outputSchema">
              <MonacoEditor
                value={toolFormData.outputSchema}
                onUpdate:value={(val: string) => (toolFormData.outputSchema = val)}
                language="json"
                height="200px"
              />
              <div class="text-sm text-gray-500 mt-1">
                {t('mcpDetail.outputSchemaHelp') || '可选：填写 JSON Schema，用于描述 Tool 的输出结构'}
              </div>
            </ElFormItem>
          </ElForm>
        </ElDialog>

        {/* 工具详情对话框 */}
        <ElDialog
          modelValue={toolDetailDialogVisible.value}
          onUpdate:modelValue={(val: boolean) => (toolDetailDialogVisible.value = val)}
          title={t('mcpDetail.toolDetail') || 'Tool 详情'}
          width="800px"
          v-slots={{
            footer: () => (
              <div class="flex justify-end">
                <ElButton onClick={() => (toolDetailDialogVisible.value = false)}>
                  {t('mcpDetail.close') || '关闭'}
                </ElButton>
              </div>
            ),
          }}
        >
          {toolDetailData.value && (
            <div>
              <div class="mb-4">
                <span class="text-gray-500">{t('mcpDetail.toolName') || '名称'}:</span>
                <span class="ml-2 font-semibold">{toolDetailData.value.name}</span>
              </div>
              <div class="mb-4">
                <span class="text-gray-500">{t('mcpDetail.toolDescription') || '描述'}:</span>
                <span class="ml-2">{toolDetailData.value.description || '--'}</span>
              </div>
              <div class="mb-4">
                <h4 class="mb-2 font-semibold">{t('mcpDetail.toolInputSchema') || 'Tool 入参描述'}:</h4>
                <MonacoEditor
                  value={JSON.stringify(toolDetailData.value.inputSchema || {}, null, 2)}
                  language="json"
                  height="300px"
                  readOnly
                />
              </div>
            </div>
          )}
        </ElDialog>
      </div>
    )
  },
})
