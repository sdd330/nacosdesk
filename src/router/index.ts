/**
 * 路由配置
 * 参考 console-ui/src/index.js
 */

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MainLayout from '@/layouts/MainLayout'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/welcome',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login'),
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register'),
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: '/',
    component: MainLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: 'welcome',
        name: 'Welcome',
        component: () => import('@/views/Welcome'),
      },
      {
        path: 'namespace',
        name: 'Namespace',
        component: () => import('@/views/NameSpace/index'),
      },
      // 配置管理
      {
        path: 'configurationManagement',
        name: 'ConfigurationManagement',
        component: () => import('@/views/ConfigurationManagement/index'),
      },
      {
        path: 'newconfig',
        name: 'NewConfig',
        component: () => import('@/views/ConfigurationManagement/NewConfig'),
      },
      {
        path: 'configsync',
        name: 'ConfigSync',
        component: () => import('@/views/ConfigurationManagement/ConfigSync'),
      },
      {
        path: 'configdetail',
        name: 'ConfigDetail',
        component: () => import('@/views/ConfigurationManagement/ConfigDetail'),
      },
      {
        path: 'configeditor',
        name: 'ConfigEditor',
        component: () => import('@/views/ConfigurationManagement/ConfigEditor'),
      },
      {
        path: 'historyDetail',
        name: 'HistoryDetail',
        component: () => import('@/views/ConfigurationManagement/HistoryDetail'),
      },
      {
        path: 'configRollback',
        name: 'ConfigRollback',
        component: () => import('@/views/ConfigurationManagement/ConfigRollback'),
      },
      {
        path: 'historyRollback',
        name: 'HistoryRollback',
        component: () => import('@/views/ConfigurationManagement/HistoryRollback'),
      },
      {
        path: 'listeningToQuery',
        name: 'ListeningToQuery',
        component: () => import('@/views/ConfigurationManagement/ListeningToQuery'),
      },
      // 服务管理
      {
        path: 'serviceManagement',
        name: 'ServiceManagement',
        component: () => import('@/views/ServiceManagement/ServiceList'),
      },
      {
        path: 'serviceDetail',
        name: 'ServiceDetail',
        component: () => import('@/views/ServiceManagement/ServiceDetail'),
      },
      {
        path: 'subscriberList',
        name: 'SubscriberList',
        component: () => import('@/views/ServiceManagement/SubscriberList'),
      },
      // 集群管理
      {
        path: 'clusterManagement',
        name: 'ClusterManagement',
        component: () => import('@/views/ClusterManagement/ClusterNodeList'),
      },
      // 权限管理
      {
        path: 'userManagement',
        name: 'UserManagement',
        component: () => import('@/views/AuthorityControl/UserManagement'),
      },
      {
        path: 'rolesManagement',
        name: 'RolesManagement',
        component: () => import('@/views/AuthorityControl/RolesManagement'),
      },
      {
        path: 'permissionsManagement',
        name: 'PermissionsManagement',
        component: () => import('@/views/AuthorityControl/PermissionsManagement'),
      },
      // 设置中心
      {
        path: 'settingCenter',
        name: 'SettingCenter',
        component: () => import('@/views/SettingCenter/index'),
      },
      // AI 功能
      {
        path: 'mcpServerManagement',
        name: 'McpManagement',
        component: () => import('@/views/AI/McpManagement/index'),
      },
      {
        path: 'mcpServerDetail',
        name: 'McpDetail',
        component: () => import('@/views/AI/McpDetail/index'),
      },
      {
        path: 'newMcpServer',
        name: 'NewMcpServer',
        component: () => import('@/views/AI/NewMcpServer/index'),
      },
        {
          path: 'agentManagement',
          name: 'AgentManagement',
          component: () => import('@/views/AI/AgentManagement/index'),
        },
        {
          path: 'newMcpServer',
          name: 'NewMcpServer',
          component: () => import('@/views/AI/NewMcpServer/index'),
        },
      {
        path: 'newAgent',
        name: 'NewAgent',
        component: () => import('@/views/AI/NewAgent/index'),
      },
      {
        path: 'agentDetail',
        name: 'AgentDetail',
        component: () => import('@/views/AI/AgentDetail/index'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫：使用 Pinia store 检查登录态
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  
  // 如果路由需要认证且用户未登录，跳转到登录页
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({
      name: 'Login',
      query: { redirect: to.fullPath },
    })
  } else {
    next()
  }
})

export default router
