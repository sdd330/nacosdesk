/**
 * RolesManagement 页面
 * 角色管理
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/AuthorityControl/RolesManagement/RolesManagement.js
 */

import { defineComponent, ref, reactive, onMounted } from 'vue'
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
import NewRole from './components/NewRole'

export default defineComponent({
  name: 'RolesManagement',
  setup() {
    const { t } = useI18n()
    const authorityStore = useAuthorityStore()

    // 状态管理
    const loading = ref(false)
    const pageNo = ref(1)
    const pageSize = ref(9)
    const username = ref('')
    const role = ref('')
    const defaultFuzzySearch = ref(true)

    // 对话框状态
    const createRoleVisible = ref(false)

    // 获取角色列表
    const fetchRoles = async () => {
      loading.value = true
      try {
        let searchUsername = username.value
        let searchRole = role.value
        let searchType: 'accurate' | 'blur' = 'accurate'

        if (defaultFuzzySearch.value) {
          if (searchUsername && searchUsername !== '') {
            searchUsername = `*${searchUsername}*`
          }
          if (searchRole && searchRole !== '') {
            searchRole = `*${searchRole}*`
          }
        }

        if (searchRole && searchRole.indexOf('*') !== -1) {
          searchType = 'blur'
        }
        if (searchUsername && searchUsername.indexOf('*') !== -1) {
          searchType = 'blur'
        }

        await authorityStore.fetchRoles({
          pageNo: pageNo.value,
          pageSize: pageSize.value,
          role: searchRole || undefined,
          username: searchUsername || undefined,
          search: searchType,
        })
      } catch (error: any) {
        ElMessage.error(error.message || t('rolesManagement.queryFailed'))
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
      fetchRoles()
    }

    // 分页变化
    const handlePageChange = (page: number) => {
      pageNo.value = page
      fetchRoles()
    }

    // 删除角色
    const handleDelete = async (roleItem: any) => {
      if (roleItem.role === 'ROLE_ADMIN') {
        return
      }

      try {
        await ElMessageBox.confirm(t('rolesManagement.deleteRoleTip'), t('rolesManagement.deleteRole'), {
          type: 'warning',
        })

        await authorityStore.removeRole(roleItem.role)
        pageNo.value = 1
        await fetchRoles()
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error(error.message || t('rolesManagement.deleteFailed'))
        }
      }
    }

    // 创建角色成功回调
    const handleCreateRoleSuccess = async () => {
      await fetchRoles()
    }

    // 组件挂载时获取角色列表
    onMounted(() => {
      fetchRoles()
    })

    return () => (
      <div class="roles-management-container p-4">
        <ElLoading v-loading={loading.value} text="Loading...">
          <ElCard class="mb-4">
            <ElForm inline>
              <ElFormItem label={t('rolesManagement.username')}>
                <ElInput
                  modelValue={username.value}
                  placeholder={defaultFuzzySearch.value ? t('rolesManagement.defaultFuzzyd') : t('rolesManagement.fuzzyd')}
                  style="width: 200px"
                  onUpdate:modelValue={(val: string) => {
                    username.value = val
                  }}
                  onKeydown={(e: KeyboardEvent) => {
                    if (e.key === 'Enter') {
                      handleSearch()
                    }
                  }}
                />
              </ElFormItem>
              <ElFormItem label={t('rolesManagement.role')}>
                <ElInput
                  modelValue={role.value}
                  placeholder={defaultFuzzySearch.value ? t('rolesManagement.defaultFuzzyd') : t('rolesManagement.fuzzyd')}
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
              <ElFormItem label={t('rolesManagement.fuzzydMode')}>
                <ElSwitch
                  modelValue={defaultFuzzySearch.value}
                  onUpdate:modelValue={handleFuzzySwitchChange}
                />
              </ElFormItem>
              <ElFormItem>
                <ElButton type="primary" icon={Search} onClick={handleSearch}>
                  {t('rolesManagement.query')}
                </ElButton>
              </ElFormItem>
              <ElFormItem style="float: right">
                <ElButton type="primary" icon={Plus} onClick={() => (createRoleVisible.value = true)}>
                  {t('rolesManagement.bindingRoles')}
                </ElButton>
              </ElFormItem>
            </ElForm>
          </ElCard>

          <ElCard>
            <ElTable
              data={authorityStore.roles}
              v-loading={authorityStore.loading}
              max-height={476}
              stripe
            >
              <ElTableColumn prop="role" label={t('rolesManagement.role')} />
              <ElTableColumn prop="username" label={t('rolesManagement.username')} />
              <ElTableColumn label={t('rolesManagement.operation')} width="150" fixed="right">
                {{
                  default: ({ row }: { row: any }) => {
                    if (row.role === 'ROLE_ADMIN') {
                      return null
                    }
                    return (
                      <ElButton
                        type="danger"
                        size="small"
                        onClick={() => handleDelete(row)}
                      >
                        {t('rolesManagement.deleteRole')}
                      </ElButton>
                    )
                  },
                }}
              </ElTableColumn>
            </ElTable>

            {authorityStore.roleTotalCount > pageSize.value && (
              <ElPagination
                class="mt-4"
                total={authorityStore.roleTotalCount}
                page-size={pageSize.value}
                current-page={pageNo.value}
                layout="total, prev, pager, next"
                onUpdate:current-page={handlePageChange}
              />
            )}
          </ElCard>

          <NewRole
            v-model={createRoleVisible.value}
            onSuccess={handleCreateRoleSuccess}
          />
        </ElLoading>
      </div>
    )
  },
})
