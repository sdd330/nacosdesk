/**
 * ExportDialog 组件
 * 导出配置对话框
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/components/ExportDialog/ExportDialog.js
 */

import { defineComponent, ref, reactive, computed, expose } from 'vue'
import { ElDialog, ElButton, ElForm, ElFormItem, ElMessage } from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import { getExportConfigUrl } from '@/api/configuration'

export interface ExportDialogPayload {
  serverId?: string
  tenant?: {
    id: string
    name: string
  }
  dataId?: string
  group?: string
  appName?: string
  configTags?: string[]
  records?: Array<{ dataId: string; group: string }>
  total?: number
}

export default defineComponent({
  name: 'ExportDialog',
  setup(_, { expose: exposeFn }) {
    // ✅ Composition API: 使用 composable
    const { t } = useI18n()

    // ✅ Composition API: 使用 ref 定义响应式状态
    const visible = ref(false)
    const exportData = reactive<ExportDialogPayload>({
      serverId: '',
      tenant: { id: '', name: '' },
      dataId: '',
      group: '',
      appName: '',
      configTags: [],
      records: [],
      total: 0,
    })

    // ✅ Composition API: 使用 computed 派生状态
    const queryText = computed(() => {
      if (exportData.records && exportData.records.length > 0) {
        return t('export.selectedEntry') || '已选择条目'
      }
      if (
        !exportData.dataId &&
        !exportData.group &&
        !exportData.appName &&
        (!exportData.configTags || exportData.configTags.length === 0)
      ) {
        return ''
      }
      let query = ' |'
      if (exportData.dataId) {
        query += ` Data ID: ${exportData.dataId},`
      }
      if (exportData.group) {
        query += ` Group: ${exportData.group},`
      }
      if (exportData.appName) {
        query += ` ${t('config.appName')}: ${exportData.appName},`
      }
      if (exportData.configTags && exportData.configTags.length > 0) {
        query += ` ${t('config.configTags')}: ${exportData.configTags.join(',')},`
      }
      return query.substring(0, query.length - 1)
    })

    const canExport = computed(() => (exportData.total || 0) > 0)

    // ✅ Composition API: 方法定义
    const openDialog = (payload: ExportDialogPayload) => {
      visible.value = true
      Object.assign(exportData, {
        serverId: payload.serverId || '',
        tenant: payload.tenant || { id: '', name: '' },
        dataId: payload.dataId || '',
        group: payload.group || '',
        appName: payload.appName || '',
        configTags: payload.configTags || [],
        records: payload.records || [],
        total: payload.total || 0,
      })
    }

    const closeDialog = () => {
      visible.value = false
    }

    const handleExport = () => {
      try {
        // 构建导出参数
        const ids = exportData.records && exportData.records.length > 0
          ? exportData.records.map((r) => r.dataId).join(',')
          : undefined

        const exportUrl = getExportConfigUrl({
          dataId: exportData.dataId || undefined,
          group: exportData.group || undefined,
          appName: exportData.appName || undefined,
          tags: exportData.configTags && exportData.configTags.length > 0
            ? exportData.configTags.join(',')
            : undefined,
          ids,
          namespaceId: exportData.tenant?.id || undefined,
          exportV2: true, // 使用 V2 格式
        })

        // 打开下载链接
        const link = document.createElement('a')
        link.href = exportUrl
        link.download = `nacos_config_export_${new Date().getTime()}.zip`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        ElMessage.success(t('export.exportSuccess') || '导出成功')
        closeDialog()
      } catch (error: any) {
        ElMessage.error(error.message || t('export.exportFailed') || '导出失败')
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
        title={`${t('export.title') || '导出配置'}（${exportData.serverId || ''}）`}
        width="480px"
        onClose={closeDialog}
        v-slots={{
          footer: () => (
            <div class="flex justify-center">
              <ElButton
                type="primary"
                disabled={!canExport.value}
                onClick={handleExport}
              >
                {t('export.exportBtn') || '导出'}
              </ElButton>
            </div>
          ),
        }}
      >
        <ElForm label-width="100px">
          <ElFormItem label={t('export.source') || '源命名空间'}>
            <p>
              <span class="text-blue-500">{exportData.tenant?.name || ''}</span>
              {exportData.tenant?.id && ` | ${exportData.tenant.id}`}
            </p>
          </ElFormItem>
          <ElFormItem label={t('export.items') || '导出条目'}>
            <p>
              <span class="text-blue-500">{exportData.total || 0}</span>
              {queryText.value}
            </p>
          </ElFormItem>
        </ElForm>
      </ElDialog>
    )
  },
})

