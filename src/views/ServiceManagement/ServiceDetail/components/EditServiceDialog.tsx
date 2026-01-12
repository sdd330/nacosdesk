/**
 * EditServiceDialog 组件
 * 编辑服务对话框
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/ServiceManagement/ServiceDetail/EditServiceDialog.js
 */

import { defineComponent, ref, reactive, onMounted } from 'vue'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElButton,
  ElMessage,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import MonacoEditor from '@/components/MonacoEditor/index'
import { updateService, type ServiceDetail } from '@/api/service'
import httpClient from '@/utils/request'

export default defineComponent({
  name: 'EditServiceDialog',
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
    const isCreate = ref(false)
    const selectorTypes = ref<string[]>([])
    const editService = reactive<Partial<ServiceDetail> & { metadataText?: string; selector?: { type: string; expression?: string } }>({
      selector: { type: 'none' },
    })
    const errors = reactive<Record<string, { validateState?: string; help?: string }>>({})

    // 获取选择器类型
    const getSelectorTypes = async () => {
      try {
        const res = await httpClient.get<{ code: number; data: string[] }>('/v3/console/ns/service/selector/types')
        if (res.code === 0 && res.data) {
          selectorTypes.value = res.data
        }
      } catch (error: any) {
        // 忽略错误，使用默认值
        selectorTypes.value = ['none', 'label', 'ip']
      }
    }

    // 打开对话框
    const openDialog = (service: ServiceDetail) => {
      const { metadata = {}, serviceName } = service
      Object.assign(editService, {
        ...service,
        metadataText: Object.keys(metadata).length > 0 ? JSON.stringify(metadata, null, '\t') : '',
        selector: service.selector || { type: 'none' },
      })
      isCreate.value = !serviceName
      visible.value = true
      getSelectorTypes()
    }

    // 关闭对话框
    const closeDialog = () => {
      visible.value = false
      Object.assign(editService, { selector: { type: 'none' } })
      Object.keys(errors).forEach((key) => {
        delete errors[key]
      })
    }

    // 验证表单
    const validator = (): boolean => {
      const helpMap: Record<string, string> = {
        serviceName: t('service.editService.serviceNameRequired'),
        protectThreshold: t('service.editService.protectThresholdRequired'),
      }

      const fields: Record<string, any> = {
        serviceName: editService.serviceName,
        protectThreshold: editService.protectThreshold,
      }

      if (fields.protectThreshold === 0) {
        fields.protectThreshold = '0'
      }

      let isValid = true
      for (const key in fields) {
        if (!fields[key]) {
          errors[key] = { validateState: 'error', help: helpMap[key] }
          isValid = false
        } else {
          delete errors[key]
        }
      }

      return isValid
    }

    // 确认更新
    const handleConfirm = async () => {
      if (!validator()) return

      loading.value = true
      try {
        const res = await updateService({
          serviceName: editService.serviceName!,
          groupName: editService.groupName || 'DEFAULT_GROUP',
          protectThreshold: editService.protectThreshold!,
          metadata: editService.metadataText || '',
          selector: JSON.stringify(editService.selector || { type: 'none' }),
        })

        if (res.code === 0 && res.data === 'ok') {
          ElMessage.success(t('service.editService.updateSuccess'))
          closeDialog()
          props.onRefresh()
        } else {
          ElMessage.error(res.message || t('service.editService.updateFailed'))
        }
      } catch (error: any) {
        ElMessage.error(error.message || t('service.editService.updateFailed'))
      } finally {
        loading.value = false
      }
    }

    // 更新服务数据
    const updateServiceData = (key: string, value: any) => {
      ;(editService as any)[key] = value
      // 清除错误状态
      if (key === 'serviceName' || key === 'protectThreshold') {
        delete errors[key]
      }
    }

    // 暴露方法给父组件
    expose({
      openDialog,
    })

    return () => (
      <ElDialog
        v-model={visible.value}
        title={isCreate.value ? t('service.create') : t('service.editService.title')}
        width="600px"
        onClose={closeDialog}
       v-slots={
          footer: () => (
            <div class="flex justify-end gap-2">
            <ElButton onClick={closeDialog}>{t('service.editService.cancel')}</ElButton>
            <ElButton type="primary" loading={loading.value} onClick={handleConfirm}>
              {t('service.editService.confirm')}
            </ElButton>
          </div>
          ),
        }
      >
        <ElForm label-width="120px">
          <ElFormItem
            required={isCreate.value}
            label={t('service.serviceName')}
            error={errors.serviceName?.help}
          >
            {!isCreate.value ? (
              <p>{editService.serviceName}</p>
            ) : (
              <ElInput
                modelValue={editService.serviceName || ''}
                onUpdate:modelValue={(val: string) => {
                  updateServiceData('serviceName', val)
                }}
              />
            )}
          </ElFormItem>
          <ElFormItem
            required
            label={t('service.protectThreshold')}
            error={errors.protectThreshold?.help}
          >
            <ElInput
              modelValue={String(editService.protectThreshold || '')}
              onUpdate:modelValue={(val: string) => {
                updateServiceData('protectThreshold', val)
              }}
            />
          </ElFormItem>
          <ElFormItem label={t('service.groupName')}>
            <ElInput
              modelValue={editService.groupName || 'DEFAULT_GROUP'}
              placeholder="DEFAULT_GROUP"
              readonly={!isCreate.value}
              onUpdate:modelValue={(val: string) => {
                updateServiceData('groupName', val)
              }}
            />
          </ElFormItem>
          <ElFormItem label={t('service.metadata')}>
            <MonacoEditor
              language="json"
              width="100%"
              height={200}
              value={editService.metadataText || ''}
              onUpdate:value={(val: string) => {
                updateServiceData('metadataText', val)
              }}
            />
          </ElFormItem>
          <ElFormItem label={t('service.type')}>
            <ElSelect
              modelValue={editService.selector?.type || 'none'}
              onUpdate:modelValue={(val: string) => {
                updateServiceData('selector', { ...editService.selector, type: val })
              }}
            >
              {selectorTypes.value.map((type) => (
                <ElOption key={type} label={type} value={type} />
              ))}
            </ElSelect>
          </ElFormItem>
          {editService.selector?.type && editService.selector.type !== 'none' && (
            <ElFormItem label={t('service.selector')}>
              <ElInput
                type="textarea"
                modelValue={editService.selector.expression || ''}
                onUpdate:modelValue={(val: string) => {
                  updateServiceData('selector', { ...editService.selector, expression: val })
                }}
              />
            </ElFormItem>
          )}
        </ElForm>

        
      </ElDialog>
    )
  },
})

