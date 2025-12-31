/**
 * ImportMcpDialog 组件
 * 导入 MCP 服务器对话框
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/AI/McpManagement/McpManagement.js
 */

import { defineComponent, ref, reactive, computed } from 'vue'
import {
  ElDialog,
  ElTabs,
  ElTabPane,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElUpload,
  ElMessage,
  ElMessageBox,
  ElRadioGroup,
  ElRadio,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { Upload, Download } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'
import MonacoEditor from '@/components/MonacoEditor/index'
import { useAiStore } from '@/stores/ai'
import type { UploadFile, UploadFiles } from 'element-plus'
import type { FormInstance } from 'element-plus'

export interface ImportResult {
  name: string
  status: 'success' | 'failed'
  reason?: string
}

export default defineComponent({
  name: 'ImportMcpDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'success'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const aiStore = useAiStore()

    const formRef = ref<FormInstance>()
    const activeTab = ref('url')
    const loading = ref(false)
    const validating = ref(false)
    const importResults = ref<ImportResult[]>([])

    // URL 导入表单
    const urlForm = reactive({
      url: '',
    })

    // JSON 导入表单
    const jsonForm = reactive({
      content: '',
    })

    // 文件上传
    const fileList = ref<UploadFile[]>([])
    const uploadRef = ref()

    // 导入选项
    const importOptions = reactive({
      overrideExisting: false,
    })

    // 对话框显示状态
    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (val) => emit('update:modelValue', val),
    })

    // 文件上传前处理
    const beforeUpload = (file: File) => {
      const isZip = file.type === 'application/zip' || file.name.endsWith('.zip')
      if (!isZip) {
        ElMessage.error(t('mcpServerManagement.importFileMustBeZip') || '上传文件必须是 ZIP 格式')
        return false
      }
      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        ElMessage.error(t('mcpServerManagement.importFileSizeLimit') || '上传文件大小不能超过 10MB')
        return false
      }
      return true
    }

    // 文件上传成功处理
    const handleFileSuccess = async (response: any, file: UploadFile) => {
      try {
        // 假设后端返回解析后的 JSON 数据
        if (response && response.code === 0 && response.data) {
          jsonForm.content = JSON.stringify(response.data, null, 2)
          ElMessage.success(t('mcpServerManagement.importFileParsedSuccess') || '文件解析成功')
        } else {
          ElMessage.error(response?.message || t('mcpServerManagement.importFileParseFailed') || '文件解析失败')
        }
      } catch (error: any) {
        ElMessage.error(error.message || t('mcpServerManagement.importFileParseFailed') || '文件解析失败')
      }
    }

    // 文件上传失败处理
    const handleFileError = () => {
      ElMessage.error(t('mcpServerManagement.importFileUploadFailed') || '文件上传失败')
    }

    // 从 URL 加载 JSON
    const loadFromUrl = async () => {
      if (!urlForm.url.trim()) {
        ElMessage.warning(t('mcpServerManagement.pleaseEnterImportUrl') || '请输入导入 URL')
        return
      }

      loading.value = true
      try {
        const response = await fetch(urlForm.url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        jsonForm.content = JSON.stringify(data, null, 2)
        ElMessage.success(t('mcpServerManagement.importUrlLoadedSuccess') || 'URL 加载成功')
      } catch (error: any) {
        ElMessage.error(error.message || t('mcpServerManagement.importUrlLoadFailed') || 'URL 加载失败')
      } finally {
        loading.value = false
      }
    }

    // 校验导入数据
    const validateImport = async () => {
      let content = ''

      if (activeTab.value === 'url') {
        if (!urlForm.url.trim()) {
          ElMessage.warning(t('mcpServerManagement.pleaseEnterImportUrl') || '请输入导入 URL')
          return
        }
        await loadFromUrl()
        content = jsonForm.content
      } else if (activeTab.value === 'file') {
        if (fileList.value.length === 0) {
          ElMessage.warning(t('mcpServerManagement.pleaseUploadFile') || '请上传文件')
          return
        }
        content = jsonForm.content
      } else {
        content = jsonForm.content
      }

      if (!content.trim()) {
        ElMessage.warning(t('mcpServerManagement.pleaseEnterImportData') || '请输入导入数据')
        return
      }

      validating.value = true
      try {
        // 验证 JSON 格式
        const data = JSON.parse(content)

        // 验证数据结构（应该包含 mcpServers 或 servers 字段）
        if (!data.mcpServers && !data.servers && !Array.isArray(data)) {
          ElMessage.error(t('mcpServerManagement.invalidImportFormat') || '无效的导入格式')
          return
        }

        // 解析 MCP 服务器列表
        const servers = data.mcpServers
          ? Object.entries(data.mcpServers).map(([name, config]: [string, any]) => ({
              name,
              ...config,
            }))
          : data.servers || (Array.isArray(data) ? data : [])

        if (!Array.isArray(servers) || servers.length === 0) {
          ElMessage.error(t('mcpServerManagement.noValidMcpServers') || '未找到有效的 MCP 服务器')
          return
        }

        // 生成校验结果
        importResults.value = servers.map((server: any) => ({
          name: server.name || server.id || '未知',
          status: 'success' as const,
        }))

        ElMessage.success(
          t('mcpServerManagement.validateSuccess', { count: servers.length }) ||
            `校验成功，找到 ${servers.length} 个 MCP 服务器`
        )
      } catch (error: any) {
        ElMessage.error(
          error.message || t('mcpServerManagement.validateFailed') || '校验失败：' + error.message
        )
      } finally {
        validating.value = false
      }
    }

    // 执行导入
    const executeImport = async () => {
      if (importResults.value.length === 0) {
        ElMessage.warning(t('mcpServerManagement.pleaseValidateFirst') || '请先校验导入数据')
        return
      }

      loading.value = true
      try {
        let content = ''

        if (activeTab.value === 'url') {
          await loadFromUrl()
          content = jsonForm.content
        } else if (activeTab.value === 'file') {
          content = jsonForm.content
        } else {
          content = jsonForm.content
        }

        const data = JSON.parse(content)
        const servers = data.mcpServers
          ? Object.entries(data.mcpServers).map(([name, config]: [string, any]) => ({
              name,
              ...config,
            }))
          : data.servers || (Array.isArray(data) ? data : [])

        const results: ImportResult[] = []
        const successCount = ref(0)
        const failCount = ref(0)

        // 逐个导入 MCP 服务器
        for (const server of servers) {
          try {
            // 构建 serverSpecification
            const serverSpec = {
              protocol: server.protocol || 'stdio',
              frontProtocol: server.frontProtocol || server.protocol || 'stdio',
              name: server.name || server.id,
              description: server.description || `${server.name || server.id} v${server.version || '1.0.0'}`,
              versionDetail: {
                version: server.version || '1.0.0',
              },
              enabled: true,
              localServerConfig: server.localServerConfig || server,
            }

            const params = {
              serverSpecification: JSON.stringify(serverSpec, null, 2),
              toolSpecification: JSON.stringify(server.toolSpecification || {}, null, 2),
              endpointSpecification: server.endpointSpecification
                ? JSON.stringify(server.endpointSpecification, null, 2)
                : undefined,
            }

            // 检查是否已存在（由后端 API 处理）
            // 如果 overrideExisting 为 false，后端会自动跳过已存在的服务器

            await aiStore.addMcp(params)
            results.push({
              name: server.name || server.id || '未知',
              status: 'success',
            })
            successCount.value++
          } catch (error: any) {
            results.push({
              name: server.name || server.id || '未知',
              status: 'failed',
              reason: error.message || '导入失败',
            })
            failCount.value++
          }
        }

        importResults.value = results

        ElMessage.success(
          t('mcpServerManagement.importMcpSuccess', { count: successCount.value }) ||
            `导入成功 ${successCount.value} 个，失败 ${failCount.value} 个`
        )

        if (successCount.value > 0) {
          emit('success')
          dialogVisible.value = false
        }
      } catch (error: any) {
        ElMessage.error(error.message || t('mcpServerManagement.importFail') || '导入失败')
      } finally {
        loading.value = false
      }
    }

    // 重置表单
    const resetForm = () => {
      urlForm.url = ''
      jsonForm.content = ''
      fileList.value = []
      importResults.value = []
      importOptions.overrideExisting = false
      activeTab.value = 'url'
    }

    // 关闭对话框
    const handleClose = () => {
      resetForm()
      dialogVisible.value = false
    }

    return () => (
      <ElDialog
        modelValue={dialogVisible.value}
        onUpdate:modelValue={(val: boolean) => (dialogVisible.value = val)}
        title={t('mcpServerManagement.importMcpServer') || '导入 MCP Server'}
        width="900px"
        onClose={handleClose}
      >
        <ElTabs v-model={activeTab.value}>
          {/* URL 导入 */}
          <ElTabPane label={t('mcpServerManagement.importUrl') || 'URL'} name="url">
            <ElForm ref={formRef} model={urlForm} labelWidth="100px">
              <ElFormItem label={t('mcpServerManagement.importUrl') || 'URL'}>
                <div class="flex gap-2">
                  <ElInput
                    v-model={urlForm.url}
                    placeholder={t('mcpServerManagement.importUrlPlaceholder') || '请输入 JSON 文件的 URL'}
                    style="flex: 1"
                  />
                  <ElButton type="primary" loading={loading.value} onClick={loadFromUrl}>
                    {t('mcpServerManagement.load') || '加载'}
                  </ElButton>
                </div>
              </ElFormItem>
            </ElForm>
          </ElTabPane>

          {/* 文件导入 */}
          <ElTabPane label={t('mcpServerManagement.importFile') || '文件'} name="file">
            <ElUpload
              ref={uploadRef}
              v-model:file-list={fileList.value}
              action="/api/upload/mcp"
              accept=".zip"
              beforeUpload={beforeUpload}
              onSuccess={handleFileSuccess}
              onError={handleFileError}
              limit={1}
            >
              <ElButton type="primary">
                <ElIcon><Upload /></ElIcon>
                {t('mcpServerManagement.uploadFile') || '上传文件'}
              </ElButton>
              <template #tip>
                <div class="text-sm text-gray-500 mt-2">
                  {t('mcpServerManagement.importFileTip') || '支持 ZIP 格式，文件大小不超过 10MB'}
                </div>
              </template>
            </ElUpload>
          </ElTabPane>

          {/* JSON 内容导入 */}
          <ElTabPane label={t('mcpServerManagement.importJson') || 'JSON 内容'} name="json">
            <MonacoEditor
              modelValue={jsonForm.content}
              onUpdate:modelValue={(val: string) => (jsonForm.content = val)}
              language="json"
              height="400px"
            />
          </ElTabPane>
        </ElTabs>

        {/* 导入选项 */}
        <div class="mt-4 mb-4">
          <ElFormItem label={t('mcpServerManagement.importOptions') || '导入选项'}>
            <ElRadioGroup v-model={importOptions.overrideExisting}>
              <ElRadio label={false}>
                {t('mcpServerManagement.skipExisting') || '跳过已存在的服务器'}
              </ElRadio>
              <ElRadio label={true}>
                {t('mcpServerManagement.overrideExisting') || '覆盖已存在的服务器'}
              </ElRadio>
            </ElRadioGroup>
          </ElFormItem>
        </div>

        {/* 校验结果 */}
        {importResults.value.length > 0 && (
          <div class="mb-4">
            <h4 class="mb-2 font-semibold">{t('mcpServerManagement.validateResult') || '校验结果'}:</h4>
            <ElTable data={importResults.value} stripe style="width: 100%">
              <ElTableColumn prop="name" label={t('mcpServerManagement.mcpServerName') || 'MCP 服务名'} />
              <ElTableColumn label={t('mcpServerManagement.status') || '状态'}>
                {({ row }: { row: ImportResult }) => (
                  <ElTag type={row.status === 'success' ? 'success' : 'danger'}>
                    {row.status === 'success'
                      ? t('mcpServerManagement.valid') || '有效'
                      : t('mcpServerManagement.invalid') || '无效'}
                  </ElTag>
                )}
              </ElTableColumn>
              <ElTableColumn prop="reason" label={t('mcpServerManagement.reason') || '原因'} />
            </ElTable>
          </div>
        )}

        {/* 操作按钮 */}
        <template #footer>
          <div class="flex justify-end gap-2">
            <ElButton onClick={handleClose}>{t('common.cancel') || '取消'}</ElButton>
            <ElButton type="primary" loading={validating.value} onClick={validateImport}>
              {t('mcpServerManagement.validateImport') || '校验'}
            </ElButton>
            <ElButton
              type="success"
              loading={loading.value}
              disabled={importResults.value.length === 0}
              onClick={executeImport}
            >
              {t('mcpServerManagement.executeImport') || '执行导入'}
            </ElButton>
          </div>
        </template>
      </ElDialog>
    )
  },
})

