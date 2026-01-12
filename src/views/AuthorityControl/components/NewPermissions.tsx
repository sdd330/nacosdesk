/**
 * NewPermissions 组件
 * 新建权限对话框
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/AuthorityControl/PermissionsManagement/NewPermissions.js
 */

import { defineComponent, ref, reactive } from 'vue'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElButton,
  ElMessage,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import { useAuthorityStore } from '@/stores/authority'
import { checkPermission, searchRoles } from '@/api/authority'

export default defineComponent({
  name: 'NewPermissions',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    namespaces: {
      type: Array,
      default: () => [],
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
      resource: '',
      action: '',
    })
    const errors = reactive<Record<string, string>>({})
    const roleOptions = ref<string[]>([])

    // 搜索角色
    const handleRoleSearch = async (query: string) => {
      if (query.length > 0) {
        try {
          const res = await searchRoles(query)
          if (res.code === 0 && res.data) {
            roleOptions.value = Array.isArray(res.data) ? res.data : []
          }
        } catch (error: any) {
          // 忽略错误
        }
      }
    }

    // 验证表单
    const validate = (): boolean => {
      errors.role = ''
      errors.resource = ''
      errors.action = ''

      if (!formData.role) {
        errors.role = t('newPermissions.roleError')
        return false
      }

      if (!formData.resource) {
        errors.resource = t('newPermissions.resourceError')
        return false
      }

      if (!formData.action) {
        errors.action = t('newPermissions.actionError')
        return false
      }

      return true
    }

    // 确认创建
    const handleConfirm = async () => {
      if (!validate()) return

      // 先检查权限是否已存在
      try {
        const checkRes = await checkPermission({
          role: formData.role,
          resource: formData.resource,
          action: formData.action,
        })

        if (checkRes.code === 0 && checkRes.data) {
          ElMessage.error(t('permissionsManagement.checkPermission'))
          return
        }
      } catch (error: any) {
        // 忽略检查错误，继续创建
      }

      loading.value = true
      try {
        await authorityStore.addPermission({
          role: formData.role,
          resource: formData.resource,
          action: formData.action,
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
      formData.resource = ''
      formData.action = ''
      errors.role = ''
      errors.resource = ''
      errors.action = ''
      roleOptions.value = []
    }

    return () => (
      <ElDialog
        v-model={props.modelValue}
        title={t('newPermissions.addPermission')}
        width="400px"
        onClose={handleClose}
       v-slots={
          footer: () => (
            <div class="flex justify-end gap-2">
            <ElButton onClick={handleClose}>{t('newPermissions.cancel')}</ElButton>
            <ElButton type="primary" loading={loading.value} onClick={handleConfirm}>
              {t('newPermissions.confirm')}
            </ElButton>
          </div>
          ),
        }
      >
        <ElForm label-width="100px">
          <ElFormItem label={t('newPermissions.role')} required error={errors.role}>
            <ElSelect
              modelValue={formData.role}
              placeholder={t('newPermissions.rolePlaceholder')}
              filterable
              remote
              remote-method={handleRoleSearch}
              onUpdate:modelValue={(val: string) => {
                formData.role = val
                errors.role = ''
              }}
              style="width: 100%"
            >
              {roleOptions.value.map((roleOption) => (
                <ElOption key={roleOption} label={roleOption} value={roleOption} />
              ))}
            </ElSelect>
          </ElFormItem>
          <ElFormItem label={t('newPermissions.resource')} required error={errors.resource}>
            <ElSelect
              modelValue={formData.resource}
              placeholder={t('newPermissions.resourcePlaceholder')}
              onUpdate:modelValue={(val: string) => {
                formData.resource = val
                errors.resource = ''
              }}
              style="width: 100%"
            >
              {props.namespaces.map((ns: any) => (
                <ElOption
                  key={ns.namespace}
                  label={`${ns.namespaceShowName} ${ns.namespace ? `(${ns.namespace})` : ''}`}
                  value={`${ns.namespace}:*:*`}
                />
              ))}
            </ElSelect>
          </ElFormItem>
          <ElFormItem label={t('newPermissions.action')} required error={errors.action}>
            <ElSelect
              modelValue={formData.action}
              placeholder={t('newPermissions.actionPlaceholder')}
              onUpdate:modelValue={(val: string) => {
                formData.action = val
                errors.action = ''
              }}
              style="width: 100%"
            >
              <ElOption label={`${t('newPermissions.readOnly')} (r)`} value="r" />
              <ElOption label={`${t('newPermissions.writeOnly')} (w)`} value="w" />
              <ElOption label={`${t('newPermissions.readWrite')} (rw)`} value="rw" />
            </ElSelect>
          </ElFormItem>
        </ElForm>

        
      </ElDialog>
    )
  },
})

