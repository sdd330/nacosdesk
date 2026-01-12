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
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'

export default defineComponent({
  name: 'NewUser',
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

    const formRef = ref()
    const form = reactive({
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

      if (!form.username) {
        errors.username = t('newUser.usernameError')
        return false
      }

      if (!form.password) {
        errors.password = t('newUser.passwordError')
        return false
      }

      if (!form.rePassword) {
        errors.rePassword = t('newUser.rePasswordError')
        return false
      }

      if (form.password !== form.rePassword) {
        errors.rePassword = t('newUser.rePasswordError2')
        return false
      }

      return true
    }

    // 确认创建
    const handleConfirm = async () => {
      if (!validate()) return

      try {
        await props.onOk([form.username, form.password])
        handleCancel()
      } catch (error) {
        // 错误已在 Store 中处理
      }
    }

    // 取消
    const handleCancel = () => {
      form.username = ''
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
        title={t('newUser.createUser')}
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
        <ElForm ref={formRef} label-width="100px">
          <ElFormItem
            label={t('newUser.username')}
            required
            error={errors.username}
          >
            <ElInput
              modelValue={form.username}
              placeholder={t('newUser.usernamePlaceholder')}
              onUpdate:modelValue={(val: string) => {
                form.username = val.trim()
                if (errors.username) delete errors.username
              }}
            />
          </ElFormItem>
          <ElFormItem
            label={t('newUser.password')}
            required
            error={errors.password}
          >
            <ElInput
              type="password"
              modelValue={form.password}
              placeholder={t('newUser.passwordPlaceholder')}
              show-password
              onUpdate:modelValue={(val: string) => {
                form.password = val
                if (errors.password) delete errors.password
              }}
            />
          </ElFormItem>
          <ElFormItem
            label={t('newUser.rePassword')}
            required
            error={errors.rePassword}
          >
            <ElInput
              type="password"
              modelValue={form.rePassword}
              placeholder={t('newUser.rePasswordPlaceholder')}
              show-password
              onUpdate:modelValue={(val: string) => {
                form.rePassword = val
                if (errors.rePassword) delete errors.rePassword
              }}
            />
          </ElFormItem>
        </ElForm>

        
      </ElDialog>
    )
  },
})

