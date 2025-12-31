/**
 * NewMcpServer 页面
 * 新建/编辑 MCP 服务器
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/AI/NewMcpServer/NewMcpServer.js
 */

import { defineComponent, ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElRadioGroup,
  ElRadio,
  ElButton,
  ElMessage,
  ElSwitch,
  ElCollapse,
  ElCollapseItem,
  ElIcon,
} from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'
import MonacoEditor from '@/components/MonacoEditor/index'
import { urlParams } from '@/utils/urlParams'
import { useAiStore } from '@/stores/ai'
import { getServiceList } from '@/api/service'
import type { FormInstance, FormRules } from 'element-plus'

const localServerConfigDesc = `{
  "mcpServers": {
    "amap-mcp-server": {
      "description": "高德地图服务",
      "command": "npx",
      "args": [
        "-y",
        "@amap/amap-mcp-server"
      ],
      "env": {
        "AMAP_MAPS_API_KEY": "<API_KEY>"
      }
    }
  }
}`

export default defineComponent({
  name: 'NewMcpServer',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()
    const aiStore = useAiStore()

    const formRef = ref<FormInstance>()
    const monacoEditorRef = ref<InstanceType<typeof MonacoEditor>>()
    const loading = ref(false)
    const isEdit = computed(() => route.query.mode === 'edit' && route.query.id)
    const currentNamespace = ref(urlParams.getParams('namespace') || 'public')

    // 表单数据
    const formData = reactive({
      serverName: '',
      description: '',
      version: '1.0.0',
      frontProtocol: 'stdio',
      localServerConfig: localServerConfigDesc,
      mcpServerEndpoint: '',
      useExistService: true,
      service: '',
      namespace: '',
      address: '',
      port: '',
      exportPath: '/',
      restToMcpSwitch: true,
      serviceTransportProtocol: 'http',
      newServiceTransportProtocol: 'http',
    })

    // 服务列表
    const serviceList = ref<Array<{ label: string; value: string }>>([])
    const advancedConfigCollapsed = ref(true)

    // 表单验证规则
    const rules = reactive<FormRules>({
      serverName: [
        { required: true, message: t('mcpServerManagement.serverNameCannotBeEmpty') || '服务器名称不能为空', trigger: 'blur' },
        {
          validator: (_rule, value, callback) => {
            const chartReg = /^[a-zA-Z0-9_/\-\.]+$/
            if (!chartReg.test(value)) {
              callback(new Error(t('mcpServerManagement.doNotEnter') || '只能包含字母、数字、下划线、斜杠、连字符和点'))
            } else {
              callback()
            }
          },
          trigger: 'blur',
        },
      ],
      version: [
        { required: true, message: t('mcpServerManagement.versionCannotBeEmpty') || '版本不能为空', trigger: 'blur' },
      ],
      frontProtocol: [
        { required: true, message: t('mcpServerManagement.protocolCannotBeEmpty') || '协议不能为空', trigger: 'blur' },
      ],
    })

    // 获取服务列表
    const fetchServiceList = async (namespaceId: string) => {
      try {
        const res = await getServiceList({
          namespaceId,
          pageNo: 1,
          pageSize: 1000,
        })
        if (res.code === 0 && res.data) {
          const services = res.data.pageItems || []
          serviceList.value = services.map(s => ({
            label: `${s.groupName}@@${s.name}`,
            value: `${s.groupName}@@${s.name}`,
          }))
        }
      } catch (error: any) {
        console.error('获取服务列表失败:', error)
      }
    }

    // 初始化编辑数据
    const initEditedData = async () => {
      if (!isEdit.value) return

      const mcpId = route.query.id as string
      const version = route.query.version as string || ''

      try {
        const mcpDetail = await aiStore.fetchMcpDetail(mcpId, version)
        if (!mcpDetail) return

        formData.serverName = mcpDetail.name || ''
        formData.description = mcpDetail.description || ''
        formData.version = (mcpDetail as any).versionDetail?.version || '1.0.0'
        formData.frontProtocol = mcpDetail.frontProtocol || 'stdio'
        formData.protocol = mcpDetail.protocol || 'stdio'

        if (mcpDetail.localServerConfig) {
          formData.localServerConfig = JSON.stringify(mcpDetail.localServerConfig, null, 2)
        }

        if ((mcpDetail as any).remoteServerConfig) {
          const remoteConfig = (mcpDetail as any).remoteServerConfig
          formData.exportPath = remoteConfig.exportPath || '/'
          formData.useExistService = !!remoteConfig.serviceRef?.serviceName

          if (remoteConfig.serviceRef) {
            formData.namespace = remoteConfig.serviceRef.namespaceId || ''
            formData.service = `${remoteConfig.serviceRef.groupName}@@${remoteConfig.serviceRef.serviceName}`
            formData.serviceTransportProtocol = remoteConfig.serviceRef.transportProtocol || 'http'
          }

          if (remoteConfig.address && remoteConfig.port) {
            formData.address = remoteConfig.address
            formData.port = remoteConfig.port
            formData.newServiceTransportProtocol = remoteConfig.transportProtocol || 'http'
          }
        }

        if (mcpDetail.protocol === 'http' || mcpDetail.protocol === 'https') {
          formData.restToMcpSwitch = true
        }
      } catch (error: any) {
        ElMessage.error(error.message || '获取 MCP 服务器详情失败')
      }
    }

    // 协议变化处理
    const handleProtocolChange = (value: string) => {
      if (value === 'stdio') {
        formData.restToMcpSwitch = false
      } else {
        formData.restToMcpSwitch = true
      }
    }

    // 提交表单
    const handleSubmit = async (isPublish: boolean = false) => {
      if (!formRef.value) return

      await formRef.value.validate(async (valid) => {
        if (!valid) {
          ElMessage.warning(t('mcpServerManagement.formValidationFailed') || '表单验证失败')
          return
        }

        loading.value = true
        try {
          // 构建 serverSpecification
          let protocol = formData.frontProtocol
          if (formData.frontProtocol !== 'stdio') {
            if (formData.restToMcpSwitch) {
              protocol = formData.useExistService
                ? formData.serviceTransportProtocol || 'http'
                : formData.newServiceTransportProtocol || 'http'
            }
          }

          const serverSpec = {
            protocol,
            frontProtocol: formData.frontProtocol,
            name: formData.serverName,
            id: isEdit.value ? (route.query.id as string) : undefined,
            description: formData.description || `${formData.serverName} v${formData.version}`,
            versionDetail: {
              version: formData.version,
            },
            enabled: true,
            localServerConfig: formData.frontProtocol === 'stdio' && formData.localServerConfig
              ? JSON.parse(formData.localServerConfig)
              : {},
          }

          // 构建 endpointSpecification
          let endpointSpec: any = null
          if (formData.frontProtocol !== 'stdio') {
            if (!formData.restToMcpSwitch && formData.mcpServerEndpoint) {
              // 直接连接 MCP Server Endpoint
              try {
                const url = new URL(formData.mcpServerEndpoint)
                endpointSpec = {
                  type: 'DIRECT',
                  data: {
                    address: url.hostname,
                    port: url.port || (url.protocol === 'https:' ? '443' : '80'),
                    transportProtocol: url.protocol.replace(':', ''),
                  },
                }
                serverSpec.remoteServerConfig = {
                  exportPath: url.pathname || '/',
                }
              } catch (error) {
                ElMessage.error(t('mcpServerManagement.invalidUrlFormat') || '无效的 URL 格式')
                loading.value = false
                return
              }
            } else {
              // 使用服务引用或新建服务
              serverSpec.remoteServerConfig = {
                exportPath: formData.exportPath || '/',
              }

              if (formData.useExistService && formData.service) {
                const [groupName, serviceName] = formData.service.split('@@')
                endpointSpec = {
                  type: 'REF',
                  data: {
                    namespaceId: formData.namespace || currentNamespace.value,
                    serviceName,
                    groupName,
                    transportProtocol: formData.serviceTransportProtocol || 'http',
                  },
                }
              } else if (formData.address && formData.port) {
                endpointSpec = {
                  type: 'DIRECT',
                  data: {
                    address: formData.address,
                    port: formData.port,
                    transportProtocol: formData.newServiceTransportProtocol || 'http',
                  },
                }
              }
            }
          }

          const params: any = {
            serverSpecification: JSON.stringify(serverSpec, null, 2),
            toolSpecification: JSON.stringify({}, null, 2),
            latest: isPublish,
          }

          if (endpointSpec) {
            params.endpointSpecification = JSON.stringify(endpointSpec, null, 2)
          }

          if (isEdit.value) {
            const mcpId = route.query.id as string
            await aiStore.updateMcpInfo(mcpId, params)
            ElMessage.success(t('mcpServerManagement.editSuccessfully') || '编辑成功')
          } else {
            await aiStore.addMcp(params)
            ElMessage.success(t('mcpServerManagement.publishSuccessfully') || '创建成功')
          }

          router.back()
        } catch (error: any) {
          ElMessage.error(error.message || (isEdit.value ? '编辑失败' : '创建失败'))
        } finally {
          loading.value = false
        }
      })
    }

    // 返回列表
    const handleBack = () => {
      router.back()
    }

    onMounted(async () => {
      if (!currentNamespace.value) {
        router.push({ name: 'McpManagement' })
        return
      }

      await fetchServiceList(currentNamespace.value)
      await initEditedData()
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
          <h2 class="text-xl font-bold">
            {isEdit.value
              ? t('mcpServerManagement.editMcpServer') || '编辑 MCP 服务器'
              : t('mcpServerManagement.newMcpServer') || '新建 MCP 服务器'}
          </h2>
        </div>

        <ElCard>
          <ElForm
            ref={formRef}
            model={formData}
            rules={rules}
            labelWidth="150px"
          >
            {/* 基本信息 */}
            <ElFormItem
              label={t('mcpServerManagement.serverName') || '服务器名称'}
              prop="serverName"
              required
            >
              <ElInput
                v-model={formData.serverName}
                placeholder={t('mcpServerManagement.serverNamePlaceholder') || '请输入服务器名称'}
                disabled={isEdit.value}
                maxLength={128}
              />
            </ElFormItem>

            <ElFormItem
              label={t('mcpServerManagement.description') || '描述'}
              prop="description"
            >
              <ElInput
                v-model={formData.description}
                type="textarea"
                rows={3}
                placeholder={t('mcpServerManagement.descriptionPlaceholder') || '请输入描述'}
                maxLength={256}
              />
            </ElFormItem>

            <ElFormItem
              label={t('mcpServerManagement.version') || '版本'}
              prop="version"
              required
            >
              <ElInput
                v-model={formData.version}
                placeholder={t('mcpServerManagement.versionPlaceholder') || '请输入版本号，如 1.0.0'}
                maxLength={64}
              />
            </ElFormItem>

            {/* 协议配置 */}
            <ElFormItem
              label={t('mcpServerManagement.protocol') || '协议'}
              prop="frontProtocol"
              required
            >
              <ElSelect
                v-model={formData.frontProtocol}
                onChange={handleProtocolChange}
                style="width: 100%"
              >
                <ElOption label="stdio" value="stdio" />
                <ElOption label="http" value="http" />
                <ElOption label="https" value="https" />
                <ElOption label="mcp-sse" value="mcp-sse" />
                <ElOption label="mcp-streamable" value="mcp-streamable" />
              </ElSelect>
            </ElFormItem>

            {/* stdio 协议配置 */}
            {formData.frontProtocol === 'stdio' && (
              <ElFormItem
                label={t('mcpServerManagement.localServerConfig') || '本地服务器配置'}
                prop="localServerConfig"
              >
                <MonacoEditor
                  ref={monacoEditorRef}
                  modelValue={formData.localServerConfig}
                  onUpdate:modelValue={(val: string) => (formData.localServerConfig = val)}
                  language="json"
                  height="400px"
                />
              </ElFormItem>
            )}

            {/* 非 stdio 协议配置 */}
            {formData.frontProtocol !== 'stdio' && (
              <>
                <ElFormItem
                  label={t('mcpServerManagement.openConverter') || '开启 HTTP 转 MCP 服务'}
                >
                  <ElSwitch
                    v-model={formData.restToMcpSwitch}
                  />
                </ElFormItem>

                {!formData.restToMcpSwitch && (
                  <ElFormItem
                    label={t('mcpServerManagement.mcpServerEndpoint') || 'MCP Server Endpoint'}
                    prop="mcpServerEndpoint"
                    required
                  >
                    <ElInput
                      v-model={formData.mcpServerEndpoint}
                      placeholder={
                        formData.frontProtocol === 'mcp-sse'
                          ? 'http://example.com/sse'
                          : formData.frontProtocol === 'mcp-streamable'
                          ? 'http://example.com/streamable'
                          : 'http://example.com/mcp'
                      }
                      maxLength={500}
                    />
                  </ElFormItem>
                )}

                {formData.restToMcpSwitch && (
                  <>
                    <ElFormItem label={t('mcpServerManagement.endpointType') || '端点类型'}>
                      <ElRadioGroup v-model={formData.useExistService}>
                        <ElRadio label={true}>
                          {t('mcpServerManagement.useExistService') || '使用已有服务'}
                        </ElRadio>
                        <ElRadio label={false}>
                          {t('mcpServerManagement.createNewService') || '新建服务'}
                        </ElRadio>
                      </ElRadioGroup>
                    </ElFormItem>

                    {formData.useExistService ? (
                      <>
                        <ElFormItem
                          label={t('mcpServerManagement.service') || '服务'}
                          prop="service"
                          required
                        >
                          <ElSelect
                            v-model={formData.service}
                            placeholder={t('mcpServerManagement.selectService') || '请选择服务'}
                            style="width: 100%"
                            filterable
                          >
                            {serviceList.value.map(s => (
                              <ElOption key={s.value} label={s.label} value={s.value} />
                            ))}
                          </ElSelect>
                        </ElFormItem>

                        <ElFormItem
                          label={t('mcpServerManagement.transportProtocol') || '传输协议'}
                          prop="serviceTransportProtocol"
                        >
                          <ElSelect
                            v-model={formData.serviceTransportProtocol}
                            style="width: 100%"
                          >
                            <ElOption label="http" value="http" />
                            <ElOption label="https" value="https" />
                          </ElSelect>
                        </ElFormItem>
                      </>
                    ) : (
                      <>
                        <ElFormItem
                          label={t('mcpServerManagement.address') || '地址'}
                          prop="address"
                          required
                        >
                          <ElInput
                            v-model={formData.address}
                            placeholder={t('mcpServerManagement.addressPlaceholder') || '请输入 IP 地址或域名'}
                          />
                        </ElFormItem>

                        <ElFormItem
                          label={t('mcpServerManagement.port') || '端口'}
                          prop="port"
                          required
                        >
                          <ElInput
                            v-model={formData.port}
                            placeholder={t('mcpServerManagement.portPlaceholder') || '请输入端口号'}
                            type="number"
                          />
                        </ElFormItem>

                        <ElFormItem
                          label={t('mcpServerManagement.transportProtocol') || '传输协议'}
                          prop="newServiceTransportProtocol"
                        >
                          <ElSelect
                            v-model={formData.newServiceTransportProtocol}
                            style="width: 100%"
                          >
                            <ElOption label="http" value="http" />
                            <ElOption label="https" value="https" />
                          </ElSelect>
                        </ElFormItem>
                      </>
                    )}

                    <ElFormItem
                      label={t('mcpServerManagement.exportPath') || '导出路径'}
                      prop="exportPath"
                    >
                      <ElInput
                        v-model={formData.exportPath}
                        placeholder={t('mcpServerManagement.exportPathPlaceholder') || '请输入导出路径，如 /'}
                      />
                    </ElFormItem>
                  </>
                )}
              </>
            )}

            {/* 操作按钮 */}
            <ElFormItem>
              <div class="flex gap-4">
                <ElButton
                  type="primary"
                  loading={loading.value}
                  onClick={() => handleSubmit(false)}
                >
                  {t('common.save') || '保存'}
                </ElButton>
                <ElButton
                  type="success"
                  loading={loading.value}
                  onClick={() => handleSubmit(true)}
                >
                  {t('mcpServerManagement.publish') || '发布'}
                </ElButton>
                <ElButton onClick={handleBack}>
                  {t('common.cancel') || '取消'}
                </ElButton>
              </div>
            </ElFormItem>
          </ElForm>
        </ElCard>
      </div>
    )
  },
})
