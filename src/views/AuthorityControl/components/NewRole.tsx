/**
 * NewRole 组件
 * 新建角色对话框
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/AuthorityControl/RolesManagement/NewRole.js
 */

import { defineComponent, ref, reactive } from 'vue'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElAutocomplete,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import { useAuthorityStore } from '@/stores/authority'
import { searchUsers } from '@/api/authority'

export default defineComponent({
  name: 'NewRole',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    onSuccess: {
      type: Function,
      default: () => {},
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const authorityStore = useAuthorityStore()

    const loading = ref(false)
    const formData = reactive({
      role: '',
      username: '',
    })
    const errors = reactive<Record<string, string>>({})
    const usernameOptions = ref<string[]>([])

    // 搜索用户名
    const handleUsernameSearch = async (query: string) => {
      if (query.length > 0) {
        try {
          const res = await searchUsers(query)
          if (res.code === 0 && res.data) {
            usernameOptions.value = Array.isArray(res.data) ? res.data : []
          }
        } catch (error: any) {
          // 忽略错误
        }
      }
    }

    // 验证表单
    const validate = (): boolean => {
      errors.role = ''
      errors.username = ''

      if (!formData.role) {
        errors.role = t('newRole.roleError')
        return false
      }

      if (!formData.username) {
        errors.username = t('newRole.usernameError')
        return false
      }

      return true
    }

    // 确认创建
    const handleConfirm = async () => {
      if (!validate()) return

      loading.value = true
      try {
        await authorityStore.addRole({
          role: formData.role,
          username: formData.username,
        })
        emit('update:modelValue', false)
        resetForm()
        props.onSuccess()
      } catch (error: any) {
        // 错误已在 store 中处理
      } finally {
        loading.value = false
      }
    }

    // 关闭对话框
    const handleClose = () => {
      emit('update:modelValue', false)
      resetForm()
    }

    // 重置表单
    const resetForm = () => {
      formData.role = ''
      formData.username = ''
      errors.role = ''
      errors.username = ''
      usernameOptions.value = []
    }

    return () => (
      <ElDialog
        v-model={props.modelValue}
        title={t('newRole.bindingRoles')}
        width="400px"
        onClose={handleClose}
       v-slots={
          footer: () => (
            <div class="flex justify-end gap-2">
            <ElButton onClick={handleClose}>{t('newRole.cancel')}</ElButton>
            <ElButton type="primary" loading={loading.value} onClick={handleConfirm}>
              {t('newRole.confirm')}
            </ElButton>
          </div>
          ),
        }
      >
        <ElForm label-width="100px">
          <ElFormItem label={t('newRole.role')} required error={errors.role}>
            <ElInput
              modelValue={formData.role}
              placeholder={t('newRole.rolePlaceholder')}
              onUpdate:modelValue={(val: string) => {
                formData.role = val.trim()
                errors.role = ''
              }}
            />
          </ElFormItem>
          <ElFormItem label={t('newRole.username')} required error={errors.username}>
            <ElAutocomplete
              modelValue={formData.username}
              placeholder={t('newRole.usernamePlaceholder')}
              fetch-suggestions={handleUsernameSearch}
              onUpdate:modelValue={(val: string) => {
                formData.username = val
                errors.username = ''
              }}
              style="width: 100%"
            />
          </ElFormItem>
        </ElForm>

        
      </ElDialog>
    )
  },
})

