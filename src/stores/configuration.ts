/**
 * 配置管理状态管理
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getConfigList,
  searchConfigDetail,
  getConfigDetail,
  deleteConfig,
  publishConfig,
  updateConfig,
  type ConfigListItem,
  type ConfigListParams,
} from '@/api/configuration'

export const useConfigurationStore = defineStore('configuration', () => {
  // State
  const configList = ref<ConfigListItem[]>([])
  const totalCount = ref(0)
  const pageNumber = ref(1)
  const pageSize = ref(10)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 搜索条件
  const searchParams = ref<ConfigListParams>({
    dataId: '',
    groupName: '',
    appName: '',
    configTags: '',
    namespaceId: '',
    type: '',
    search: 'accurate',
    configDetail: '',
  })

  // Getters
  const hasMore = computed(() => {
    return pageNumber.value * pageSize.value < totalCount.value
  })

  /**
   * 获取配置列表
   */
  async function fetchConfigList(params?: Partial<ConfigListParams>) {
    loading.value = true
    error.value = null

    try {
      const finalParams = {
        ...searchParams.value,
        ...params,
        pageNo: params?.pageNo || pageNumber.value,
        pageSize: params?.pageSize || pageSize.value,
      }

      const res = await getConfigList(finalParams)
      configList.value = res.pageItems || []
      totalCount.value = res.totalCount || 0
      pageNumber.value = res.pageNumber || 1
      pageSize.value = res.pageSize || 10

      return res
    } catch (err: any) {
      error.value = err.message || '获取配置列表失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 搜索配置详情
   */
  async function searchDetail(params?: Partial<ConfigListParams>) {
    loading.value = true
    error.value = null

    try {
      const finalParams = {
        ...searchParams.value,
        ...params,
        pageNo: params?.pageNo || pageNumber.value,
        pageSize: params?.pageSize || pageSize.value,
      }

      const res = await searchConfigDetail(finalParams)
      configList.value = res.pageItems || []
      totalCount.value = res.totalCount || 0
      pageNumber.value = res.pageNumber || 1
      pageSize.value = res.pageSize || 10

      return res
    } catch (err: any) {
      error.value = err.message || '搜索配置失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取配置详情
   */
  async function fetchConfigDetail(params: {
    dataId: string
    group: string
    namespaceId?: string
  }) {
    try {
      const res = await getConfigDetail(params)
      return res
    } catch (err: any) {
      error.value = err.message || '获取配置详情失败'
      throw err
    }
  }

  /**
   * 删除配置
   */
  async function removeConfig(params: {
    dataId: string
    group: string
    namespaceId?: string
  }) {
    try {
      await deleteConfig(params)
      // 重新加载列表
      await fetchConfigList()
    } catch (err: any) {
      error.value = err.message || '删除配置失败'
      throw err
    }
  }

  /**
   * 发布配置
   */
  async function createConfig(params: {
    dataId: string
    group: string
    content: string
    type?: string
    namespaceId?: string
    appName?: string
    tags?: string
    desc?: string
  }) {
    try {
      await publishConfig(params)
      // 重新加载列表
      await fetchConfigList()
    } catch (err: any) {
      error.value = err.message || '发布配置失败'
      throw err
    }
  }

  /**
   * 更新配置
   */
  async function modifyConfig(params: {
    dataId: string
    group: string
    content: string
    md5: string
    type?: string
    namespaceId?: string
    appName?: string
    tags?: string
    desc?: string
  }) {
    try {
      await updateConfig(params)
      // 重新加载列表
      await fetchConfigList()
    } catch (err: any) {
      error.value = err.message || '更新配置失败'
      throw err
    }
  }

  /**
   * 更新搜索条件
   */
  function updateSearchParams(params: Partial<ConfigListParams>) {
    searchParams.value = {
      ...searchParams.value,
      ...params,
    }
  }

  /**
   * 重置搜索条件
   */
  function resetSearchParams() {
    searchParams.value = {
      dataId: '',
      groupName: '',
      appName: '',
      configTags: '',
      namespaceId: '',
      type: '',
      search: 'accurate',
      configDetail: '',
    }
  }

  return {
    // State
    configList,
    totalCount,
    pageNumber,
    pageSize,
    loading,
    error,
    searchParams,
    // Getters
    hasMore,
    // Actions
    fetchConfigList,
    searchDetail,
    fetchConfigDetail,
    removeConfig,
    createConfig,
    modifyConfig,
    updateSearchParams,
    resetSearchParams,
  }
})

