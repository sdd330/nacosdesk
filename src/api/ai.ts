/**
 * AI 功能 API
 * MCP 管理和 Agent 管理相关接口
 */

import { httpClient } from '@/utils/request'
import type { ApiResponse } from '@/types/api'

// ========== MCP 管理接口 ==========

export interface McpServer {
  id: string
  name: string
  description?: string
  type?: string
  version?: string
  enabled?: boolean
  capability?: string[]
  serverSpecification?: string
  toolSpecification?: string
  endpointSpecification?: string
}

export interface McpListParams {
  mcpName?: string
  namespaceId?: string
  search?: 'accurate' | 'blur'
  pageNo?: number
  pageSize?: number
}

export interface McpListResponse {
  pageItems: McpServer[]
  totalCount: number
  pageNumber: number
  pagesAvailable: number
}

export interface CreateMcpParams {
  serverSpecification: string
  toolSpecification?: string
  endpointSpecification?: string
}

export interface UpdateMcpParams {
  serverSpecification: string
  toolSpecification?: string
  endpointSpecification?: string
}

export interface McpTool {
  name: string
  description?: string
  inputSchema?: Record<string, any>
}

/**
 * 获取 MCP 服务器列表
 */
export async function getMcpList(
  params: McpListParams
): Promise<ApiResponse<McpListResponse>> {
  return httpClient.get('/v3/console/ai/mcp/list', { 
    params: params as Record<string, string | number | undefined>
  })
}

/**
 * 获取 MCP 服务器详情
 */
export async function getMcpDetail(mcpId: string, version?: string): Promise<ApiResponse<McpServer>> {
  const params: Record<string, string> = { mcpId }
  if (version) {
    params.version = version
  }
  return httpClient.get(`/v3/console/ai/mcp`, {
    params,
  })
}

/**
 * 创建 MCP 服务器
 */
