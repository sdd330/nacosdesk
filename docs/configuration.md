# 配置说明

本文档详细说明项目的各项配置。

## 🔧 JSX + Composition API 配置

项目已配置 Vue 3 JSX 和 Composition API 支持：

### Vite 配置

```typescript
// vite.config.ts
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(), // Vue 3 JSX 支持
  ],
})
```

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "vue"
  }
}
```

---

## 🌐 Nacos 服务器地址配置

**重要**：本项目是 Nacos 3 Web Console 的桌面版本重新实现，所有 API 请求指向 **Nacos 服务器的 8080 端口**。

### 默认配置

默认服务器地址：`http://localhost:8080`

### 环境变量配置

可以通过环境变量配置：

```bash
# 设置 Nacos 服务器地址（8080 端口）
VITE_API_BASE_URL=http://your-nacos-server:8080
```

### 注意事项

- Nacos 3 Web Console 默认运行在 **8080 端口**
- 确保 Nacos 服务器已启动并监听 8080 端口
- API 请求会自动转发到配置的服务器地址
- Tauri 模式下，可以使用本地 SQLite 数据库替代 HTTP API

---

## 📱 PWA 配置

PWA 配置在 `vite.config.ts` 中：

```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Nacos Desktop',
        short_name: 'Nacos',
        description: 'Nacos Desktop - Nacos Web Console 桌面版本',
        theme_color: '#409EFF',
        icons: [
          {
            src: '/img/nacos.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
        shortcuts: [
          {
            name: '配置管理',
            short_name: '配置',
            description: '打开配置管理页面',
            url: '/configurationManagement',
            icons: [{ src: '/img/nacos.png', sizes: '192x192' }],
          },
        ],
      },
    }),
  ],
})
```

### PWA 功能

- ✅ 渐进式 Web 应用
- ✅ 支持离线访问和安装
- ✅ Service Worker 自动更新和缓存策略
- ✅ Manifest 应用清单配置
- ✅ 快捷方式（配置管理和服务管理）

---

## 🖥️ Tauri 配置

Tauri 配置在 `src-tauri/tauri.conf.json` 中：

```json
{
  "productName": "Nacos Desktop",
  "version": "1.0.0",
  "identifier": "com.nacosdesk.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5174",
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build"
  },
  "app": {
    "security": {
      "csp": null
    },
    "windows": [
      {
        "title": "Nacos Desktop",
        "fullscreen": false,
        "resizable": true,
        "width": 1280,
        "height": 800,
        "minWidth": 1024,
        "minHeight": 600
      }
    ],
    "allowlist": {
      "notification": true
    }
  },
  "bundle": {
    "icon": ["icons/icon.icns", "icons/icon.ico", "icons/icon.png"],
    "targets": ["dmg", "app", "appimage", "deb"],
    "macOS": {
      "minimumSystemVersion": "10.13"
    }
  }
}
```

### Tauri 功能

- ✅ 跨平台支持（macOS、Linux、Windows）
- ✅ SQLite 数据库集成
- ✅ 本地 API（Rust 后端）
- ✅ 自动更新支持
- ✅ 本地存储（Tauri Store 插件）
- ✅ 系统通知支持

---

## 🎨 UnoCSS 配置

UnoCSS 配置在 `uno.config.ts` 中：

### 预设

- `presetUno` - 默认预设
- `presetAttributify` - 属性化模式
- `presetIcons` - 图标支持
- `presetTypography` - 排版预设

### 转换器

- `transformerDirectives` - 指令转换
- `transformerVariantGroup` - 变体组转换
- `transformerCompileClass` - 编译类转换

### 主题系统

- 完整的颜色配置
- 响应式断点
- 动画配置
- 快捷方式（布局和组件样式）

---

## 📦 路径别名配置

项目使用路径别名简化导入：

```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src'),
  },
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

使用示例：

```typescript
import { useI18n } from '@/composables/useI18n'
import { login } from '@/api/auth'
```

---

**最后更新**: 2024-12-31

