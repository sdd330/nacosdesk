/**
 * Authority Store
 * 权限管理状态管理
 * 参考 console-ui/src/reducers/authority.js
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getUsers,
  createUser,
  deleteUser,
  passwordReset,
  getRoles,
  createRole,
  deleteRole,
  getPermissions,
  createPermission,
  deletePermission,
  type User,
  type Role,
  type Permission,
  type UserListParams,
  type RoleListParams,
  type PermissionListParams,
} from '@/api/authority'
import { ElMessage } from 'element-plus'

export const useAuthorityStore = defineStore('authority', () => {
  // 用户列表状态
  const users = ref<User[]>([])
  const userTotalCount = ref(0)
  const userPageNumber = ref(1)
  const userPageSize = ref(9)

  // 角色列表状态
  const roles = ref<Role[]>([])
  const roleTotalCount = ref(0)
  const rolePageNumber = ref(1)
  const rolePageSize = ref(9)

  // 权限列表状态
  const permissions = ref<Permission[]>([])
  const permissionTotalCount = ref(0)
  const permissionPageNumber = ref(1)
  const permissionPageSize = ref(9)

  // 加载状态
  const loading = ref(false)

  /**
   * 获取用户列表
   */
  const fetchUsers = async (params: UserListParams) => {
    loading.value = true
    try {
      const res = await getUsers(params)
      if (res.code === 0 && res.data) {
        users.value = res.data.pageItems || []
        userTotalCount.value = res.data.totalCount || 0
        userPageNumber.value = res.data.pageNumber || 1
      } else {
        ElMessage.error(res.message || '获取用户列表失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '获取用户列表失败')
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建用户
   */
  const addUser = async (params: { username: string; password: string }) => {
    try {
      const res = await createUser(params)
      if (res.code === 0) {
        ElMessage.success(res.message || '创建用户成功')
        return res
      } else {
        ElMessage.error(res.message || '创建用户失败')
        throw new Error(res.message || '创建用户失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '创建用户失败')
      throw error
    }
  }

  /**
   * 删除用户
   */
  const removeUser = async (username: string) => {
    try {
      const res = await deleteUser(username)
      if (res.code === 0) {
        ElMessage.success(res.message || '删除用户成功')
        return res
      } else {
        ElMessage.error(res.message || '删除用户失败')
        throw new Error(res.message || '删除用户失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '删除用户失败')
      throw error
    }
  }

  /**
   * 重置密码
   */
  const resetPassword = async (params: { username: string; newPassword: string }) => {
    try {
      const res = await passwordReset(params)
      if (res.code === 0) {
        ElMessage.success(res.message || '密码重置成功')
        return res
      } else {
        ElMessage.error(res.message || '密码重置失败')
        throw new Error(res.message || '密码重置失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '密码重置失败')
      throw error
    }
  }

  /**
   * 获取角色列表
   */
  const fetchRoles = async (params: RoleListParams) => {
    loading.value = true
    try {
      const res = await getRoles(params)
      if (res.code === 0 && res.data) {
        roles.value = res.data.pageItems || []
        roleTotalCount.value = res.data.totalCount || 0
        rolePageNumber.value = res.data.pageNumber || 1
      } else {
        ElMessage.error(res.message || '获取角色列表失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '获取角色列表失败')
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建角色
   */
  const addRole = async (params: { role: string; username: string }) => {
    try {
      const res = await createRole(params)
      if (res.code === 0) {
        ElMessage.success(res.message || '创建角色成功')
        return res
      } else {
        ElMessage.error(res.message || '创建角色失败')
        throw new Error(res.message || '创建角色失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '创建角色失败')
      throw error
    }
  }

  /**
   * 删除角色
   */
  const removeRole = async (role: string) => {
    try {
      const res = await deleteRole(role)
      if (res.code === 0) {
        ElMessage.success(res.message || '删除角色成功')
        return res
      } else {
        ElMessage.error(res.message || '删除角色失败')
        throw new Error(res.message || '删除角色失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '删除角色失败')
      throw error
    }
  }

  /**
   * 获取权限列表
   */
  const fetchPermissions = async (params: PermissionListParams) => {
    loading.value = true
    try {
      const res = await getPermissions(params)
      if (res.code === 0 && res.data) {
        permissions.value = res.data.pageItems || []
        permissionTotalCount.value = res.data.totalCount || 0
        permissionPageNumber.value = res.data.pageNumber || 1
      } else {
        ElMessage.error(res.message || '获取权限列表失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '获取权限列表失败')
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建权限
   */
  const addPermission = async (params: { role: string; resource: string; action: string }) => {
    try {
      const res = await createPermission(params)
      if (res.code === 0) {
        ElMessage.success(res.message || '创建权限成功')
        return res
      } else {
        ElMessage.error(res.message || '创建权限失败')
        throw new Error(res.message || '创建权限失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '创建权限失败')
      throw error
    }
  }

  /**
   * 删除权限
   */
  const removePermission = async (params: { role: string; resource: string; action: string }) => {
    try {
      const res = await deletePermission(params)
      if (res.code === 0) {
        ElMessage.success(res.message || '删除权限成功')
        return res
      } else {
        ElMessage.error(res.message || '删除权限失败')
        throw new Error(res.message || '删除权限失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '删除权限失败')
      throw error
    }
  }

  return {
    // 用户状态
    users,
    userTotalCount,
    userPageNumber,
    userPageSize,
    // 角色状态
    roles,
    roleTotalCount,
    rolePageNumber,
    rolePageSize,
    // 权限状态
    permissions,
    permissionTotalCount,
    permissionPageNumber,
    permissionPageSize,
    // 加载状态
    loading,
    // 用户操作
    fetchUsers,
    addUser,
    removeUser,
    resetPassword,
    // 角色操作
    fetchRoles,
    addRole,
    removeRole,
    // 权限操作
    fetchPermissions,
    addPermission,
    removePermission,
  }
})
