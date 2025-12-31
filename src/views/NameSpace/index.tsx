/**
 * NameSpace 页面
 * 命名空间管理
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/NameSpace/NameSpace.js
 */

import { defineComponent, ref, reactive, onMounted, computed } from 'vue'
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElButton,
  ElTable,
  ElTableColumn,
  ElMessage,
  ElMessageBox,
  ElLoading,
  ElDialog,
} from 'element-plus'
import { Plus, Refresh, View, Edit, Delete } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'
import { useNamespaceStore } from '@/stores/namespace'
import { urlParams } from '@/utils/urlParams'
import PageTitle from '@/components/PageTitle/index'
import NewNameSpace from './components/NewNameSpace'
import EditorNameSpace from './components/EditorNameSpace'
import type { Namespace } from '@/api/namespace'

export default defineComponent({
  name: 'NameSpace',
  setup() {
    const { t } = useI18n()
    const namespaceStore = useNamespaceStore()

    // 状态管理
    const loading = ref(false)
    const defaultNamespace = ref('')
    const defaultNamespaceName = ref('public')

    // 对话框状态
    const detailDialogVisible = ref(false)
    const detailNamespace = ref<Namespace | null>(null)

    // 获取命名空间列表
    const fetchNamespaces = async () => {
      loading.value = true
      try {
        await namespaceStore.fetchNamespaceList()
        // 查找默认命名空间（type === 1）
        const defaultNs = namespaceStore.namespaceList.find((ns) => ns.type === 1)
        if (defaultNs) {
          defaultNamespace.value = defaultNs.namespace
          defaultNamespaceName.value = defaultNs.namespaceShowName || 'public'
        }
      } catch (error: any) {
        ElMessage.error(error.message || t('namespace.queryFailed'))
      } finally {
        loading.value = false
      }
    }

    // 查看详情
    const handleDetail = async (record: Namespace) => {
      loading.value = true
      try {
        const detail = await namespaceStore.fetchNamespaceDetail(record.namespace)
        if (detail) {
          detailNamespace.value = detail
          detailDialogVisible.value = true
        }
      } catch (error: any) {
        ElMessage.error(error.message || t('namespace.getDetailFailed'))
      } finally {
        loading.value = false
      }
    }

    // 删除命名空间
    const handleDelete = async (record: Namespace) => {
      if (record.type === 0) {
        ElMessage.warning(t('namespace.cannotDeletePublic'))
        return
      }

      try {
        await ElMessageBox.confirm(
          <div>
            <h3>{t('namespace.confirmDelete')}</h3>
            <p>
              <span style="color: #999; margin-right: 5px">{t('namespace.namespaceName')}:</span>
              <span style="color: #c7254e">{record.namespaceShowName}</span>
            </p>
            <p>
              <span style="color: #999; margin-right: 5px">{t('namespace.namespaceId')}:</span>
              <span style="color: #c7254e">{record.namespace}</span>
            </p>
          </div>,
          t('namespace.removeNamespace'),
          {
            type: 'warning',
            dangerouslyUseHTMLString: false,
          }
        )

        await namespaceStore.removeNamespace(record.namespace)

        // 如果删除的是当前命名空间，切换到默认命名空间
        const currentNamespace = urlParams.getParams('namespace')
        if (record.namespace === currentNamespace) {
          urlParams.setParams({ namespace: defaultNamespace.value })
          if (typeof window !== 'undefined') {
            ;(window as any).nownamespace = defaultNamespace.value
            ;(window as any).namespaceShowName = defaultNamespaceName.value
          }
        }

        await fetchNamespaces()
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error(error.message || t('namespace.deleteFailed'))
        }
      }
    }

    // 渲染命名空间名称
    const renderName = (record: Namespace) => {
      if (record.type === 0) {
        return t('namespace.namespacePublic')
      }
      return record.namespaceShowName
    }

    // 渲染操作列
    const renderOperation = (record: Namespace) => {
      const isPublic = record.type === 0
      return (
        <div class="flex gap-2">
          <ElButton type="primary" link size="small" onClick={() => handleDetail(record)}>
            {t('namespace.details')}
          </ElButton>
          {isPublic ? (
            <>
              <ElButton type="info" link size="small" disabled>
                {t('namespace.namespaceDelete')}
              </ElButton>
              <ElButton type="info" link size="small" disabled>
                {t('namespace.edit')}
              </ElButton>
            </>
          ) : (
            <>
              <ElButton type="danger" link size="small" onClick={() => handleDelete(record)}>
                {t('namespace.namespaceDelete')}
              </ElButton>
              <ElButton type="primary" link size="small" onClick={() => openEditDialog(record)}>
                {t('namespace.edit')}
              </ElButton>
            </>
          )}
        </div>
      )
    }

    // 打开编辑对话框
    const editNamespaceRef = ref<InstanceType<typeof EditorNameSpace> | null>(null)
    const openEditDialog = (record: Namespace) => {
      editNamespaceRef.value?.show(record)
    }

    // 打开新建对话框
    const newNamespaceRef = ref<InstanceType<typeof NewNameSpace> | null>(null)
    const openNewDialog = () => {
      newNamespaceRef.value?.show(namespaceStore.namespaceList)
    }

    // 组件挂载时获取命名空间列表
    onMounted(() => {
      fetchNamespaces()
    })

    return () => (
      <div class="namespace-container p-4">
        <ElLoading v-loading={loading.value} text="Loading...">
          <PageTitle title={t('namespace.title')} />

          <ElCard class="mb-4">
            <ElForm inline>
              <ElFormItem>
                <ElButton type="primary" icon={Plus} onClick={openNewDialog}>
                  {t('namespace.namespaceAdd')}
                </ElButton>
              </ElFormItem>
              <ElFormItem>
                <ElButton icon={Refresh} onClick={fetchNamespaces}>
                  {t('namespace.refresh')}
                </ElButton>
              </ElFormItem>
            </ElForm>
          </ElCard>

          <ElCard>
            <ElTable
              data={namespaceStore.namespaceList}
              v-loading={namespaceStore.loading}
              empty-text={t('namespace.noData')}
            >
              <ElTableColumn
                prop="namespaceShowName"
                label={t('namespace.namespaceNames')}
                formatter={(row: Namespace) => renderName(row)}
              />
              <ElTableColumn prop="namespace" label={t('namespace.namespaceNumber')} />
              <ElTableColumn prop="namespaceDesc" label={t('namespace.description')} />
              <ElTableColumn prop="configCount" label={t('namespace.configuration')} />
              <ElTableColumn label={t('namespace.namespaceOperation')} width="250" fixed="right">
                {{
                  default: ({ row }: { row: Namespace }) => renderOperation(row),
                }}
              </ElTableColumn>
            </ElTable>
          </ElCard>

          {/* 详情对话框 */}
          <ElDialog
            v-model={detailDialogVisible.value}
            title={t('namespace.namespaceDetails')}
            width="500px"
          >
            {detailNamespace.value && (
              <div class="namespace-detail">
                <p>
                  <span style="color: #999; margin-right: 5px">{t('namespace.namespaceName')}:</span>
                  <span style="color: #c7254e">{detailNamespace.value.namespaceShowName}</span>
                </p>
                <p>
                  <span style="color: #999; margin-right: 5px">{t('namespace.namespaceId')}:</span>
                  <span style="color: #c7254e">{detailNamespace.value.namespace}</span>
                </p>
                <p>
                  <span style="color: #999; margin-right: 5px">{t('namespace.configuration')}:</span>
                  <span style="color: #c7254e">
                    {detailNamespace.value.configCount || 0} / {detailNamespace.value.quota || '-'}
                  </span>
                </p>
                <p>
                  <span style="color: #999; margin-right: 5px">{t('namespace.description')}:</span>
                  <span style="color: #c7254e">{detailNamespace.value.namespaceDesc || '-'}</span>
                </p>
              </div>
            )}
          </ElDialog>

          <NewNameSpace ref={newNamespaceRef} onSuccess={fetchNamespaces} />
          <EditorNameSpace ref={editNamespaceRef} onSuccess={fetchNamespaces} />
        </ElLoading>
      </div>
    )
  },
})
