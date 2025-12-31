import { defineConfig } from 'rolldown'
import path from 'path'

/**
 * Rolldown 配置文件
 * 
 * Rolldown 是用 Rust 编写的高性能打包工具，旨在替代 Rollup/Vite 的生产构建
 * 
 * 性能优势：
 * - 构建速度提升 10-30 倍（相比 Rollup）
 * - 更低的内存占用
 * - 更好的并行处理能力
 * 
 * 注意：Rolldown 目前处于 Beta 阶段，Vue 插件支持仍在开发中
 * 建议：开发环境使用 Vite，生产构建可以尝试 Rolldown
 */
export default defineConfig({
  // 入口文件
  input: path.resolve(__dirname, 'src/main.ts'),
  
  // 输出配置
  output: {
    dir: 'dist',
    format: 'es',
    entryFileNames: 'assets/[name]-[hash].js',
    chunkFileNames: 'assets/[name]-[hash].js',
    assetFileNames: 'assets/[name]-[hash].[ext]',
  },
  
  // 路径别名
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // 外部依赖（不打包的库）
  external: [
    'vue',
    'vue-router',
    'pinia',
    'element-plus',
  ],
  
  // 构建选项
  build: {
    minify: true,
    sourcemap: false,
    cssMinify: true,
  },
  
  // 平台设置
  platform: 'browser',
  
  // 注意：Rolldown 的插件系统仍在开发中
  // Vue 插件支持需要等待官方更新
  // 当前配置适用于纯 JavaScript/TypeScript 项目
  // 
  // 未来支持的插件配置示例：
  // plugins: [
  //   vue({
  //     script: {
  //       vapor: true, // Vue 3.6 Vapor Mode
  //     },
  //   }),
  //   UnoCSS(),
  //   AutoImport({
  //     resolvers: [ElementPlusResolver()],
  //     imports: ['vue', 'vue-router', 'pinia'],
  //   }),
  //   Components({
  //     resolvers: [ElementPlusResolver()],
  //   }),
  // ],
})
