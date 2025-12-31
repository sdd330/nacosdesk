/**
 * 服务管理状态管理
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getServiceList, deleteService, type ServiceListItem, type ServiceListParams } from '@/api/service'

export const useServiceStore = defineStore('service', () => {
  // State
  const serviceList = ref<ServiceListItem[]>([])
  const totalCount = ref(0)
  const pageNumber = ref(1)
  const pageSize = ref(10)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 搜索条件
  const searchParams = ref<Partial<ServiceListParams>>({
    serviceNameParam: '',
    groupNameParam: '',
    namespaceId: '',
    ignoreEmptyService: true,
    withInstances: false,
  })

  // Getters
  const hasMore = computed(() => {
    return pageNumber.value * pageSize.value < totalCount.value
  })

  /**
   * 获取服务列表
   */
  async function fetchServiceList(params?: Partial<ServiceListParams>) {
    loading.value = true
    error.value = null

    try {
      const finalParams = {
        ...searchParams.value,
        ...params,
        pageNo: params?.pageNo ?? pageNumber.value,
        pageSize: params?.pageSize ?? pageSize.value,
      }

      const response = await getServiceList(finalParams)

      if (response.code === 0 && response.data) {
        serviceList.value = response.data.pageItems || []
        totalCount.value = response.data.totalCount || 0
      } else {
        error.value = response.message || '获取服务列表失败'
        serviceList.value = []
        totalCount.value = 0
      }
    } catch (err: any) {
      error.value = err.message || '获取服务列表失败'
      serviceList.value = []
      totalCount.value = 0
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新搜索参数
   */
  function updateSearchParams(params: Partial<ServiceListParams>) {
    searchParams.value = { ...searchParams.value, ...params }
  }

  /**
   * 重置搜索参数
   */
  function resetSearchParams() {
    searchParams.value = {
      serviceNameParam: '',
      groupNameParam: '',
      namespaceId: '',
      ignoreEmptyService: true,
      withInstances: false,
    }
    pageNumber.value = 1
  }

  /**
   * 删除服务
   */
  async function removeService(serviceName: string, groupName: string, namespaceId?: string) {
    loading.value = true
    error.value = null

    try {
      const response = await deleteService(serviceName, groupName, namespaceId)
      if (response.code === 0) {
        // 删除成功后刷新列表
        await fetchServiceList()
        return true
      } else {
        error.value = response.message || '删除服务失败'
        return false
      }
    } catch (err: any) {
      error.value = err.message || '删除服务失败'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    serviceList,
    totalCount,
    pageNumber,
    pageSize,
    loading,
    error,
    searchParams,

    // Getters
    hasMore,

    // Actions
    fetchServiceList,
    updateSearchParams,
    resetSearchParams,
    removeService,
  }
})

