/**
 * Vitest 测试环境配置
 */

import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Tauri API 已经在 vitest.config.ts 中通过 alias 进行了 mock

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock window.__TAURI_INTERNALS__
Object.defineProperty(window, '__TAURI_INTERNALS__', {
  value: {},
  writable: true,
  configurable: true,
})

// 全局测试配置
config.global.stubs = {}

