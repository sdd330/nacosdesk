/**
 * HistoryRollback 页面
 * 历史版本列表、版本对比、回滚操作
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/ConfigurationManagement/HistoryRollback/HistoryRollback.js
 */

import { defineComponent, ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElSelect,
  ElOption,
  ElButton,
  ElTable,
  ElTableColumn,
  ElPagination,
  ElMessage,
  ElLink,
  ElTag,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import PageTitle from '@/components/PageTitle/index'
import NameSpaceList from '@/components/NameSpaceList/index'
import QueryResult from '@/components/QueryResult/index'
import DiffEditorDialog from '@/components/DiffEditorDialog/index'
import TotalRender from '@/components/Page/TotalRender'
import { getHistoryList, getHistoryConfigs, getConfigDetail, getHistoryDetail, type HistoryItem } from '@/api/configuration'
import { urlParams } from '@/utils/urlParams'

export default defineComponent({
  name: 'HistoryRollback',
  setup() {
    // ✅ Composition API: 使用 composables
    const router = useRouter()
    const { t } = useI18n()

    // ✅ Composition API: 使用 ref 定义响应式状态
    const diffEditorDialogRef = ref()
    const loading = ref(false)
    const historyList = ref<HistoryItem[]>([])
    const totalCount = ref(0)
    const pageNumber = ref(1)
    const pageSize = ref(10)

    const currentNamespace = ref(urlParams.getParams('namespace') || 'public')
    const currentNamespaceName = ref('public')
    const currentNamespaceDesc = ref('')

    const dataId = ref(urlParams.getParams('historyDataId') || '')
    const group = ref(urlParams.getParams('historyGroup') || '')

    const dataIdOptions = ref<Array<{ value: string; label: string }>>([])
    const groupOptions = ref<Array<{ value: string; label: string }>>([])

    // ✅ Composition API: 方法定义
    const handleNamespaceChange = (namespace: { id: string; name: string; desc?: string }) => {
      currentNamespace.value = namespace.id
      currentNamespaceName.value = namespace.name
      currentNamespaceDesc.value = namespace.desc || ''
      // 重置搜索条件并重新获取配置列表
      dataId.value = ''
      group.value = ''
      urlParams.setParams({
        historyDataId: '',
        historyGroup: '',
      })
      fetchHistoryConfigs()
      fetchHistoryList()
    }

    const fetchHistoryConfigs = async () => {
      try {
        const configs = await getHistoryConfigs(currentNamespace.value)
        const dataIdSet = new Set<string>()
        const groupSet = new Set<string>()

        configs.forEach((config) => {
          dataIdSet.add(config.dataId)
          groupSet.add(config.groupName)
        })

        dataIdOptions.value = Array.from(dataIdSet).map((id) => ({ value: id, label: id }))
        groupOptions.value = Array.from(groupSet).map((g) => ({ value: g, label: g }))
      } catch (error: any) {
        ElMessage.error(error.message || t('historyRollback.getConfigListFailed') || '获取配置列表失败')
      }
    }

    const fetchHistoryList = async (pageNo = 1) => {
      if (!dataId.value || !group.value) {
        historyList.value = []
        totalCount.value = 0
        return
      }

      loading.value = true
      try {
        const response = await getHistoryList({
          dataId: dataId.value,
          groupName: group.value,
          pageNo,
          pageSize: pageSize.value,
        })

        if (response.pageItems) {
          historyList.value = response.pageItems
          totalCount.value = response.totalCount || 0
          pageNumber.value = response.pageNumber || pageNo
        } else {
          historyList.value = []
          totalCount.value = 0
        }
      } catch (error: any) {
        ElMessage.error(error.message || t('historyRollback.getHistoryListFailed') || '获取历史版本列表失败')
        historyList.value = []
        totalCount.value = 0
      } finally {
        loading.value = false
      }
    }

    const handleSearch = () => {
      if (!dataId.value) {
        ElMessage.warning(t('config.dataIdRequired') || 'Data ID 不能为空')
        return
      }
      if (!group.value) {
        ElMessage.warning(t('config.groupRequired') || 'Group 不能为空')
        return
      }

      urlParams.setParams({
        historyDataId: dataId.value,
        historyGroup: group.value,
      })

      pageNumber.value = 1
      fetchHistoryList(1)
    }

    const handleViewDetail = (row: HistoryItem) => {
      router.push({
        name: 'HistoryDetail',
        query: {
          dataId: row.dataId,
          group: row.groupName,
          nid: row.id,
          namespace: currentNamespace.value,
        },
      })
    }

    const handleRollback = (row: HistoryItem) => {
      if (row.publishType === 'gray') {
        ElMessage.warning(t('historyRollback.grayCannotRollback') || '灰度版本不能回滚')
        return
      }

      router.push({
        name: 'ConfigRollback',
        query: {
          dataId: row.dataId,
          group: row.groupName,
          nid: row.id,
          namespace: currentNamespace.value,
        },
      })
    }

    const handleCompare = async (row: HistoryItem) => {
      try {
        loading.value = true

        // 获取最新版本配置
        const latestConfig = await getConfigDetail({
          dataId: row.dataId,
          group: row.groupName,
          namespaceId: currentNamespace.value,
        })

        // 获取历史版本配置
        const historyConfig = await getHistoryDetail({
          dataId: row.dataId,
          groupName: row.groupName,
          nid: row.id,
        })

        if (diffEditorDialogRef.value) {
          // 检测配置类型（从历史配置或最新配置中获取）
          const configType = historyConfig.type || latestConfig.type || 'text'
          
          ;(diffEditorDialogRef.value as any).openDialog(
            historyConfig.content || '',
            latestConfig.content || '',
            {
              title: t('historyRollback.compareTitle') || '版本对比',
              currentArea: t('historyRollback.selectedVersion') || '选中版本',
              originalArea: t('historyRollback.latestVersion') || '最新版本',
              language: configType,
            }
          )
        }
      } catch (error: any) {
        ElMessage.error(error.message || t('historyRollback.compareFailed') || '版本对比失败')
      } finally {
        loading.value = false
      }
    }

    const handlePageChange = (page: number) => {
      pageNumber.value = page
      fetchHistoryList(page)
    }

    const handlePageSizeChange = (size: number) => {
      pageSize.value = size
      pageNumber.value = 1
      fetchHistoryList(1)
    }

    const formatTime = (time: string) => {
      if (!time) return ''
      try {
        const date = new Date(time)
        return date.toLocaleString('zh-CN')
      } catch (e) {
        return ''
      }
    }

    // ✅ Composition API: 生命周期钩子
    onMounted(async () => {
      await fetchHistoryConfigs()
      if (dataId.value && group.value) {
        await fetchHistoryList()
      }
    })

    // ✅ Composition API: 返回渲染函数
    return () => (
      <div class="p-6">
        {/* 页面标题 */}
        <PageTitle
          title={t('historyRollback.title') || '历史版本'}
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
            <ElFormItem label={t('config.dataId') || 'Data ID'} required>
              <ElSelect
                modelValue={dataId.value}
                onUpdate:modelValue={(val: string) => {
                  dataId.value = val || ''
                  urlParams.setParams({ historyDataId: dataId.value })
                }}
                filterable
                clearable
                placeholder={t('config.dataId') || '请选择 Data ID'}
                style="width: 200px"
              >
                {dataIdOptions.value.map((option) => (
                  <ElOption key={option.value} label={option.label} value={option.value} />
                ))}
              </ElSelect>
            </ElFormItem>
            <ElFormItem label={t('config.group') || 'Group'} required>
              <ElSelect
                modelValue={group.value}
                onUpdate:modelValue={(val: string) => {
                  group.value = val || ''
                  urlParams.setParams({ historyGroup: group.value })
                }}
                filterable
                clearable
                placeholder={t('config.group') || '请选择 Group'}
                style="width: 200px"
              >
                {groupOptions.value.map((option) => (
                  <ElOption key={option.value} label={option.label} value={option.value} />
                ))}
              </ElSelect>
            </ElFormItem>
            <ElFormItem>
              <ElButton type="primary" onClick={handleSearch}>
                {t('common.query') || '查询'}
              </ElButton>
            </ElFormItem>
          </ElForm>
        </ElCard>

        {/* 查询结果 */}
        <div class="mb-4">
          <QueryResult total={totalCount.value} />
        </div>

        {/* 历史版本列表 */}
        <ElCard>
          <ElTable
            {...{
              loading: loading.value,
              data: historyList.value,
              stripe: true,
              style: 'width: 100%',
            }}
          >
            <ElTableColumn prop="dataId" label={t('config.dataId') || 'Data ID'} minWidth={200} />
            <ElTableColumn prop="groupName" label={t('config.group') || 'Group'} width={150} />
            <ElTableColumn label={t('historyRollback.publishType') || '发布类型'} width={120}>
              {{
                default: ({ row }: { row: HistoryItem }) => {
                  if (row.publishType === 'formal') {
                    return <ElTag>{t('historyRollback.formal') || '正式'}</ElTag>
                  } else if (row.publishType === 'gray') {
                    const extInfo = row.extInfo ? JSON.parse(row.extInfo) : {}
                    const grayName = extInfo.gray_name ? `（${extInfo.gray_name}）` : ''
                    return <ElTag type="info">{t('historyRollback.gray') || '灰度'}{grayName}</ElTag>
                  }
                  return <span>{row.publishType}</span>
                },
              }}
            </ElTableColumn>
            <ElTableColumn prop="srcUser" label={t('historyRollback.operator') || '操作人'} width={120} />
            <ElTableColumn label={t('historyRollback.lastUpdateTime') || '最后更新时间'} width={180}>
              {{
                default: ({ row }: { row: HistoryItem }) => formatTime(row.modifyTime),
              }}
            </ElTableColumn>
            <ElTableColumn label={t('common.operation') || '操作'} width={250} fixed="right">
              {{
                default: ({ row }: { row: HistoryItem }) => (
                  <div class="flex items-center gap-2">
                    <ElLink type="primary" onClick={() => handleViewDetail(row)}>
                      {t('common.detail') || '详情'}
                    </ElLink>
                    <span>|</span>
                    <ElLink
                      type={row.publishType === 'gray' ? 'info' : 'primary'}
                      disabled={row.publishType === 'gray'}
                      onClick={() => handleRollback(row)}
                    >
                      {t('historyRollback.rollback') || '回滚'}
                    </ElLink>
                    <span>|</span>
                    <ElLink type="primary" onClick={() => handleCompare(row)}>
                      {t('historyRollback.compare') || '对比'}
                    </ElLink>
                  </div>
                ),
              }}
            </ElTableColumn>
          </ElTable>

          {/* 分页 */}
          <div class="mt-4 flex justify-end">
            <ElPagination
              {...{
                'current-page': pageNumber.value,
                'onUpdate:current-page': handlePageChange,
                'page-size': pageSize.value,
                'onUpdate:page-size': handlePageSizeChange,
                total: totalCount.value,
                'page-sizes': [10, 20, 50, 100],
                layout: 'total, sizes, prev, pager, next, jumper',
              }}
              v-slots={{
                total: () => <TotalRender total={totalCount.value} />,
              }}
            />
          </div>
        </ElCard>

        {/* 版本对比对话框 */}
        <DiffEditorDialog ref={diffEditorDialogRef} />
      </div>
    )
  },
})
