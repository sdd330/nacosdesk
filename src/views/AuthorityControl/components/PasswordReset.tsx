/**
 * PasswordReset 组件
 * 密码重置对话框
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/AuthorityControl/UserManagement/PasswordReset.js
 */

import { defineComponent, ref, reactive } from 'vue'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import { useAuthorityStore } from '@/stores/authority'

export default defineComponent({
  name: 'PasswordReset',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      default: '',
    },
    onSuccess: {
      type: Function,
      default: () => {},
    },
    onClose: {
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
      password: '',
      rePassword: '',
    })
    const errors = reactive<Record<string, string>>({})

    // 验证表单
    const validate = (): boolean => {
      errors.password = ''
      errors.rePassword = ''

      if (!formData.password) {
        errors.password = t('passwordReset.passwordError')
        return false
      }

      if (!formData.rePassword) {
        errors.rePassword = t('passwordReset.rePasswordError')
        return false
      }

      if (formData.password !== formData.rePassword) {
        errors.rePassword = t('passwordReset.rePasswordError2')
        return false
      }

      return true
    }

    // 确认重置
    const handleConfirm = async () => {
      if (!validate() || !props.username) return

      loading.value = true
      try {
        await authorityStore.resetPassword({
          username: props.username,
          newPassword: formData.password,
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
      props.onClose()
    }

    // 重置表单
    const resetForm = () => {
      formData.password = ''
      formData.rePassword = ''
      errors.password = ''
      errors.rePassword = ''
    }

    return () => (
      <ElDialog
        v-model={props.modelValue}
        title={t('passwordReset.resetPassword')}
        width="400px"
        onClose={handleClose}
       v-slots={
          footer: () => (
            <div class="flex justify-end gap-2">
            <ElButton onClick={handleClose}>{t('passwordReset.cancel')}</ElButton>
            <ElButton type="primary" loading={loading.value} onClick={handleConfirm}>
              {t('passwordReset.confirm')}
            </ElButton>
          </div>
          ),
        }
      >
        <ElForm label-width="100px">
          <ElFormItem label={t('passwordReset.username')} required>
            <p>{props.username}</p>
          </ElFormItem>
          <ElFormItem label={t('passwordReset.password')} required error={errors.password}>
            <ElInput
              type="password"
              modelValue={formData.password}
              placeholder={t('passwordReset.passwordPlaceholder')}
              show-password
              onUpdate:modelValue={(val: string) => {
                formData.password = val
                errors.password = ''
              }}
            />
          </ElFormItem>
          <ElFormItem label={t('passwordReset.rePassword')} required error={errors.rePassword}>
            <ElInput
              type="password"
              modelValue={formData.rePassword}
              placeholder={t('passwordReset.rePasswordPlaceholder')}
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

