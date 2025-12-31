/**
 * UserManagement 页面
 * 用户管理
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/AuthorityControl/UserManagement/UserManagement.js
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
import { urlParams } from '@/utils/urlParams'
import NewUser from './components/NewUser'
import PasswordReset from './components/PasswordReset'

export default defineComponent({
  name: 'UserManagement',
  setup() {
    const { t } = useI18n()
    const authorityStore = useAuthorityStore()

    // 状态管理
    const loading = ref(false)
    const pageNo = ref(1)
    const pageSize = ref(9)
    const username = ref(urlParams.getParams('username') || '')
    const defaultFuzzySearch = ref(true)

    // 对话框状态
    const createUserVisible = ref(false)
    const passwordResetUserVisible = ref(false)
    const passwordResetUser = ref<string>()

    // 获取用户列表
    const fetchUsers = async () => {
      loading.value = true
      try {
        let searchUsername = username.value
        let searchType: 'accurate' | 'blur' = 'blur'

        if (defaultFuzzySearch.value) {
          if (searchUsername && searchUsername !== '') {
            searchUsername = `*${searchUsername}*`
          }
        }

        if (searchUsername && searchUsername.indexOf('*') !== -1) {
          searchType = 'blur'
        } else {
          searchType = 'accurate'
        }

        await authorityStore.fetchUsers({
          pageNo: pageNo.value,
          pageSize: pageSize.value,
          username: searchUsername || undefined,
          search: searchType,
        })
      } catch (error: any) {
        ElMessage.error(error.message || t('userManagement.queryFailed'))
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
      urlParams.setParams({ username: username.value })
      fetchUsers()
    }

    // 分页变化
    const handlePageChange = (page: number) => {
      pageNo.value = page
      fetchUsers()
    }

    // 删除用户
    const handleDelete = async (username: string) => {
      try {
        await ElMessageBox.confirm(t('userManagement.deleteUserTip'), t('userManagement.deleteUser'), {
          type: 'warning',
        })

        await authorityStore.removeUser(username)
        pageNo.value = 1
        await fetchUsers()
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error(error.message || t('userManagement.deleteFailed'))
        }
      }
    }

    // 打开密码重置对话框
    const openPasswordReset = (username: string) => {
      passwordResetUser.value = username
      passwordResetUserVisible.value = true
    }

    // 关闭密码重置对话框
    const closePasswordReset = () => {
      passwordResetUser.value = undefined
      passwordResetUserVisible.value = false
    }

    // 创建用户成功回调
    const handleCreateUserSuccess = async () => {
      pageNo.value = 1
      await fetchUsers()
    }

    // 密码重置成功回调
    const handlePasswordResetSuccess = async () => {
      await fetchUsers()
    }

    // 组件挂载时获取用户列表
    onMounted(() => {
      if (username.value) {
        fetchUsers()
      }
    })

    return () => (
      <div class="user-management-container p-4">
        <ElLoading v-loading={loading.value} text="Loading...">
          <ElCard class="mb-4">
            <ElForm inline>
              <ElFormItem label={t('userManagement.username')}>
                <ElInput
                  modelValue={username.value}
                  placeholder={defaultFuzzySearch.value ? t('userManagement.defaultFuzzyd') : t('userManagement.fuzzyd')}
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
              <ElFormItem label={t('userManagement.fuzzydMode')}>
                <ElSwitch
                  modelValue={defaultFuzzySearch.value}
                  onUpdate:modelValue={handleFuzzySwitchChange}
                />
              </ElFormItem>
              <ElFormItem>
                <ElButton type="primary" icon={Search} onClick={handleSearch}>
                  {t('userManagement.query')}
                </ElButton>
              </ElFormItem>
              <ElFormItem style="float: right">
                <ElButton type="primary" icon={Plus} onClick={() => (createUserVisible.value = true)}>
                  {t('userManagement.createUser')}
                </ElButton>
              </ElFormItem>
            </ElForm>
          </ElCard>

          <ElCard>
            <ElTable
              data={authorityStore.users}
              v-loading={authorityStore.loading}
              max-height={476}
              stripe
            >
              <ElTableColumn prop="username" label={t('userManagement.username')} />
              <ElTableColumn
                prop="password"
                label={t('userManagement.password')}
                formatter={(row: any) => {
                  if (!row.password) return ''
                  return row.password.replace(/\S/g, '*')
                }}
              />
              <ElTableColumn label={t('userManagement.operation')} width="200" fixed="right">
                {{
                  default: ({ row }: { row: any }) => (
                    <div class="flex gap-2">
                      <ElButton
                        type="primary"
                        size="small"
                        onClick={() => openPasswordReset(row.username)}
                      >
                        {t('userManagement.resetPassword')}
                      </ElButton>
                      <ElButton
                        type="danger"
                        size="small"
                        onClick={() => handleDelete(row.username)}
                      >
                        {t('userManagement.deleteUser')}
                      </ElButton>
                    </div>
                  ),
                }}
              </ElTableColumn>
            </ElTable>

            {authorityStore.userTotalCount > pageSize.value && (
              <ElPagination
                class="mt-4"
                total={authorityStore.userTotalCount}
                page-size={pageSize.value}
                current-page={pageNo.value}
                layout="total, prev, pager, next"
                onUpdate:current-page={handlePageChange}
              />
            )}
          </ElCard>

          <NewUser
            v-model={createUserVisible.value}
            onSuccess={handleCreateUserSuccess}
          />
          <PasswordReset
            v-model={passwordResetUserVisible.value}
            username={passwordResetUser.value}
            onSuccess={handlePasswordResetSuccess}
            onClose={closePasswordReset}
          />
        </ElLoading>
      </div>
    )
  },
})
