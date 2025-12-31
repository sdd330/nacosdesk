/**
 * PermissionsManagement 页面
 * 权限管理
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/AuthorityControl/PermissionsManagement/PermissionsManagement.js
 */

import { defineComponent, ref, reactive, onMounted, computed } from 'vue'
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElTable,
  ElTableColumn,
  ElPagination,
  ElMessage,
  ElMessageBox,
  ElSwitch,
  ElLoading,
} from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'
import { useAuthorityStore } from '@/stores/authority'
import { getNamespaceList } from '@/api/namespace'
import { checkPermission } from '@/api/authority'
import NewPermissions from './components/NewPermissions'

export default defineComponent({
  name: 'PermissionsManagement',
  setup() {
    const { t } = useI18n()
    const authorityStore = useAuthorityStore()

    // 状态管理
    const loading = ref(false)
    const pageNo = ref(1)
    const pageSize = ref(9)
    const role = ref('')
    const defaultFuzzySearch = ref(true)
    const namespaces = ref<Array<{ namespace: string; namespaceShowName: string }>>([])

    // 对话框状态
    const createPermissionVisible = ref(false)

    // 获取命名空间列表
    const fetchNamespaces = async () => {
      try {
        const res = await getNamespaceList()
        if (res.code === 0 && res.data) {
          namespaces.value = res.data
        }
      } catch (error: any) {
        // 忽略错误
      }
    }

    // 获取权限列表
    const fetchPermissions = async () => {
      loading.value = true
      try {
        let searchRole = role.value
        let searchType: 'accurate' | 'blur' = 'accurate'

        if (defaultFuzzySearch.value) {
          if (searchRole && searchRole !== '') {
            searchRole = `*${searchRole}*`
          }
        }

        if (searchRole && searchRole.indexOf('*') !== -1) {
          searchType = 'blur'
        }

        await authorityStore.fetchPermissions({
          pageNo: pageNo.value,
          pageSize: pageSize.value,
          role: searchRole || undefined,
          search: searchType,
        })
      } catch (error: any) {
        ElMessage.error(error.message || t('permissionsManagement.queryFailed'))
      } finally {
        loading.value = false
      }
    }

    // 切换模糊搜索模式
    const handleFuzzySwitchChange = () => {
      defaultFuzzySearch.value = !defaultFuzzySearch.value
    }

    // 搜索
    const handleSearch = () => {
      pageNo.value = 1
      fetchPermissions()
    }

    // 分页变化
    const handlePageChange = (page: number) => {
      pageNo.value = page
      fetchPermissions()
    }

    // 删除权限
    const handleDelete = async (permission: any) => {
      try {
        await ElMessageBox.confirm(
          t('permissionsManagement.deletePermissionTip'),
          t('permissionsManagement.deletePermission'),
          {
            type: 'warning',
          }
        )

        await authorityStore.removePermission({
          role: permission.role,
          resource: permission.resource,
          action: permission.action,
        })
        pageNo.value = 1
        await fetchPermissions()
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error(error.message || t('permissionsManagement.deleteFailed'))
        }
      }
    }

    // 获取动作文本
    const getActionText = (action: string) => {
      const actionMap: Record<string, string> = {
        r: `${t('permissionsManagement.readOnly')} (r)`,
        w: `${t('permissionsManagement.writeOnly')} (w)`,
        rw: `${t('permissionsManagement.readWrite')} (rw)`,
      }
      return actionMap[action] || action
    }

    // 获取资源显示文本
    const getResourceText = (resource: string) => {
      const [namespaceId] = resource.split(':')
      const namespace = namespaces.value.find((ns) => ns.namespace === namespaceId)
      if (namespace) {
        return `${namespace.namespaceShowName} (${namespace.namespace})`
      }
      return resource
    }

    // 创建权限成功回调
    const handleCreatePermissionSuccess = async () => {
      pageNo.value = 1
      await fetchPermissions()
    }

    // 组件挂载时获取权限列表和命名空间列表
    onMounted(() => {
      fetchNamespaces()
      fetchPermissions()
    })

    return () => (
      <div class="permissions-management-container p-4">
        <ElLoading v-loading={loading.value} text="Loading...">
          <ElCard class="mb-4">
            <ElForm inline>
              <ElFormItem label={t('permissionsManagement.role')}>
                <ElInput
                  modelValue={role.value}
                  placeholder={defaultFuzzySearch.value ? t('permissionsManagement.defaultFuzzyd') : t('permissionsManagement.fuzzyd')}
                  style="width: 200px"
                  onUpdate:modelValue={(val: string) => {
                    role.value = val
                  }}
                  onKeydown={(e: KeyboardEvent) => {
                    if (e.key === 'Enter') {
                      handleSearch()
                    }
                  }}
                />
              </ElFormItem>
              <ElFormItem label={t('permissionsManagement.fuzzydMode')}>
                <ElSwitch
                  modelValue={defaultFuzzySearch.value}
                  onUpdate:modelValue={handleFuzzySwitchChange}
                />
              </ElFormItem>
              <ElFormItem>
                <ElButton type="primary" icon={Search} onClick={handleSearch}>
                  {t('permissionsManagement.query')}
                </ElButton>
              </ElFormItem>
              <ElFormItem style="float: right">
                <ElButton type="primary" icon={Plus} onClick={() => (createPermissionVisible.value = true)}>
                  {t('permissionsManagement.addPermission')}
                </ElButton>
              </ElFormItem>
            </ElForm>
          </ElCard>

          <ElCard>
            <ElTable
              data={authorityStore.permissions}
              v-loading={authorityStore.loading}
              max-height={476}
              stripe
            >
              <ElTableColumn prop="role" label={t('permissionsManagement.role')} />
              <ElTableColumn
                prop="resource"
                label={t('permissionsManagement.resource')}
                formatter={(row: any) => getResourceText(row.resource)}
              />
              <ElTableColumn
                prop="action"
                label={t('permissionsManagement.action')}
                formatter={(row: any) => getActionText(row.action)}
              />
              <ElTableColumn label={t('permissionsManagement.operation')} width="150" fixed="right">
                {{
                  default: ({ row }: { row: any }) => (
                    <ElButton
                      type="danger"
                      size="small"
                      onClick={() => handleDelete(row)}
                    >
                      {t('permissionsManagement.deletePermission')}
                    </ElButton>
                  ),
                }}
              </ElTableColumn>
            </ElTable>

            {authorityStore.permissionTotalCount > pageSize.value && (
              <ElPagination
                class="mt-4"
                total={authorityStore.permissionTotalCount}
                page-size={pageSize.value}
                current-page={pageNo.value}
                layout="total, prev, pager, next"
                onUpdate:current-page={handlePageChange}
              />
            )}
          </ElCard>

          <NewPermissions
            v-model={createPermissionVisible.value}
            namespaces={namespaces.value}
            onSuccess={handleCreatePermissionSuccess}
          />
        </ElLoading>
      </div>
    )
  },
})
