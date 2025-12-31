/**
 * Login 页面
 * 使用 Vue 3 JSX + Composition API
 */

import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElCard, ElForm, ElFormItem, ElInput, ElButton, ElAlert, ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import zhCN from '@/locales/zh-CN'

export default defineComponent({
  name: 'Login',
  setup() {
    // ✅ Composition API: 使用 composables
    const router = useRouter()
    const authStore = useAuthStore()
    const {} = useI18n()

    // 临时翻译函数（兼容旧代码）
    const t = (key: string) => {
      const keys = key.split('.')
      let value: any = zhCN
      for (const k of keys) {
        value = value?.[k]
      }
      return value || key
    }

    // ✅ Composition API: 使用 ref 定义响应式状态
    const formRef = ref<FormInstance>()
    const form = ref({ username: '', password: '' })

    // ✅ Composition API: 表单验证规则
    const rules: FormRules = {
      username: [{ required: true, message: t('login.usernameRequired'), trigger: 'blur' }],
      password: [{ required: true, message: t('login.passwordRequired'), trigger: 'blur' }],
    }

    const animations = [
      { style: { left: '15%', top: '70%', animationDelay: '0.3s' } },
      { style: { left: '34%', top: '35%', animationDelay: '1.2s' } },
      { style: { left: '53%', top: '20%', animationDelay: '0.5s' } },
      { style: { left: '72%', top: '64%', animationDelay: '0.8s' } },
      { style: { left: '87%', top: '30%', animationDelay: '1.5s' } },
    ]

    // ✅ Composition API: 方法定义
    const handleSubmit = async () => {
      if (!formRef.value) return
      
      await formRef.value.validate(async (valid) => {
        if (!valid) return
        
        try {
          await authStore.userLogin(form.value)
          router.push('/')
        } catch {
          ElMessage.error(t('login.invalidUsernameOrPassword'))
        }
      })
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit()
      }
    }

    // ✅ Composition API: 生命周期钩子
    onMounted(async () => {
      if (authStore.isAuthenticated) {
        router.push('/')
        return
      }
      
      await authStore.checkServerState()
    })

    // ✅ Composition API: 返回渲染函数
    return () => (
      <div class="h-screen w-full">
        <section class="relative h-full bg-[url('/img/black_dot.png')] bg-[length:14px_14px]">
          {/* Product Area */}
          <div class="absolute left-0 top-1/2 -translate-y-1/2 ml-10 w-[600px]">
            <div class="product-logo">Nacos</div>
            <p class="product-desc">{t('login.productDesc')}</p>
          </div>

          {/* Animated Stars */}
          {animations.map((anim, index) => (
            <div
              key={index}
              class="star"
              style={anim.style}
            />
          ))}

          {/* Login Panel */}
          <ElCard class="login-panel" shadow="never">
            <div class="w-full text-center text-[32px] leading-[45px] mt-[58px]">
              {t('login.title')}
            </div>
            <div class="w-full text-center text-[20px] leading-[25px] mt-6 font-extrabold text-red-600/80">
              <div>{t('login.internalSysTip1')}</div>
              <div>{t('login.internalSysTip2')}</div>
            </div>

            {!authStore.consoleUiEnable && (
              <ElForm
                {...{
                  ref: formRef,
                  model: form.value,
                  rules,
                  class: 'login-form',
                  onKeydown: handleKeyDown,
                }}
              >
                <ElFormItem prop="username">
                  <ElInput
                    modelValue={form.value.username}
                    onUpdate:modelValue={(val: string) => (form.value.username = val)}
                    placeholder={t('login.pleaseInputUsername')}
                    size="large"
                  />
                </ElFormItem>
                <ElFormItem prop="password">
                  <ElInput
                    modelValue={form.value.password}
                    onUpdate:modelValue={(val: string) => (form.value.password = val)}
                    type="password"
                    placeholder={t('login.pleaseInputPassword')}
                    size="large"
                    showPassword
                  />
                </ElFormItem>
                <ElFormItem>
                  <ElButton
                    type="primary"
                    size="large"
                    class="w-full"
                    loading={authStore.loading}
                    onClick={handleSubmit}
                  >
                    {t('login.submit')}
                  </ElButton>
                </ElFormItem>
              </ElForm>
            )}

            {authStore.consoleUiEnable && authStore.guideMsg && (
              <ElAlert type="info" closable={false} class="mt-[30px]">
                <div innerHTML={authStore.guideMsg} />
              </ElAlert>
            )}
          </ElCard>
        </section>
      </div>
    )
  },
})

