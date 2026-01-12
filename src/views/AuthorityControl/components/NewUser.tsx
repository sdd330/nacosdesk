/**
 * NewUser 组件
 * 新建用户对话框
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/AuthorityControl/UserManagement/NewUser.js
 */

import { defineComponent, ref, reactive } from 'vue'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElMessage,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import { useAuthorityStore } from '@/stores/authority'

export default defineComponent({
  name: 'NewUser',
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
      username: '',
      password: '',
      rePassword: '',
    })
    const errors = reactive<Record<string, string>>({})

    // 验证表单
    const validate = (): boolean => {
      errors.username = ''
      errors.password = ''
      errors.rePassword = ''

      if (!formData.username) {
        errors.username = t('newUser.usernameError')
        return false
      }

      if (!formData.password) {
        errors.password = t('newUser.passwordError')
        return false
      }

      if (!formData.rePassword) {
        errors.rePassword = t('newUser.rePasswordError')
        return false
      }

      if (formData.password !== formData.rePassword) {
        errors.rePassword = t('newUser.rePasswordError2')
        return false
      }

      return true
    }

    // 确认创建
    const handleConfirm = async () => {
      if (!validate()) return

      loading.value = true
      try {
        await authorityStore.addUser({
          username: formData.username,
          password: formData.password,
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
      formData.username = ''
      formData.password = ''
      formData.rePassword = ''
      errors.username = ''
      errors.password = ''
      errors.rePassword = ''
    }

    return () => (
      <ElDialog
        v-model={props.modelValue}
        title={t('newUser.createUser')}
        width="400px"
        onClose={handleClose}
       v-slots={
          footer: () => (
            <div class="flex justify-end gap-2">
            <ElButton onClick={handleClose}>{t('newUser.cancel')}</ElButton>
            <ElButton type="primary" loading={loading.value} onClick={handleConfirm}>
              {t('newUser.confirm')}
            </ElButton>
          </div>
          ),
        }
      >
        <ElForm label-width="100px">
          <ElFormItem label={t('newUser.username')} required error={errors.username}>
            <ElInput
              modelValue={formData.username}
              placeholder={t('newUser.usernamePlaceholder')}
              onUpdate:modelValue={(val: string) => {
                formData.username = val.trim()
                errors.username = ''
              }}
            />
          </ElFormItem>
          <ElFormItem label={t('newUser.password')} required error={errors.password}>
            <ElInput
              type="password"
              modelValue={formData.password}
              placeholder={t('newUser.passwordPlaceholder')}
              show-password
              onUpdate:modelValue={(val: string) => {
                formData.password = val
                errors.password = ''
              }}
            />
          </ElFormItem>
          <ElFormItem label={t('newUser.rePassword')} required error={errors.rePassword}>
            <ElInput
              type="password"
              modelValue={formData.rePassword}
              placeholder={t('newUser.rePasswordPlaceholder')}
              show-password
              onUpdate:modelValue={(val: string) => {
                formData.rePassword = val
                errors.rePassword = ''
              }}
            />
          </ElFormItem>
        </ElForm>

        
      </ElDialog>
    )
  },
})

