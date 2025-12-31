/**
 * SettingCenter 页面
 * 设置中心
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/SettingCenter/SettingCenter.js
 */

import { defineComponent, ref, onMounted } from 'vue'
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElRadioGroup,
  ElRadio,
  ElButton,
  ElMessage,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import { setLocale, getLocale } from '@/i18n'
import { THEME_KEY, NAME_SHOW_KEY } from '@/utils/constants'
import PageTitle from '@/components/PageTitle/index'

export default defineComponent({
  name: 'SettingCenter',
  setup() {
    const { t } = useI18n()

    // 状态管理
    const theme = ref<'light' | 'dark'>(() => {
      const saved = localStorage.getItem(THEME_KEY)
      return saved === 'dark' ? 'dark' : 'light'
    })

    const language = ref<'zh-CN' | 'en-US'>(() => {
      const saved = getLocale()
      return saved === 'en-US' ? 'en-US' : 'zh-CN'
    })

    const nameShow = ref<'select' | 'label'>(() => {
      const saved = localStorage.getItem(NAME_SHOW_KEY)
      return saved === 'select' ? 'select' : 'label'
    })

    // 主题列表
    const themeList = [
      { value: 'light', label: t('settingCenter.settingLight') },
      { value: 'dark', label: t('settingCenter.settingDark') },
    ]

    // 语言列表
    const languageList = [
      { value: 'en-US', label: 'English' },
      { value: 'zh-CN', label: '中文' },
    ]

    // 命名空间显示方式列表
    const nameShowList = [
      { value: 'select', label: t('settingCenter.settingShowSelect') },
      { value: 'label', label: t('settingCenter.settingShowLabel') },
    ]

    // 提交设置
    const handleSubmit = () => {
      // 保存主题设置
      localStorage.setItem(THEME_KEY, theme.value)
      
      // 保存语言设置
      setLocale(language.value)
      
      // 保存命名空间显示方式
      localStorage.setItem(NAME_SHOW_KEY, nameShow.value)

      ElMessage.success(t('settingCenter.settingSubmitSuccess') || '设置已保存')

      // 应用主题（如果需要动态切换主题，可以在这里添加逻辑）
      if (theme.value === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      // 触发命名空间显示方式变更事件（供 NameSpaceList 组件监听）
      window.dispatchEvent(new CustomEvent('nameShowChanged', { detail: nameShow.value }))
    }

    return () => (
      <div class="setting-center-container p-4">
        <PageTitle title={t('settingCenter.settingTitle')} />

        <ElCard>
          <ElForm label-width="150px" class="setting-form">
            <ElFormItem label={t('settingCenter.settingTheme')}>
              <ElRadioGroup
                modelValue={theme.value}
                onUpdate:modelValue={(val: 'light' | 'dark') => {
                  theme.value = val
                }}
              >
                {themeList.map((item) => (
                  <ElRadio key={item.value} label={item.value}>
                    {item.label}
                  </ElRadio>
                ))}
              </ElRadioGroup>
            </ElFormItem>

            <ElFormItem label={t('settingCenter.settingLocale')}>
              <ElRadioGroup
                modelValue={language.value}
                onUpdate:modelValue={(val: 'zh-CN' | 'en-US') => {
                  language.value = val
                }}
              >
                {languageList.map((item) => (
                  <ElRadio key={item.value} label={item.value}>
                    {item.label}
                  </ElRadio>
                ))}
              </ElRadioGroup>
            </ElFormItem>

            <ElFormItem label={t('settingCenter.settingShow')}>
              <ElRadioGroup
                modelValue={nameShow.value}
                onUpdate:modelValue={(val: 'select' | 'label') => {
                  nameShow.value = val
                }}
              >
                {nameShowList.map((item) => (
                  <ElRadio key={item.value} label={item.value}>
                    {item.label}
                  </ElRadio>
                ))}
              </ElRadioGroup>
            </ElFormItem>

            <ElFormItem>
              <ElButton type="primary" onClick={handleSubmit}>
                {t('settingCenter.settingSubmit')}
              </ElButton>
            </ElFormItem>
          </ElForm>
        </ElCard>
      </div>
    )
  },
})
