/**
 * ConfigurationManagement 页面
 * 使用 Vue 3 JSX + Composition API
 */

import { defineComponent, ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
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
  ElTable,
  ElTableColumn,
  ElTag,
  ElLink,
  ElPagination,
  ElMessage,
  ElMessageBox,
  ElCollapseTransition,
  ElIcon,
} from 'element-plus'
import { Plus, Delete, Download, Upload } from '@element-plus/icons-vue'
import { useConfigurationStore } from '@/stores/configuration'
import { useI18n } from '@/composables/useI18n'
import PageTitle from '@/components/PageTitle/index'
import QueryResult from '@/components/QueryResult/index'
import DeleteDialog from '@/components/DeleteDialog/index'
import CloneDialog from '@/components/CloneDialog/index'
import ExportDialog from '@/components/ExportDialog/index'
import ImportDialog from '@/components/ImportDialog/index'
import DashboardCard from './DashboardCard'

export default defineComponent({
  name: 'ConfigurationManagement',
  setup() {
    // ✅ Composition API: 使用 composables
    const router = useRouter()
    const configStore = useConfigurationStore()
    const { t, tWithParams } = useI18n()

    // ✅ Composition API: 使用 ref 定义响应式状态
    const deleteDialogRef = ref()
    const cloneDialogRef = ref()
    const exportDialogRef = ref()
    const importDialogRef = ref()
    const isAdvanced = ref(false)
    const selectedRows = ref<any[]>([])
    const hasDashboard = ref(false)
    const dashboardList = ref<any[]>([])

    // 从 URL 参数获取初始值
    const getUrlParam = (key: string) => {
      const params = new URLSearchParams(window.location.search)
      return params.get(key) || ''
    }

    // ✅ Composition API: 使用 reactive 定义响应式对象
    const searchForm = reactive({
      dataId: getUrlParam('dataId') || '',
      group: getUrlParam('group') || '',
      appName: getUrlParam('appName') || '',
      configTags: '',
      type: '',
      search: 'accurate' as 'accurate' | 'blur',
      configDetail: '',
    })

    const typeOptions = [
      { value: 'text', label: 'TEXT' },
      { value: 'json', label: 'JSON' },
      { value: 'xml', label: 'XML' },
      { value: 'yaml', label: 'YAML' },
      { value: 'html', label: 'HTML' },
      { value: 'properties', label: 'Properties' },
      { value: 'toml', label: 'TOML' },
    ]

    // ✅ Composition API: 使用 computed 派生状态
    const currentNamespace = computed(() => {
      return (window as any).nownamespace || getUrlParam('namespace') || ''
    })

    const currentNamespaceName = computed(() => {
      return (window as any).namespaceShowName || ''
    })

    const currentNamespaceDesc = computed(() => {
      return (window as any).namespaceDesc || ''
    })

    // ✅ Composition API: 方法定义
    const handleSearch = async () => {
      configStore.updateSearchParams({
        dataId: searchForm.dataId,
        groupName: searchForm.group,
        appName: searchForm.appName,
        configTags: searchForm.configTags,
        type: searchForm.type,
        search: searchForm.search,
        namespaceId: currentNamespace.value,
      })

      try {
        if (searchForm.configDetail) {
          await configStore.searchDetail({
            configDetail: searchForm.configDetail,
          })
        } else {
          await configStore.fetchConfigList()
        }
      } catch (error) {
        ElMessage.error(configStore.error || t('config.searchFailed'))
      }
    }

    const handleReset = () => {
      searchForm.dataId = ''
      searchForm.group = ''
      searchForm.appName = ''
      searchForm.configTags = ''
      searchForm.type = ''
      searchForm.search = 'accurate'
      searchForm.configDetail = ''
      configStore.resetSearchParams()
      handleSearch()
    }

    const toggleAdvanced = () => {
      isAdvanced.value = !isAdvanced.value
    }

    const handleNewConfig = () => {
      router.push({
        name: 'NewConfig',
        query: {
          namespace: currentNamespace.value,
          namespaceShowName: currentNamespaceName.value,
        },
      })
    }

    const handleBatchDelete = async () => {
      if (selectedRows.value.length === 0) {
        ElMessage.warning(t('config.pleaseSelectConfig'))
        return
      }

      try {
        await ElMessageBox.confirm(
          tWithParams('config.confirmBatchDelete', { count: selectedRows.value.length }),
          t('common.delete'),
          {
            type: 'warning',
          }
        )

        // 批量删除配置
        let successCount = 0
        let failCount = 0
        const errors: string[] = []

        for (const row of selectedRows.value) {
          try {
            await configStore.removeConfig({
              dataId: row.dataId,
              group: row.group,
              namespaceId: currentNamespace.value,
            })
            successCount++
          } catch (error: any) {
            failCount++
            errors.push(`${row.dataId}: ${error.message || t('config.deleteFailed')}`)
          }
        }

        // 显示结果
        if (failCount === 0) {
          ElMessage.success(tWithParams('config.batchDeleteSuccess', { count: successCount }))
        } else if (successCount > 0) {
          ElMessage.warning(
            tWithParams('config.batchDeletePartial', {
              success: successCount,
              fail: failCount,
            })
          )
          console.error('批量删除失败详情:', errors)
        } else {
          ElMessage.error(t('config.batchDeleteFailed'))
          console.error('批量删除失败详情:', errors)
        }

        // 清空选择
        selectedRows.value = []
        await handleSearch()
      } catch {
        // 用户取消
      }
    }

    const handleExport = () => {
      if (exportDialogRef.value) {
        // 获取当前搜索结果的总数
        const total = configStore.configList?.totalCount || 0
        
        // 获取选中的记录
        const records = selectedRows.value.length > 0
          ? selectedRows.value.map((row) => ({
              dataId: row.dataId,
              group: row.group,
            }))
          : []

        exportDialogRef.value.openDialog({
          serverId: 'center', // 本地模式，使用固定值
          tenant: {
            id: currentNamespace.value || 'public',
            name: currentNamespaceName.value || 'public',
          },
          dataId: searchForm.dataId || undefined,
          group: searchForm.group || undefined,
          appName: searchForm.appName || undefined,
          configTags: searchForm.configTags ? [searchForm.configTags] : undefined,
          records: records.length > 0 ? records : undefined,
          total,
        })
      }
    }

    const handleImport = () => {
      if (importDialogRef.value) {
        importDialogRef.value.openDialog(
          {
            serverId: 'center', // 本地模式，使用固定值
            tenant: {
              id: currentNamespace.value || 'public',
              name: currentNamespaceName.value || 'public',
            },
          },
          (result: any, policyLabel: string) => {
            if (result.code === 0) {
              ElMessage.success(t('import.importSuccess') || '导入成功')
              // 刷新列表
              handleSearch()
            } else {
              ElMessage.error(result.error?.message || t('import.importFailed') || '导入失败')
            }
          }
        )
      }
    }

    const handleViewDetail = (row: any) => {
      router.push({
        name: 'ConfigDetail',
        query: {
          dataId: row.dataId,
          group: row.group,
          namespace: currentNamespace.value,
          namespaceShowName: currentNamespaceName.value,
        },
      })
    }

    const handleEdit = (row: any) => {
      router.push({
        name: 'ConfigEditor',
        query: {
          dataId: row.dataId,
          group: row.group,
          namespace: currentNamespace.value,
          namespaceShowName: currentNamespaceName.value,
        },
      })
    }

    const handleClone = (row: any) => {
      if (cloneDialogRef.value) {
        cloneDialogRef.value.openDialog({
          sourceNamespace: {
            name: currentNamespaceName.value,
            id: currentNamespace.value,
          },
          total: 1,
          dataId: row.dataId,
          group: row.group,
        })
      }
    }

    const handleDelete = async (row: any) => {
      try {
        await ElMessageBox.confirm(
          tWithParams('config.confirmDelete', { dataId: row.dataId }),
          t('common.delete'),
          {
            type: 'warning',
          }
        )

        await configStore.removeConfig({
          dataId: row.dataId,
          group: row.group,
          namespaceId: currentNamespace.value,
        })

        ElMessage.success(t('config.deleteSuccess'))
        if (deleteDialogRef.value) {
          deleteDialogRef.value.openDialog({
            isok: true,
            dataId: row.dataId,
            group: row.group,
          })
        }
        await handleSearch()
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error(error.message || t('config.deleteFailed'))
          if (deleteDialogRef.value) {
            deleteDialogRef.value.openDialog({
              isok: false,
              dataId: row.dataId,
              group: row.group,
              message: error.message,
            })
          }
        }
      }
    }

    const handleSelectionChange = (selection: any[]) => {
      selectedRows.value = selection
    }

    const handlePageChange = (page: number) => {
      configStore.pageNumber = page
      handleSearch()
    }

    const handlePageSizeChange = (size: number) => {
      configStore.pageSize = size
      configStore.pageNumber = 1
      handleSearch()
    }

    // ✅ Composition API: 生命周期钩子
    onMounted(async () => {
      if (currentNamespace.value) {
        configStore.updateSearchParams({
          namespaceId: currentNamespace.value,
        })
      }

      if (searchForm.dataId || searchForm.group || searchForm.appName) {
        await handleSearch()
      } else {
        await handleSearch()
      }
    })

    // ✅ Composition API: 返回渲染函数
    return () => (
      <div class="p-6">
        <PageTitle
          title={t('mainLayout.configurationManagement')}
          namespaceId={currentNamespace.value}
          namespaceName={currentNamespaceName.value}
          desc={currentNamespaceDesc.value}
        />

        {/* 搜索表单 */}
        <ElCard class="mb-4">
          <ElForm model={searchForm} inline class="mb-0">
            <ElFormItem label={t('config.dataId')}>
              <ElInput
                modelValue={searchForm.dataId}
                onUpdate:modelValue={(val: string) => (searchForm.dataId = val)}
                placeholder={t('config.pleaseInputDataId')}
                clearable
                style="width: 200px"
              />
            </ElFormItem>

            <ElFormItem label={t('config.group')}>
              <ElInput
                modelValue={searchForm.group}
                onUpdate:modelValue={(val: string) => (searchForm.group = val)}
                placeholder={t('config.pleaseInputGroup')}
                clearable
                style="width: 200px"
              />
            </ElFormItem>

            <ElFormItem label={t('config.appName')}>
              <ElInput
                modelValue={searchForm.appName}
                onUpdate:modelValue={(val: string) => (searchForm.appName = val)}
                placeholder={t('config.pleaseInputAppName')}
                clearable
                style="width: 200px"
              />
            </ElFormItem>

            <ElFormItem>
              <ElButton
                type="primary"
                loading={configStore.loading}
                onClick={handleSearch}
              >
                {t('common.search')}
              </ElButton>
              <ElButton onClick={handleReset}>{t('common.reset')}</ElButton>
              <ElButton link type="primary" onClick={toggleAdvanced}>
                {isAdvanced.value ? t('config.simpleQuery') : t('config.advancedQuery')}
              </ElButton>
            </ElFormItem>
          </ElForm>

          {/* 高级查询 */}
          <ElCollapseTransition>
            {isAdvanced.value && (
              <div class="mt-4 pt-4 border-t border-gray-200">
                <ElForm model={searchForm} inline>
                  <ElFormItem label={t('config.configTags')}>
                    <ElInput
                      modelValue={searchForm.configTags}
                      onUpdate:modelValue={(val: string) => (searchForm.configTags = val)}
                      placeholder={t('config.pleaseInputTags')}
                      clearable
                      style="width: 200px"
                    />
                  </ElFormItem>

                  <ElFormItem label={t('config.type')}>
                    <ElSelect
                      modelValue={searchForm.type}
                      onUpdate:modelValue={(val: string) => (searchForm.type = val)}
                      placeholder={t('config.pleaseSelectType')}
                      clearable
                      style="width: 200px"
                    >
                      {typeOptions.map((type) => (
                        <ElOption key={type.value} label={type.label} value={type.value} />
                      ))}
                    </ElSelect>
                  </ElFormItem>

                  <ElFormItem label={t('config.searchType')}>
                    <ElRadioGroup
                      modelValue={searchForm.search}
                      onUpdate:modelValue={(val: string | number | boolean | undefined) => {
                        if (val) searchForm.search = val as 'accurate' | 'blur'
                      }}
                    >
                      <ElRadio value="accurate">{t('config.accurate')}</ElRadio>
                      <ElRadio value="blur">{t('config.blur')}</ElRadio>
                    </ElRadioGroup>
                  </ElFormItem>
                </ElForm>
              </div>
            )}
          </ElCollapseTransition>
        </ElCard>

        {/* 操作栏 */}
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <ElButton type="primary" onClick={handleNewConfig}>
              <ElIcon><Plus /></ElIcon>
              {t('config.newConfig')}
            </ElButton>
            <ElButton
              disabled={selectedRows.value.length === 0}
              onClick={handleBatchDelete}
            >
              <ElIcon><Delete /></ElIcon>
              {t('config.batchDelete')}
            </ElButton>
            <ElButton onClick={handleExport}>
              <ElIcon><Download /></ElIcon>
              {t('config.export')}
            </ElButton>
            <ElButton onClick={handleImport}>
              <ElIcon><Upload /></ElIcon>
              {t('config.import')}
            </ElButton>
          </div>
          <div class="flex items-center">
            <QueryResult total={configStore.totalCount} />
          </div>
        </div>

        {/* Dashboard Cards */}
        {hasDashboard.value && dashboardList.value.length > 0 && (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {dashboardList.value.map((item, index) => (
              <DashboardCard key={`dashboard-${index}`} data={item} height="auto" />
            ))}
          </div>
        )}

        {/* 配置列表表格 */}
        <ElCard>
          <ElTable
            {...{
              loading: configStore.loading,
              data: configStore.configList,
              onSelectionChange: handleSelectionChange,
              stripe: true,
              style: 'width: 100%',
            }}
          >
            <ElTableColumn type="selection" width={55} />
            <ElTableColumn prop="dataId" label={t('config.dataId')} minWidth={200}>
              {{
                default: ({ row }: { row: any }) => (
                  <ElLink type="primary" onClick={() => handleViewDetail(row)}>
                    {row.dataId}
                  </ElLink>
                ),
              }}
            </ElTableColumn>
            <ElTableColumn prop="group" label={t('config.group')} width={150} />
            <ElTableColumn prop="appName" label={t('config.appName')} width={150} />
            <ElTableColumn prop="type" label={t('config.type')} width={100}>
              {{
                default: ({ row }: { row: any }) => (
                  <ElTag size="small">{row.type || 'TEXT'}</ElTag>
                ),
              }}
            </ElTableColumn>
            <ElTableColumn prop="tags" label={t('config.tags')} width={150} />
            <ElTableColumn label={t('config.operation')} width={200} fixed="right">
              {{
                default: ({ row }: { row: any }) => (
                  <>
                    <ElButton link type="primary" size="small" onClick={() => handleEdit(row)}>
                      {t('common.edit')}
                    </ElButton>
                    <ElButton link type="primary" size="small" onClick={() => handleClone(row)}>
                      {t('config.clone')}
                    </ElButton>
                    <ElButton link type="danger" size="small" onClick={() => handleDelete(row)}>
                      {t('common.delete')}
                    </ElButton>
                  </>
                ),
              }}
            </ElTableColumn>
          </ElTable>

          {/* 分页 */}
          <div class="mt-4 flex justify-end">
            <ElPagination
              {...{
                'current-page': configStore.pageNumber,
                'onUpdate:current-page': (val: number) => { configStore.pageNumber = val },
                'page-size': configStore.pageSize,
                'onUpdate:page-size': (val: number) => { configStore.pageSize = val },
                total: configStore.totalCount,
                'page-sizes': [10, 20, 50, 100],
                layout: 'total, sizes, prev, pager, next, jumper',
                onSizeChange: handlePageSizeChange,
                onCurrentChange: handlePageChange,
              }}
            />
          </div>
        </ElCard>

        {/* 对话框组件 */}
        <DeleteDialog ref={deleteDialogRef} />
        <CloneDialog ref={cloneDialogRef} />
        <ExportDialog ref={exportDialogRef} />
        <ImportDialog ref={importDialogRef} />
      </div>
    )
  },
})

