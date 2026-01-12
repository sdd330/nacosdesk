/**
 * EditInstanceDialog 组件
 * 编辑实例对话框
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/ServiceManagement/ServiceDetail/EditInstanceDialog.js
 */

import { defineComponent, ref, reactive } from 'vue'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSwitch,
  ElButton,
  ElMessage,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import MonacoEditor from '@/components/MonacoEditor/index'
import { updateInstance, type Instance } from '@/api/service'
import { urlParams } from '@/utils/urlParams'

export default defineComponent({
  name: 'EditInstanceDialog',
  props: {
    serviceName: {
      type: String,
      required: true,
    },
    clusterName: {
      type: String,
      required: true,
    },
    groupName: {
      type: String,
      required: true,
    },
    onRefresh: {
      type: Function,
      default: () => {},
    },
  },
  setup(props, { expose }) {
    const { t } = useI18n()

    const visible = ref(false)
    const loading = ref(false)
    const editInstance = reactive<Partial<Instance> & { metadataText?: string }>({})

    // 打开对话框
    const openDialog = (instance: Instance) => {
      const { metadata = {} } = instance
      Object.assign(editInstance, {
        ...instance,
        metadataText: Object.keys(metadata).length > 0 ? JSON.stringify(metadata, null, '\t') : '',
      })
      visible.value = true
    }

    // 关闭对话框
    const closeDialog = () => {
      visible.value = false
      Object.assign(editInstance, {})
    }

    // 确认更新
    const handleConfirm = async () => {
      if (!editInstance.ip || editInstance.port === undefined) {
        ElMessage.error(t('service.instanceTable.updateFailed'))
        return
      }

      loading.value = true
      try {
        const namespaceId = urlParams.getParams('namespaceId') || undefined
        const res = await updateInstance({
          serviceName: props.serviceName,
          clusterName: props.clusterName,
          groupName: props.groupName,
          ip: editInstance.ip,
          port: editInstance.port,
          ephemeral: editInstance.ephemeral ?? false,
          weight: editInstance.weight ?? 1,
          enabled: editInstance.enabled ?? true,
          metadata: editInstance.metadataText || '{}',
          namespaceId,
        })

        if (res.code === 0 && res.data === 'ok') {
          ElMessage.success(t('service.editInstance.updateSuccess'))
          closeDialog()
          props.onRefresh()
        } else {
          ElMessage.error(res.message || t('service.editInstance.updateFailed'))
        }
      } catch (error: any) {
        ElMessage.error(error.message || t('service.editInstance.updateFailed'))
      } finally {
        loading.value = false
      }
    }

    // 更新实例数据
    const updateInstanceData = (key: string, value: any) => {
      ;(editInstance as any)[key] = value
    }

    // 暴露方法给父组件
    expose({
      openDialog,
    })

    return () => (
      <ElDialog
        v-model={visible.value}
        title={t('service.editInstance.title')}
        width="600px"
        onClose={closeDialog}
       v-slots={
          footer: () => (
            <div class="flex justify-end gap-2">
            <ElButton onClick={closeDialog}>{t('service.editInstance.cancel')}</ElButton>
            <ElButton type="primary" loading={loading.value} onClick={handleConfirm}>
              {t('service.editInstance.confirm')}
            </ElButton>
          </div>
          ),
        }
      >
        <ElForm label-width="120px">
          <ElFormItem label="IP:">
            <p>{editInstance.ip}</p>
          </ElFormItem>
          <ElFormItem label={t('service.editInstance.port')}>
            <p>{editInstance.port}</p>
          </ElFormItem>
          <ElFormItem label={t('service.editInstance.weight')}>
            <ElInput
              modelValue={String(editInstance.weight || 1)}
              onUpdate:modelValue={(val: string) => {
                updateInstanceData('weight', Number(val))
              }}
            />
          </ElFormItem>
          <ElFormItem label={t('service.editInstance.enabled')}>
            <ElSwitch
              modelValue={editInstance.enabled ?? true}
              onUpdate:modelValue={(val: boolean) => {
                updateInstanceData('enabled', val)
              }}
            />
          </ElFormItem>
          <ElFormItem label={t('service.editInstance.metadata')}>
            <MonacoEditor
              language="json"
              width="100%"
              height={200}
              value={editInstance.metadataText || ''}
              onUpdate:value={(val: string) => {
                updateInstanceData('metadataText', val)
              }}
            />
          </ElFormItem>
        </ElForm>

        
      </ElDialog>
    )
  },
})

