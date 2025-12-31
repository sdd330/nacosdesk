/**
 * ImportDialog 组件
 * 导入配置对话框
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/components/ImportDialog/ImportDialog.js
 */

import { defineComponent, ref, reactive, onMounted, expose } from 'vue'
import {
  ElDialog,
  ElButton,
  ElForm,
  ElFormItem,
  ElSelect,
  ElOption,
  ElUpload,
  ElIcon,
  ElTooltip,
} from 'element-plus'
import { Warning, QuestionFilled } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'
import type { UploadProps, UploadRequestOptions } from 'element-plus'

export interface ImportDialogPayload {
  serverId?: string
  tenant?: {
    id: string
    name: string
  }
}

export interface ImportCallback {
  (result: any, policyLabel: string): void
}

export default defineComponent({
  name: 'ImportDialog',
  setup(_, { expose: exposeFn }) {
    // ✅ Composition API: 使用 composable
    const { t } = useI18n()

    // ✅ Composition API: 使用 ref 定义响应式状态
    const visible = ref(false)
    const importData = reactive<ImportDialogPayload>({
      serverId: '',
      tenant: { id: '', name: '' },
    })

    const policy = ref('abort')
    const policyLabel = ref(t('clone.terminate') || '终止')
    const policyOptions = ref([
      { value: 'abort', label: t('clone.terminate') || '终止' },
      { value: 'skip', label: t('clone.skip') || '跳过' },
      { value: 'overwrite', label: t('clone.cover') || '覆盖' },
    ])

    let callback: ImportCallback | null = null

    // ✅ Composition API: 方法定义
    const openDialog = (payload: ImportDialogPayload, cb: ImportCallback) => {
      callback = cb
      visible.value = true
      Object.assign(importData, {
        serverId: payload.serverId || '',
        tenant: payload.tenant || { id: '', name: '' },
      })
    }

    const closeDialog = () => {
      visible.value = false
      callback = null
    }

    const handlePolicyChange = (value: string) => {
      policy.value = value
      const option = policyOptions.value.find((opt) => opt.value === value)
      if (option) {
        policyLabel.value = option.label
      }
    }

    const getUploadUrl = (): string => {
      // API 路径：/v3/console/cs/config/import/serverId/{serverId}/tenant/{tenantId}?policy={policy}
      const baseLink = `/v3/console/cs/config/import/serverId/${importData.serverId || 'center'}/tenant/${
        importData.tenant?.id || 'public'
      }?policy=${policy.value}`
      return baseLink
    }

    const handleUploadSuccess = (response: any) => {
      if (callback) {
        if (response.code === 0) {
          callback({ code: 0, data: response }, policyLabel.value)
        } else {
          callback({ code: 1, error: { message: response.message }, retData: response }, policyLabel.value)
        }
      }
      closeDialog()
    }

    const handleUploadError = (error: any) => {
      if (callback) {
        const response = error?.response || {}
        callback({ code: 1, error: { message: error.message }, retData: response }, policyLabel.value)
      }
      closeDialog()
    }

    const customRequest = async (options: UploadRequestOptions) => {
      const formData = new FormData()
      formData.append('file', options.file)

      try {
        const response = await fetch(getUploadUrl(), {
          method: 'POST',
          body: formData,
          headers: {
            poweredBy: 'simpleMVC',
            projectName: 'nacos',
          },
        })

        const result = await response.json()
        if (response.ok && result.code === 0) {
          handleUploadSuccess(result)
        } else {
          handleUploadError({ response: result, message: result.message || '上传失败' })
        }
      } catch (err: any) {
        handleUploadError({ message: err.message || '上传失败' })
      }
    }

    // ✅ Composition API: 使用 expose 暴露方法
    exposeFn({
      openDialog,
      closeDialog,
    })

    // ✅ Composition API: 返回渲染函数
    return () => (
      <ElDialog
        modelValue={visible.value}
        onUpdate:modelValue={(val: boolean) => (visible.value = val)}
        title={`${t('import.title') || '导入配置'}（${importData.serverId || ''}）`}
        width="480px"
        onClose={closeDialog}
        v-slots={{
          footer: () => (
            <div class="flex justify-center">
              <ElUpload
                action={getUploadUrl()}
                accept=".zip"
                limit={1}
                customRequest={customRequest}
                v-slots={{
                  default: () => (
                    <ElButton type="primary">{t('import.uploadFile') || '上传文件'}</ElButton>
                  ),
                }}
              />
            </div>
          ),
        }}
      >
        <ElForm label-width="100px">
          <ElFormItem label={t('import.target') || '目标命名空间'}>
            <p>
              <span class="text-blue-500">{importData.tenant?.name || ''}</span>
              {importData.tenant?.id && ` | ${importData.tenant.id}`}
            </p>
          </ElFormItem>
          <ElFormItem label={t('clone.conflict') || '冲突处理'}>
            <ElSelect
              modelValue={policy.value}
              onUpdate:modelValue={handlePolicyChange}
              style="width: 100%"
            >
              {policyOptions.value.map((option) => (
                <ElOption key={option.value} label={option.label} value={option.value} />
              ))}
            </ElSelect>
          </ElFormItem>
        </ElForm>

        <div class="text-center mt-4">
          <ElIcon class="text-orange-500 mr-2">
            <Warning />
          </ElIcon>
          <span class="text-sm text-gray-600">{t('import.beSureExerciseCaution') || '请谨慎操作'}</span>
          <ElTooltip
            content={t('import.zipFileFormat') || 'ZIP 文件格式说明'}
            placement="top"
          >
            <span class="ml-2">
              Data ID{' '}
              <ElIcon class="text-green-600 cursor-pointer">
                <QuestionFilled />
              </ElIcon>
            </span>
          </ElTooltip>
        </div>
      </ElDialog>
    )
  },
})

