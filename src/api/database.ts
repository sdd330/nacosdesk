/**
 * 数据库管理相关 API
 */

import { isTauri, tauriBackupDatabase, tauriRestoreDatabase, tauriGetDatabaseFilePath, tauriCleanupDatabase } from '@/utils/tauriApi'

/**
 * 备份数据库
 * 如果在 Tauri 环境中，使用 Tauri API；否则返回错误
 */
export async function backupDatabase(backupPath: string): Promise<{ code: number; message?: string }> {
  if (isTauri()) {
    try {
      const message = await tauriBackupDatabase(backupPath)
      return { code: 0, message }
    } catch (error: any) {
      throw new Error(error.message || '备份数据库失败')
    }
  } else {
    return Promise.reject(new Error('Web 环境不支持数据库备份功能'))
  }
}

/**
 * 恢复数据库
 * 如果在 Tauri 环境中，使用 Tauri API；否则返回错误
 */
export async function restoreDatabase(backupPath: string): Promise<{ code: number; message?: string }> {
  if (isTauri()) {
    try {
      const message = await tauriRestoreDatabase(backupPath)
      return { code: 0, message }
    } catch (error: any) {
      throw new Error(error.message || '恢复数据库失败')
    }
  } else {
    return Promise.reject(new Error('Web 环境不支持数据库恢复功能'))
  }
}

/**
 * 获取数据库文件路径
 * 如果在 Tauri 环境中，使用 Tauri API；否则返回错误
 */
export async function getDatabaseFilePath(): Promise<{ code: number; data?: string; message?: string }> {
  if (isTauri()) {
    try {
      const path = await tauriGetDatabaseFilePath()
      return { code: 0, data: path }
    } catch (error: any) {
      throw new Error(error.message || '获取数据库文件路径失败')
    }
  } else {
    return Promise.reject(new Error('Web 环境不支持获取数据库文件路径功能'))
  }
}

/**
 * 清理数据库（危险操作）
 * 如果在 Tauri 环境中，使用 Tauri API；否则返回错误
 */
export async function cleanupDatabase(): Promise<{ code: number; message?: string }> {
  if (isTauri()) {
    try {
      const message = await tauriCleanupDatabase()
      return { code: 0, message }
    } catch (error: any) {
      throw new Error(error.message || '清理数据库失败')
    }
  } else {
    return Promise.reject(new Error('Web 环境不支持数据库清理功能'))
  }
}

