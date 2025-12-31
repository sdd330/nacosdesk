/**
 * Register 页面
 * 初始化管理员账户
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/Register/Register.jsx
 */

import { defineComponent, ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElMessage,
  ElMessageBox,
  ElAlert,
} from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import { initAdmin } from '@/api/auth'
import { generateRandomPassword, LOGINPAGE_ENABLED } from '@/utils/constants'
import { storage } from '@/utils/storage'

export default defineComponent({
  name: 'Register',
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    const authStore = useAuthStore()

    const formRef = ref<FormInstance>()
    const loading = ref(false)
    const form = reactive({
      username: 'nacos',
      password: '',
    })

    const rules: FormRules = {
      password: [
        { required: true, message: t('register.passwordRequired') || '请输入密码', trigger: 'blur' },
        { min: 8, message: t('register.passwordMinLength') || '密码长度至少为 8 位', trigger: 'blur' },
      ],
    }

    // 检查是否已登录
    const checkAuth = () => {
      if (authStore.isAuthenticated) {
        router.push('/')
      }
    }

    // 检查服务器状态
    const checkServerState = async () => {
      try {
        await authStore.checkServerState()
      } catch (error: any) {
        console.error('获取服务器状态失败:', error)
      }
    }

    // 提交表单
    const handleSubmit = async () => {
      if (!formRef.value) return

      await formRef.value.validate(async (valid) => {
        if (!valid) return

        loading.value = true
        try {
          // 生成随机密码（实际提交时会使用这个密码）
          const randomPassword = generateRandomPassword(10)
          const data = {
            username: form.username,
            password: randomPassword,
          }

          const response = await initAdmin(data)

          if (response.username && response.password) {
            // 保存 token
            const tokenData = {
              username: response.username,
              accessToken: response.password,
            }
            const tokenStr = JSON.stringify(tokenData)
            storage.setToken(tokenStr)
            // 更新 store 中的 token
            ;(authStore as any).token = tokenStr

            // 显示成功对话框
            await ElMessageBox.alert(
              `<div>
                <div style="margin-bottom: 10px;">
                  <strong>${t('register.newPassword') || '新密码'}:</strong> 
                  <span style="color: #409EFF; font-weight: bold;">${response.password}</span>
                </div>
                <div style="color: #909399; font-size: 14px;">
                  ${t('register.hintSavePassword') || '请妥善保存密码，建议立即修改'}
                </div>
              </div>`,
              t('register.initPasswordSuccess') || '初始化密码成功',
              {
                confirmButtonText: t('common.confirm') || '确定',
                dangerouslyUseHTMLString: true,
                type: 'success',
              }
            )

            router.push('/')
          } else {
            // 显示失败对话框
            await ElMessageBox.alert(
              response.message || response.toString() || (t('register.initPasswordFailed') || '初始化密码失败'),
              t('register.initPasswordFailed') || '初始化密码失败',
              {
                confirmButtonText: t('common.confirm') || '确定',
                type: 'error',
              }
            )

            // 检查是否需要跳转到登录页
            const loginPageEnabled = localStorage.getItem(LOGINPAGE_ENABLED)
            if (loginPageEnabled !== 'false') {
              const token = storage.getToken()
              if (!token) {
                router.push('/login')
              } else {
                router.push('/')
              }
            } else {
              router.push('/')
            }
          }
        } catch (error: any) {
          ElMessage.error(
            error.message || t('register.initPasswordFailed') || '初始化密码失败'
          )
        } finally {
          loading.value = false
        }
      })
    }

    // 键盘事件处理
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        handleSubmit()
      }
    }

    onMounted(() => {
      checkAuth()
      checkServerState()
    })

    return () => (
      <div class="h-screen w-full">
        <section class="relative h-full bg-[url('/img/black_dot.png')] bg-[length:14px_14px]">
          {/* Product Area */}
          <div class="absolute left-0 top-1/2 -translate-y-1/2 ml-10 w-[600px]">
            <div class="product-logo">Nacos</div>
            <p class="product-desc">{t('login.productDesc')}</p>
          </div>

          {/* Animated Stars */}
          {[
            { style: { left: '15%', top: '70%', animationDelay: '0.3s' } },
            { style: { left: '34%', top: '35%', animationDelay: '1.2s' } },
            { style: { left: '53%', top: '20%', animationDelay: '0.5s' } },
            { style: { left: '72%', top: '64%', animationDelay: '0.8s' } },
            { style: { left: '87%', top: '30%', animationDelay: '1.5s' } },
          ].map((anim, index) => (
            <div key={index} class="star" style={anim.style} />
          ))}

          {/* Register Panel */}
          <ElCard class="login-panel" shadow="never">
            <div class="w-full text-center text-[32px] leading-[45px] mt-[58px]">
              {t('register.initPassword') || '初始化密码'}
            </div>
            <div class="w-full text-center text-[20px] leading-[25px] mt-6 font-extrabold text-red-600/80">
              <div>{t('login.internalSysTip1') || '这是一个内部系统'}</div>
            </div>
            <div class="w-full text-center text-[16px] leading-[22px] mt-4 text-gray-600">
              <div>{t('register.internalSysTip3') || '仅限授权人员使用'}</div>
              <div>{t('register.internalSysTip4') || '请妥善保管您的账户信息'}</div>
            </div>

            {!authStore.consoleUiEnable && (
              <ElForm
                {...{
                  ref: formRef,
                  model: form,
                  rules,
                  class: 'login-form',
                  onKeydown: handleKeyDown,
                }}
              >
                <ElFormItem prop="username">
                  <ElInput
                    modelValue={form.username}
                    onUpdate:modelValue={(val: string) => (form.username = val)}
                    placeholder={t('login.pleaseInputUsername') || '请输入用户名'}
                    size="large"
                    readonly
                  />
                </ElFormItem>
                <ElFormItem prop="password">
                  <ElInput
                    modelValue={form.password}
                    onUpdate:modelValue={(val: string) => (form.password = val)}
                    type="password"
                    placeholder={t('register.pleaseInputPasswordTips') || '请输入密码提示'}
                    size="large"
                    showPassword
                  />
                </ElFormItem>
                <ElFormItem>
                  <ElButton
                    type="primary"
                    size="large"
                    class="w-full"
                    loading={loading.value}
                    onClick={handleSubmit}
                  >
                    {t('register.submit') || '提交'}
                  </ElButton>
                </ElFormItem>
              </ElForm>
            )}

            {authStore.consoleUiEnable && authStore.guideMsg && (
              <div class="mt-6">
                <ElAlert
                  type="info"
                  showIcon
                  dangerouslyUseHTMLString
                  v-slots={{
                    default: () => <div innerHTML={authStore.guideMsg} />,
                  }}
                />
              </div>
            )}
          </ElCard>
        </section>
      </div>
    )
  },
})
