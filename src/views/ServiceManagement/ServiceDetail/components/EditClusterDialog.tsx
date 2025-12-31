/**
 * EditClusterDialog 组件
 * 编辑集群对话框
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/ServiceManagement/ServiceDetail/EditClusterDialog.js
 */

import { defineComponent, ref, reactive } from 'vue'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSwitch,
  ElSelect,
  ElOption,
  ElButton,
  ElMessage,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import MonacoEditor from '@/components/MonacoEditor/index'
import { updateCluster, type Cluster } from '@/api/service'
import { urlParams } from '@/utils/urlParams'

export default defineComponent({
  name: 'EditClusterDialog',
  props: {
    onRefresh: {
      type: Function,
      default: () => {},
    },
  },
  setup(props, { expose }) {
    const { t } = useI18n()

    const visible = ref(false)
    const loading = ref(false)
    const serviceName = ref('')
    const groupName = ref('')
    const editCluster = reactive<Partial<Cluster> & {
      metadataText?: string
      healthyCheckPort?: string
      useInstancePortForCheck?: boolean
      healthChecker?: {
        type?: string
        path?: string
        headers?: string
      }
    }>({
      healthChecker: {},
      healthyCheckPort: '80',
      useInstancePortForCheck: false,
    })

    // 打开对话框
    const openDialog = (cluster: Cluster, _groupName: string, _serviceName: string) => {
      const { metadata = {} } = cluster
      Object.assign(editCluster, {
        ...cluster,
        metadataText: Object.keys(metadata).length > 0 ? JSON.stringify(metadata, null, '\t') : '',
        healthChecker: cluster.healthChecker || {},
        healthyCheckPort: cluster.healthChecker?.port?.toString() || '80',
        useInstancePortForCheck: cluster.healthChecker?.useInstancePort4Check || false,
      })
      serviceName.value = _serviceName
      groupName.value = _groupName
      visible.value = true
    }

    // 关闭对话框
    const closeDialog = () => {
      visible.value = false
      Object.assign(editCluster, {
        healthChecker: {},
        healthyCheckPort: '80',
        useInstancePortForCheck: false,
      })
    }

    // 确认更新
    const handleConfirm = async () => {
      if (!editCluster.clusterName) {
        ElMessage.error(t('service.editCluster.updateFailed'))
        return
      }

      loading.value = true
      try {
        const namespaceId = urlParams.getParams('namespaceId') || undefined
        const res = await updateCluster({
          serviceName: serviceName.value,
          groupName: groupName.value,
          clusterName: editCluster.clusterName,
          metadata: editCluster.metadataText || '',
          healthChecker: JSON.stringify({
            ...editCluster.healthChecker,
            port: editCluster.healthyCheckPort,
            useInstancePort4Check: editCluster.useInstancePortForCheck,
          }),
          namespaceId,
        })

        if (res.code === 0 && res.data === 'ok') {
          ElMessage.success(t('service.editCluster.updateSuccess'))
          closeDialog()
          props.onRefresh()
        } else {
          ElMessage.error(res.message || t('service.editCluster.updateFailed'))
        }
      } catch (error: any) {
        ElMessage.error(error.message || t('service.editCluster.updateFailed'))
      } finally {
        loading.value = false
      }
    }

    // 更新集群数据
    const updateClusterData = (key: string, value: any) => {
      ;(editCluster as any)[key] = value
    }

    // 更新健康检查器数据
    const updateHealthChecker = (key: string, value: any) => {
      editCluster.healthChecker = {
        ...editCluster.healthChecker,
        [key]: value,
      }
    }

    // 暴露方法给父组件
    expose({
      openDialog,
    })

    return () => {
      const { type, path, headers } = editCluster.healthChecker || {}

      return (
        <ElDialog
          v-model={visible.value}
          title={t('service.editCluster.title')}
          width="600px"
          onClose={closeDialog}
        >
          <ElForm label-width="120px">
            <ElFormItem label={t('service.editCluster.healthCheckerType')}>
              <ElSelect
                modelValue={type || 'NONE'}
                onUpdate:modelValue={(val: string) => {
                  updateHealthChecker('type', val)
                }}
              >
                <ElOption label="TCP" value="TCP" />
                <ElOption label="HTTP" value="HTTP" />
                <ElOption label="NONE" value="NONE" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label={t('service.editCluster.checkPort')}>
              <ElInput
                modelValue={editCluster.healthyCheckPort || '80'}
                disabled={editCluster.useInstancePortForCheck}
                onUpdate:modelValue={(val: string) => {
                  updateClusterData('healthyCheckPort', val)
                }}
              />
            </ElFormItem>
            <ElFormItem label={t('service.editCluster.useIpPortCheck')}>
              <ElSwitch
                modelValue={editCluster.useInstancePortForCheck || false}
                onUpdate:modelValue={(val: boolean) => {
                  updateClusterData('useInstancePortForCheck', val)
                }}
              />
            </ElFormItem>
            {type === 'HTTP' && (
              <>
                <ElFormItem label={t('service.editCluster.checkPath')}>
                  <ElInput
                    modelValue={path || ''}
                    onUpdate:modelValue={(val: string) => {
                      updateHealthChecker('path', val)
                    }}
                  />
                </ElFormItem>
                <ElFormItem label={t('service.editCluster.checkHeaders')}>
                  <ElInput
                    modelValue={headers || ''}
                    onUpdate:modelValue={(val: string) => {
                      updateHealthChecker('headers', val)
                    }}
                  />
                </ElFormItem>
              </>
            )}
            <ElFormItem label={t('service.editCluster.metadata')}>
              <MonacoEditor
                language="json"
                width="100%"
                height={200}
                value={editCluster.metadataText || ''}
                onUpdate:value={(val: string) => {
                  updateClusterData('metadataText', val)
                }}
              />
            </ElFormItem>
          </ElForm>

          <template #footer>
            <div class="flex justify-end gap-2">
              <ElButton onClick={closeDialog}>{t('service.editCluster.cancel')}</ElButton>
              <ElButton type="primary" loading={loading.value} onClick={handleConfirm}>
                {t('service.editCluster.confirm')}
              </ElButton>
            </div>
          </template>
        </ElDialog>
      )
    }
  },
})

