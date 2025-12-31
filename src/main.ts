import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'virtual:uno.css'
import App from './App'
import './style.css'
import i18n from './i18n'
import './i18n/types'

const app = createApp(App)

// 使用 I18n
app.use(i18n)

// Element Plus 语言在 App.vue 中通过 ElConfigProvider 动态切换
app.use(ElementPlus)

app.use(createPinia())
app.use(router)

app.mount('#app')
