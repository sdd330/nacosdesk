import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
  presetTypography,
  transformerDirectives,
  transformerVariantGroup,
  transformerCompileClass,
} from 'unocss'

/**
 * UnoCSS 配置
 * 使用最新特性优化样式性能
 */
export default defineConfig({
  // 预设配置
  presets: [
    presetUno(), // 默认预设，包含 Tailwind CSS 兼容的工具类
    presetAttributify(), // 属性模式，支持 <div flex> 语法
    presetIcons({
      // 图标预设
      collections: {
        // 可以添加自定义图标集合
      },
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    presetTypography(), // 排版预设，优化文本样式
  ],

  // 主题配置
  theme: {
    colors: {
      primary: {
        DEFAULT: '#409eff',
        light: '#66b1ff',
        dark: '#337ecc',
        50: '#ecf5ff',
        100: '#d9ecff',
        200: '#b3d8ff',
        300: '#8cc5ff',
        400: '#66b1ff',
        500: '#409eff',
        600: '#337ecc',
        700: '#265c99',
        800: '#1a3d66',
        900: '#0d1e33',
      },
      brand: {
        DEFAULT: '#2e3034',
        light: '#4a4c50',
        dark: '#1a1c20',
      },
      accent: {
        DEFAULT: '#1be1f6',
        light: '#4ee9f8',
        dark: '#0fb8cc',
      },
    },
    breakpoints: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    animation: {
      'slash-star': 'slashStar 2s ease-in-out infinite',
      'fade-in': 'fadeIn 0.3s ease-in-out',
      'slide-up': 'slideUp 0.3s ease-out',
    },
  },

  // 快捷方式 - 使用最新语法
  shortcuts: [
    // 布局快捷方式
    {
      'flex-center': 'flex items-center justify-center',
      'flex-between': 'flex items-center justify-between',
      'flex-col-center': 'flex flex-col items-center justify-center',
      'absolute-center': 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
    },
    // 登录页面快捷方式
    {
      'login-panel': 'absolute right-10 top-[90px] w-120 h-[540px] border-0 shadow-lg',
      'product-logo': 'block w-64 h-12 mb-3 text-4xl font-bold text-white leading-12',
      'product-desc': 'opacity-80 text-2xl text-white max-w-[780px] text-left leading-[30px]',
      'login-form': 'w-90 mx-auto mt-10',
      'login-input': 'h-15',
      'login-button': 'w-full h-15 text-base',
    },
    // 动画星星
    {
      'star': 'absolute w-1.5 h-1.5 rounded-full bg-accent animate-slash-star',
    },
  ],

  // 自定义规则
  rules: [
    // 动画延迟工具类
    [
      /^animation-delay-(\d+)$/,
      ([, d]) => ({ 'animation-delay': `${d}s` }),
    ],
    // 自定义阴影
    [
      /^shadow-soft$/,
      () => ({
        'box-shadow': '0 2px 12px 0 rgba(0, 0, 0, 0.1)',
      }),
    ],
    // 渐变背景
    [
      /^bg-gradient-(\w+)$/,
      ([, c]) => {
        const gradients: Record<string, string> = {
          primary: 'linear-gradient(135deg, #409eff 0%, #66b1ff 100%)',
          brand: 'linear-gradient(135deg, #2e3034 0%, #1a1c20 100%)',
        }
        return {
          'background-image': gradients[c] || gradients.primary,
        }
      },
    ],
  ],

  // 转换器 - 使用最新特性
  transformers: [
    transformerDirectives(), // 支持 @apply, @screen 等指令
    transformerVariantGroup(), // 支持 variant groups: hover:(bg-gray-400 font-medium)
    transformerCompileClass(), // 编译时优化类名
  ],

  // 安全列表 - 确保这些类名始终生成
  safelist: [
    'animate-slash-star',
    'bg-accent',
    'text-primary',
  ],

  // 内容扫描配置
  content: {
    filesystem: [
      'src/**/*.{vue,js,ts,jsx,tsx}',
    ],
  },

  // 开发工具配置
  cli: {
    entry: {
      patterns: ['src/**/*.{vue,js,ts,jsx,tsx}'],
      outFile: 'public/uno.css',
    },
  },
})