export async function createMcp(
  data: CreateMcpParams
): Promise<ApiResponse<McpServer>> {
  return httpClient.post('/v3/console/ai/mcp', data, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
}

/**
 * 更新 MCP 服务器
 */
export async function updateMcp(
  mcpId: string,
  data: UpdateMcpParams
): Promise<ApiResponse<McpServer>> {
  return httpClient.put('/v3/console/ai/mcp', {
    ...data,
    id: mcpId,
  }, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
}

/**
 * 删除 MCP 服务器
 */
export async function deleteMcp(mcpId: string): Promise<ApiResponse<void>> {
  return httpClient.delete(`/v3/console/ai/mcp`, {
    params: { mcpId },
  })
}

/**
 * 获取 MCP 工具列表
 */
export async function getMcpTools(mcpId: string): Promise<ApiResponse<McpTool[]>> {
  const detail = await getMcpDetail(mcpId)
  if (detail.code === 0 && detail.data) {
    try {
      const toolSpec = detail.data.toolSpecification
      if (toolSpec) {
        const tools = JSON.parse(toolSpec)
        return {
          code: 0,
          data: Array.isArray(tools) ? tools : [],
        } as ApiResponse<McpTool[]>
      }
    } catch (error) {
      console.error('Failed to parse tool specification:', error)
    }
  }
  return {
    code: 0,
    data: [],
  } as ApiResponse<McpTool[]>
}

/**
 * 添加 MCP 工具
 */
export async function addMcpTool(
  mcpId: string,
  tool: McpTool
): Promise<ApiResponse<void>> {
  const detail = await getMcpDetail(mcpId)
  if (detail.code === 0 && detail.data) {
    const tools = await getMcpTools(mcpId)
    const updatedTools = [...(tools.data || []), tool]
    await updateMcp(mcpId, {
      serverSpecification: detail.data.serverSpecification || '',
      toolSpecification: JSON.stringify(updatedTools),
      endpointSpecification: detail.data.endpointSpecification || '',
    })
    return { code: 0, success: true } as ApiResponse<void>
  }
  throw new Error('Failed to get MCP detail')
}

/**
 * 删除 MCP 工具
 */
export async function deleteMcpTool(
  mcpId: string,
  toolName: string
): Promise<ApiResponse<void>> {
  const detail = await getMcpDetail(mcpId)
  if (detail.code === 0 && detail.data) {
    const tools = await getMcpTools(mcpId)
    const updatedTools = (tools.data || []).filter((t) => t.name !== toolName)
    await updateMcp(mcpId, {
      serverSpecification: detail.data.serverSpecification || '',
      toolSpecification: JSON.stringify(updatedTools),
      endpointSpecification: detail.data.endpointSpecification || '',
    })
    return { code: 0, success: true } as ApiResponse<void>
  }
  throw new Error('Failed to get MCP detail')
}

// ========== Agent 管理接口 ==========

export interface Agent {
  id: string
  name: string
  description?: string
  status?: 'running' | 'stopped' | 'error'
  config?: Record<string, any>
}

export interface AgentListParams {
  agentName?: string
  namespaceId?: string
  search?: 'accurate' | 'blur'
  pageNo?: number
  pageSize?: number
}

export interface AgentListResponse {
  pageItems: Agent[]
  totalCount: number
  pageNumber: number
  pagesAvailable: number
}

export interface CreateAgentParams {
  name: string
  description?: string
  config?: Record<string, any>
}

export interface UpdateAgentParams {
  name?: string
  description?: string
  config?: Record<string, any>
}

/**
 * 获取 Agent 列表
 */
export async function getAgentList(
  params: AgentListParams
): Promise<ApiResponse<AgentListResponse>> {
  return httpClient.get('/v3/console/ai/a2a/list', { 
    params: params as Record<string, string | number | undefined>
  })
}

/**
 * 获取 Agent 详情
 */
export async function getAgentDetail(agentName: string, namespaceId?: string): Promise<ApiResponse<Agent>> {
  const params: Record<string, string> = { agentName }
  if (namespaceId) {
    params.namespaceId = namespaceId
  }
  return httpClient.get(`/v3/console/ai/a2a`, {
    params,
  })
}

/**
 * 创建 Agent
 */
export async function createAgent(
  data: CreateAgentParams
): Promise<ApiResponse<Agent>> {
  return httpClient.post('/v3/console/ai/a2a', data, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
}

/**
 * 更新 Agent
 */
export async function updateAgent(
  agentName: string,
  data: UpdateAgentParams,
  namespaceId?: string
): Promise<ApiResponse<Agent>> {
  const params: Record<string, string> = { agentName }
  if (namespaceId) {
    params.namespaceId = namespaceId
  }
  return httpClient.put(`/v3/console/ai/a2a`, data, {
    params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
}

/**
 * 删除 Agent
 */
export async function deleteAgent(agentName: string, namespaceId?: string): Promise<ApiResponse<void>> {
  const params: Record<string, string> = { agentName }
  if (namespaceId) {
    params.namespaceId = namespaceId
  }
  return httpClient.delete(`/v3/console/ai/a2a`, {
    params,
  })
}

/**
 * 获取 Agent 运行状态
 */
export async function getAgentStatus(agentName: string, namespaceId?: string): Promise<ApiResponse<Agent>> {
  return getAgentDetail(agentName, namespaceId)
}

/**
 * 启动 Agent
 */
export async function startAgent(agentName: string, namespaceId?: string): Promise<ApiResponse<void>> {
  const params: Record<string, string> = { agentName }
  if (namespaceId) {
    params.namespaceId = namespaceId
  }
  return httpClient.post(`/v3/console/ai/a2a/start`, null, {
    params,
  })
}

/**
 * 停止 Agent
 */
export async function stopAgent(agentName: string, namespaceId?: string): Promise<ApiResponse<void>> {
  const params: Record<string, string> = { agentName }
  if (namespaceId) {
    params.namespaceId = namespaceId
  }
  return httpClient.post(`/v3/console/ai/a2a/stop`, null, {
    params,
  })
}

