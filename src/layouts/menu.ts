/**
 * 菜单配置
 * 参考 console-ui/src/layouts/menu.js
 */

import { isJsonString } from '@/utils/nacosutil'

export interface MenuItem {
  key: string
  url?: string
  children?: MenuItem[]
  badge?: string
}

const serviceDiscoveryMenu: MenuItem = {
  key: 'serviceManagementVirtual',
  children: [
    {
      key: 'serviceManagement',
      url: '/serviceManagement',
    },
    {
      key: 'subscriberList',
      url: '/subscriberList',
    },
  ],
}

const configurationMenu: MenuItem = {
  key: 'configurationManagementVirtual',
  children: [
    {
      key: 'configurationManagement',
      url: '/configurationManagement',
    },
    {
      key: 'historyRollback',
      url: '/historyRollback',
    },
    {
      key: 'listeningToQuery',
      url: '/listeningToQuery',
    },
  ],
}

export const McpServerManagementRoute = '/mcpServerManagement'

const aiControlMenu: MenuItem = {
  key: 'aiManagementVirtual',
  badge: 'new',
  children: [
    {
      key: 'mcpList',
      url: McpServerManagementRoute,
    },
  ],
}

const authorityControlMenu: MenuItem = {
  key: 'authorityControl',
  children: [
    {
      key: 'userList',
      url: '/userManagement',
    },
    {
      key: 'roleManagement',
      url: '/rolesManagement',
    },
    {
      key: 'privilegeManagement',
      url: '/permissionsManagement',
    },
  ],
}

const namespaceMenu: MenuItem = {
  key: 'namespace',
  url: '/namespace',
}

const clusterMenu: MenuItem = {
  key: 'clusterManagementVirtual',
  children: [
    {
      key: 'clusterManagement',
      url: '/clusterManagement',
    },
  ],
}

const settingMenu: MenuItem = {
  key: 'settingCenter',
  url: '/settingCenter',
}

const agentManagementMenu: MenuItem = {
  key: 'agentManagement',
  badge: 'new',
  url: '/agentManagement',
  children: [
    {
      key: 'agentList',
      url: '/agentManagement',
    },
  ],
}

/**
 * 获取菜单数据
 * @param model - functionMode: 'naming' | 'config' | ''
 */
export default function getMenuData(model: string): MenuItem[] {
  const token = localStorage.getItem('token') || '{}'
  const { globalAdmin } = isJsonString(token) ? JSON.parse(token) || {} : {}
  
  const result: MenuItem[] = []
  
  if (model === 'naming') {
    result.push(serviceDiscoveryMenu)
  } else if (model === 'config') {
    result.push(configurationMenu)
  } else {
    result.push(configurationMenu, serviceDiscoveryMenu)
    result.push(aiControlMenu)
    result.push(agentManagementMenu)
  }
  
  if (globalAdmin) {
    result.push(authorityControlMenu)
  }
  
  result.push(namespaceMenu)
  result.push(clusterMenu)
  result.push(settingMenu)
  
  return result.filter(item => item)
}

