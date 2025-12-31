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

export default defineComponent({
  name: 'PasswordReset',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      default: '',
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

    const formRef = ref()
    const form = reactive({
      password: '',
      rePassword: '',
    })

    const errors = reactive<Record<string, string>>({})

    // 验证表单
    const validate = (): boolean => {
      errors.password = ''
      errors.rePassword = ''

      if (!form.password) {
        errors.password = t('passwordReset.passwordError')
        return false
      }

      if (!form.rePassword) {
        errors.rePassword = t('passwordReset.rePasswordError')
        return false
      }

      if (form.password !== form.rePassword) {
        errors.rePassword = t('passwordReset.rePasswordError2')
        return false
      }

      return true
    }

    // 确认重置
    const handleConfirm = async () => {
      if (!validate()) return

      try {
        await props.onOk([props.username, form.password])
        handleCancel()
      } catch (error) {
        // 错误已在 Store 中处理
      }
    }

    // 取消
    const handleCancel = () => {
      form.password = ''
      form.rePassword = ''
      Object.keys(errors).forEach((key) => {
        delete errors[key]
      })
      props.onCancel()
    }

    return () => (
      <ElDialog
        v-model={props.visible}
        title={t('passwordReset.resetPassword')}
        width="400px"
        onClose={handleCancel}
      >
        <ElForm ref={formRef} label-width="100px">
          <ElFormItem label={t('passwordReset.username')} required>
            <p>{props.username}</p>
          </ElFormItem>
          <ElFormItem
            label={t('passwordReset.password')}
            required
            error={errors.password}
          >
            <ElInput
              type="password"
              modelValue={form.password}
              placeholder={t('passwordReset.passwordPlaceholder')}
              show-password
              onUpdate:modelValue={(val: string) => {
                form.password = val
                if (errors.password) delete errors.password
              }}
            />
          </ElFormItem>
          <ElFormItem
            label={t('passwordReset.rePassword')}
            required
            error={errors.rePassword}
          >
            <ElInput
              type="password"
              modelValue={form.rePassword}
              placeholder={t('passwordReset.rePasswordPlaceholder')}
              show-password
              onUpdate:modelValue={(val: string) => {
                form.rePassword = val
                if (errors.rePassword) delete errors.rePassword
              }}
            />
          </ElFormItem>
        </ElForm>

        <template #footer>
          <div class="flex justify-end gap-2">
            <ElButton onClick={handleCancel}>{t('service.editService.cancel')}</ElButton>
            <ElButton type="primary" onClick={handleConfirm}>
              {t('service.editService.confirm')}
            </ElButton>
          </div>
        </template>
      </ElDialog>
    )
  },
})

