/**
 * AI 功能 Store
 * MCP 管理和 Agent 管理状态管理
 * 使用 Pinia Setup Store 风格
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getMcpList,
  getMcpDetail,
  createMcp,
  updateMcp,
  deleteMcp,
  getMcpTools,
  addMcpTool,
  deleteMcpTool,
  getAgentList,
  getAgentDetail,
  createAgent,
  updateAgent,
  deleteAgent,
  startAgent,
  stopAgent,
  type McpServer,
  type McpListParams,
  type Agent,
  type AgentListParams,
} from '@/api/ai'
import { ElMessage } from 'element-plus'

export const useAiStore = defineStore('ai', () => {
  // ========== MCP 状态 ==========
  const mcpList = ref<McpServer[]>([])
  const mcpTotal = ref(0)
  const mcpLoading = ref(false)
  const mcpSearchParams = ref<McpListParams>({
    mcpName: '',
    namespaceId: '',
    search: 'blur',
    pageNo: 1,
    pageSize: 10,
  })

  // ========== Agent 状态 ==========
  const agentList = ref<Agent[]>([])
  const agentTotal = ref(0)
  const agentLoading = ref(false)
  const agentSearchParams = ref<AgentListParams>({
    agentName: '',
    namespaceId: '',
    search: 'blur',
    pageNo: 1,
    pageSize: 10,
  })

  // ========== MCP Getters ==========
  const mcpCount = computed(() => mcpList.value.length)
  const mcpIsEmpty = computed(() => mcpList.value.length === 0)

  // ========== Agent Getters ==========
  const agentCount = computed(() => agentList.value.length)
  const agentIsEmpty = computed(() => agentList.value.length === 0)

  // ========== MCP Actions ==========

  /**
   * 获取 MCP 列表
   */
  async function fetchMcpList(params?: Partial<McpListParams>) {
    mcpLoading.value = true
    try {
      if (params) {
        mcpSearchParams.value = { ...mcpSearchParams.value, ...params }
      }

      const res = await getMcpList(mcpSearchParams.value)
      if (res.code === 0 && res.data) {
        mcpList.value = res.data.pageItems || []
        mcpTotal.value = res.data.totalCount || 0
      } else {
        ElMessage.error(res.message || '获取 MCP 列表失败')
        mcpList.value = []
        mcpTotal.value = 0
      }
    } catch (error: any) {
      ElMessage.error(error.message || '获取 MCP 列表失败')
      mcpList.value = []
      mcpTotal.value = 0
      throw error
    } finally {
      mcpLoading.value = false
    }
  }

  /**
   * 获取 MCP 详情
   */
  async function fetchMcpDetail(mcpId: string, version?: string): Promise<McpServer | null> {
    try {
      const res = await getMcpDetail(mcpId, version)
      if (res.code === 0 && res.data) {
        return res.data
      } else {
        ElMessage.error(res.message || '获取 MCP 详情失败')
        return null
      }
    } catch (error: any) {
      ElMessage.error(error.message || '获取 MCP 详情失败')
      throw error
    }
  }

  /**
   * 创建 MCP
   */
  async function addMcp(data: {
    serverSpecification: string
    toolSpecification?: string
    endpointSpecification?: string
  }) {
    mcpLoading.value = true
    try {
      const res = await createMcp(data)
      if (res.code === 0) {
        ElMessage.success('创建 MCP 服务器成功')
        await fetchMcpList()
        return res.data
      } else {
        ElMessage.error(res.message || '创建 MCP 服务器失败')
        throw new Error(res.message || '创建 MCP 服务器失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '创建 MCP 服务器失败')
      throw error
    } finally {
      mcpLoading.value = false
    }
  }

  /**
   * 更新 MCP
   */
  async function updateMcpInfo(mcpId: string, data: {
    serverSpecification: string
    toolSpecification?: string
    endpointSpecification?: string
  }) {
    mcpLoading.value = true
    try {
      const res = await updateMcp(mcpId, data)
      if (res.code === 0) {
        ElMessage.success('更新 MCP 服务器成功')
        await fetchMcpList()
        return res.data
      } else {
        ElMessage.error(res.message || '更新 MCP 服务器失败')
        throw new Error(res.message || '更新 MCP 服务器失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '更新 MCP 服务器失败')
      throw error
    } finally {
      mcpLoading.value = false
    }
  }

  /**
   * 删除 MCP
   */
  async function removeMcp(mcpId: string) {
    mcpLoading.value = true
    try {
      const res = await deleteMcp(mcpId)
      if (res.code === 0) {
        ElMessage.success('删除 MCP 服务器成功')
        await fetchMcpList()
      } else {
        ElMessage.error(res.message || '删除 MCP 服务器失败')
        throw new Error(res.message || '删除 MCP 服务器失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '删除 MCP 服务器失败')
      throw error
    } finally {
      mcpLoading.value = false
    }
  }

  /**
   * 获取 MCP 工具列表
   */
  async function fetchMcpTools(mcpId: string) {
    try {
      const res = await getMcpTools(mcpId)
      if (res.code === 0 && res.data) {
        return res.data
      } else {
        ElMessage.error(res.message || '获取 MCP 工具列表失败')
        return []
      }
    } catch (error: any) {
      ElMessage.error(error.message || '获取 MCP 工具列表失败')
      return []
    }
  }

  /**
   * 添加 MCP 工具
   */
  async function addMcpToolItem(mcpId: string, tool: { name: string; description?: string; inputSchema?: Record<string, any> }) {
    mcpLoading.value = true
    try {
      await addMcpTool(mcpId, tool)
      ElMessage.success('添加 MCP 工具成功')
    } catch (error: any) {
      ElMessage.error(error.message || '添加 MCP 工具失败')
      throw error
    } finally {
      mcpLoading.value = false
    }
  }

  /**
   * 删除 MCP 工具
   */
  async function removeMcpTool(mcpId: string, toolName: string) {
    mcpLoading.value = true
    try {
      await deleteMcpTool(mcpId, toolName)
      ElMessage.success('删除 MCP 工具成功')
    } catch (error: any) {
      ElMessage.error(error.message || '删除 MCP 工具失败')
      throw error
    } finally {
      mcpLoading.value = false
    }
  }

  // ========== Agent Actions ==========

  /**
   * 获取 Agent 列表
   */
  async function fetchAgentList(params?: Partial<AgentListParams>) {
    agentLoading.value = true
    try {
      if (params) {
        agentSearchParams.value = { ...agentSearchParams.value, ...params }
      }

      const res = await getAgentList(agentSearchParams.value)
      if (res.code === 0 && res.data) {
        agentList.value = res.data.pageItems || []
        agentTotal.value = res.data.totalCount || 0
      } else {
        ElMessage.error(res.message || '获取 Agent 列表失败')
        agentList.value = []
        agentTotal.value = 0
      }
    } catch (error: any) {
      ElMessage.error(error.message || '获取 Agent 列表失败')
      agentList.value = []
      agentTotal.value = 0
      throw error
    } finally {
      agentLoading.value = false
    }
  }

  /**
   * 获取 Agent 详情
   */
  async function fetchAgentDetail(agentName: string, namespaceId?: string): Promise<Agent | null> {
    try {
      const res = await getAgentDetail(agentName, namespaceId)
      if (res.code === 0 && res.data) {
        return res.data
      } else {
        ElMessage.error(res.message || '获取 Agent 详情失败')
        return null
      }
    } catch (error: any) {
      ElMessage.error(error.message || '获取 Agent 详情失败')
      throw error
    }
  }

  /**
   * 创建 Agent
   */
  async function addAgent(data: { name: string; description?: string; config?: Record<string, any> }) {
    agentLoading.value = true
    try {
      const res = await createAgent(data)
      if (res.code === 0) {
        ElMessage.success('创建 Agent 成功')
        await fetchAgentList()
        return res.data
      } else {
        ElMessage.error(res.message || '创建 Agent 失败')
        throw new Error(res.message || '创建 Agent 失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '创建 Agent 失败')
      throw error
    } finally {
      agentLoading.value = false
    }
  }

  /**
   * 更新 Agent
   */
  async function updateAgentInfo(agentName: string, data: { name?: string; description?: string; config?: Record<string, any> }, namespaceId?: string) {
    agentLoading.value = true
    try {
      const res = await updateAgent(agentName, data, namespaceId)
      if (res.code === 0) {
        ElMessage.success('更新 Agent 成功')
        await fetchAgentList()
        return res.data
      } else {
        ElMessage.error(res.message || '更新 Agent 失败')
        throw new Error(res.message || '更新 Agent 失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '更新 Agent 失败')
      throw error
    } finally {
      agentLoading.value = false
    }
  }

  /**
   * 删除 Agent
   */
  async function removeAgent(agentName: string, namespaceId?: string) {
    agentLoading.value = true
    try {
      const res = await deleteAgent(agentName, namespaceId)
      if (res.code === 0) {
        ElMessage.success('删除 Agent 成功')
        await fetchAgentList()
      } else {
        ElMessage.error(res.message || '删除 Agent 失败')
        throw new Error(res.message || '删除 Agent 失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '删除 Agent 失败')
      throw error
    } finally {
      agentLoading.value = false
    }
  }

  /**
   * 启动 Agent
   */
  async function startAgentInstance(agentName: string, namespaceId?: string) {
    agentLoading.value = true
    try {
      const res = await startAgent(agentName, namespaceId)
      if (res.code === 0) {
        ElMessage.success('启动 Agent 成功')
        await fetchAgentList()
      } else {
        ElMessage.error(res.message || '启动 Agent 失败')
        throw new Error(res.message || '启动 Agent 失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '启动 Agent 失败')
      throw error
    } finally {
      agentLoading.value = false
    }
  }

  /**
   * 停止 Agent
   */
  async function stopAgentInstance(agentName: string, namespaceId?: string) {
    agentLoading.value = true
    try {
      const res = await stopAgent(agentName, namespaceId)
      if (res.code === 0) {
        ElMessage.success('停止 Agent 成功')
        await fetchAgentList()
      } else {
        ElMessage.error(res.message || '停止 Agent 失败')
        throw new Error(res.message || '停止 Agent 失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '停止 Agent 失败')
      throw error
    } finally {
      agentLoading.value = false
    }
  }

  /**
   * 重置 MCP 状态
   */
  function resetMcpState() {
    mcpList.value = []
    mcpTotal.value = 0
    mcpSearchParams.value = {
      mcpName: '',
      namespaceId: '',
      search: 'blur',
      pageNo: 1,
      pageSize: 10,
    }
  }

  /**
   * 重置 Agent 状态
   */
  function resetAgentState() {
    agentList.value = []
    agentTotal.value = 0
    agentSearchParams.value = {
      agentName: '',
      namespaceId: '',
      search: 'blur',
      pageNo: 1,
      pageSize: 10,
    }
  }

  return {
    // MCP State
    mcpList,
    mcpTotal,
    mcpLoading,
    mcpSearchParams,
    // MCP Getters
    mcpCount,
    mcpIsEmpty,
    // MCP Actions
    fetchMcpList,
    fetchMcpDetail,
    addMcp,
    updateMcpInfo,
    removeMcp,
    fetchMcpTools,
    addMcpToolItem,
    removeMcpTool,
    resetMcpState,
    // Agent State
    agentList,
    agentTotal,
    agentLoading,
    agentSearchParams,
    // Agent Getters
    agentCount,
    agentIsEmpty,
    // Agent Actions
    fetchAgentList,
    fetchAgentDetail,
    addAgent,
    updateAgentInfo,
    removeAgent,
    startAgentInstance,
    stopAgentInstance,
    resetAgentState,
  }
})

