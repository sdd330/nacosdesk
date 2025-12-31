/**
 * Namespace Store
 * 命名空间状态管理
 * 参考 console-ui/src/reducers/namespace.js
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getNamespaceList,
  createNamespace,
  updateNamespace,
  deleteNamespace,
  getNamespaceDetail,
  checkNamespaceExist,
  type Namespace,
} from '@/api/namespace'
import { ElMessage } from 'element-plus'

export const useNamespaceStore = defineStore('namespace', () => {
  // 命名空间列表状态
  const namespaceList = ref<Namespace[]>([])
  const loading = ref(false)

  /**
   * 获取命名空间列表
   */
  const fetchNamespaceList = async () => {
    loading.value = true
    try {
      const res = await getNamespaceList()
      if (res.code === 0 && res.data) {
        namespaceList.value = res.data
        // 更新全局命名空间列表（用于 NameSpaceList 组件）
        if (typeof window !== 'undefined') {
          ;(window as any).namespaceList = res.data
        }
      } else {
        ElMessage.error(res.message || '获取命名空间列表失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '获取命名空间列表失败')
      // 错误时设置默认命名空间
      if (typeof window !== 'undefined') {
        ;(window as any).namespaceList = [
          {
            namespace: '',
            namespaceShowName: '公共空间',
            type: 0,
          },
        ]
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取命名空间详情
   */
  const fetchNamespaceDetail = async (namespaceId: string) => {
    try {
      const res = await getNamespaceDetail(namespaceId)
      if (res.code === 0 && res.data) {
        return res.data
      } else {
        ElMessage.error(res.message || '获取命名空间详情失败')
        return null
      }
    } catch (error: any) {
      ElMessage.error(error.message || '获取命名空间详情失败')
      return null
    }
  }

  /**
   * 创建命名空间
   */
  const addNamespace = async (params: {
    customNamespaceId?: string
    namespaceName: string
    namespaceDesc?: string
  }) => {
    try {
      const res = await createNamespace(params)
      if (res.code === 0 && res.data === true) {
        ElMessage.success('创建命名空间成功')
        // 刷新命名空间列表
        await fetchNamespaceList()
        // 延迟刷新全局命名空间列表（用于 NameSpaceList 组件）
        setTimeout(() => {
          fetchNamespaceList()
        }, 2000)
        return res
      } else {
        ElMessage.error(res.message || '创建命名空间失败')
        throw new Error(res.message || '创建命名空间失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '创建命名空间失败')
      throw error
    }
  }

  /**
   * 更新命名空间
   */
  const updateNamespaceInfo = async (params: {
    namespaceId: string
    namespaceName: string
    namespaceDesc?: string
  }) => {
    try {
      const res = await updateNamespace(params)
      if (res.code === 0 && res.data === true) {
        ElMessage.success('更新命名空间成功')
        // 刷新命名空间列表
        await fetchNamespaceList()
        // 延迟刷新全局命名空间列表（用于 NameSpaceList 组件）
        setTimeout(() => {
          fetchNamespaceList()
        }, 2000)
        return res
      } else {
        ElMessage.error(res.message || '更新命名空间失败')
        throw new Error(res.message || '更新命名空间失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '更新命名空间失败')
      throw error
    }
  }

  /**
   * 删除命名空间
   */
  const removeNamespace = async (namespaceId: string) => {
    try {
      const res = await deleteNamespace(namespaceId)
      if (res.code === 0 && res.data === true) {
        ElMessage.success('删除命名空间成功')
        // 刷新命名空间列表
        await fetchNamespaceList()
        return res
      } else {
        ElMessage.error(res.message || '删除命名空间失败')
        throw new Error(res.message || '删除命名空间失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '删除命名空间失败')
      throw error
    }
  }

  /**
   * 检查命名空间是否存在
   */
  const checkExist = async (customNamespaceId: string) => {
    try {
      const res = await checkNamespaceExist(customNamespaceId)
      if (res.code === 0) {
        return res.data
      } else {
        return false
      }
    } catch (error: any) {
      return false
    }
  }

  return {
    // 状态
    namespaceList,
    loading,
    // 方法
    fetchNamespaceList,
    fetchNamespaceDetail,
    addNamespace,
    updateNamespaceInfo,
    removeNamespace,
    checkExist,
  }
})
