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

export default defineComponent({
  name: 'NewRole',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    onOk: {
      type: Function,
      required: true,
    },
    onCancel: {
      type: Function,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n()
    const authorityStore = useAuthorityStore()

    const form = reactive({
      role: '',
      username: '',
    })

    const errors = reactive<Record<string, string>>({})
    const userOptions = ref<Array<{ value: string }>>([])

    // 搜索用户
    const handleUserSearch = async (query: string) => {
      if (query.length > 0) {
        const users = await authorityStore.searchUsersList(query)
        userOptions.value = users.map((user: any) => ({ value: user.username }))
      } else {
        userOptions.value = []
      }
    }

    // 验证表单
    const validate = (): boolean => {
      errors.role = ''
      errors.username = ''

      if (!form.role) {
        errors.role = t('newRole.roleError')
        return false
      }

      if (!form.username) {
        errors.username = t('newRole.usernameError')
        return false
      }

      return true
    }

    // 确认创建
    const handleConfirm = async () => {
      if (!validate()) return

      try {
        await props.onOk([form.role, form.username])
        handleCancel()
      } catch (error) {
        // 错误已在 Store 中处理
      }
    }

    // 取消
    const handleCancel = () => {
      form.role = ''
      form.username = ''
      userOptions.value = []
      Object.keys(errors).forEach((key) => {
        delete errors[key]
      })
      props.onCancel()
    }

    return () => (
      <ElDialog
        v-model={props.visible}
        title={t('newRole.bindingRoles')}
        width="400px"
        onClose={handleCancel}
       v-slots={
          footer: () => (
            <div class="flex justify-end gap-2">
            <ElButton onClick={handleCancel}>{t('service.editService.cancel')}</ElButton>
            <ElButton type="primary" onClick={handleConfirm}>
              {t('service.editService.confirm')}
            </ElButton>
          </div>
          ),
        }
      >
        <ElForm label-width="100px">
          <ElFormItem
            label={t('newRole.role')}
            required
            error={errors.role}
          >
            <ElInput
              modelValue={form.role}
              placeholder={t('newRole.rolePlaceholder')}
              onUpdate:modelValue={(val: string) => {
                form.role = val.trim()
                if (errors.role) delete errors.role
              }}
            />
          </ElFormItem>
          <ElFormItem
            label={t('newRole.username')}
            required
            error={errors.username}
          >
            <ElAutocomplete
              modelValue={form.username}
              placeholder={t('newRole.usernamePlaceholder')}
              fetch-suggestions={handleUserSearch}
              onUpdate:modelValue={(val: string) => {
                form.username = val
                if (errors.username) delete errors.username
              }}
            />
          </ElFormItem>
        </ElForm>

        
      </ElDialog>
    )
  },
})

