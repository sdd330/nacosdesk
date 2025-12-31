# TODO.md - Nacos Desktop 开发任务列表

## 📋 项目概述

**Nacos Desktop** 是基于 Vue 3.5 + TypeScript + JSX + Composition API + Tauri 2.0 + SQLite 重新实现的 **Nacos Web Console 桌面版本**。

### 🎯 项目定位

- **完全重新实现**：基于 SQLite 的独立实现，完全重新实现 Nacos Web Console 的所有功能
- **本地优先**：所有数据存储在本地 SQLite 数据库中
- **桌面应用**：使用 Tauri 2.0 构建跨平台桌面应用
- **完全离线**：支持完全离线使用，无需连接远程服务器
- **API 服务器**：可作为 Nacos Standalone API 服务器，监听 8848 端口，支持 Spring Boot 等外部应用连接

### ⚠️ 重要说明

- **不涉及数据同步**：本项目不涉及与现有 HTTP API 的数据同步
- **不涉及兼容性**：本项目是全新实现，不兼容现有 HTTP API
- **独立数据库**：使用 SQLite 作为唯一数据源，所有功能基于 SQLite 实现

---

## 🎯 Nacos Web Console 核心功能

### 1. 配置管理（Configuration Management）
- ✅ 配置列表查询和搜索
- ✅ 新建配置（支持多种格式：Text、JSON、XML、YAML、Properties、TOML）
- ✅ 配置编辑和更新
- ✅ 配置详情查看
- ✅ 配置同步（跨命名空间）
- ✅ 配置删除
- ✅ 配置历史版本列表
- ✅ 历史版本详情查看
- ✅ 配置回滚
- ✅ 版本对比（Diff 视图）
- ⚠️ 监听查询（配置变更监听）

### 2. 服务管理（Service Management）
- ✅ 服务列表查询和搜索
- ✅ 服务详情查看
- ✅ 服务创建和更新
- ✅ 服务删除
- ✅ 实例管理（注册、注销、更新）
- ✅ 实例健康状态管理
- ⚠️ 订阅者列表查询
- ⚠️ 集群管理（服务级别）

### 3. 命名空间管理（Namespace Management）
- ✅ 命名空间列表查询
- ✅ 命名空间创建
- ✅ 命名空间编辑
- ✅ 命名空间删除（级联删除配置和服务）

### 4. 权限控制（Authority Control）
- ✅ 用户管理（CRUD、密码修改、启用/禁用）
- ✅ 角色管理（CRUD、角色绑定）
- ✅ 权限管理（CRUD、权限检查）
- ✅ Token 管理（存储、验证、刷新、过期处理）

### 5. 集群管理（Cluster Management）
- ⚠️ 集群节点列表查询
- ⚠️ 节点状态管理
- ⚠️ 集群配置管理

### 6. 设置中心（Setting Center）
- ✅ 应用设置（主题、语言、命名空间显示模式）

---

## ✅ 已完成功能总览

### 🎉 核心功能模块（基础功能 100% 完成）

- ✅ **配置管理**：列表查询、详情查询、创建/更新、删除、历史记录、版本详情、历史配置列表（8个 Rust API，前端完整集成）
- ✅ **服务管理**：列表查询、详情查询、创建/更新、删除、实例管理、实例健康状态更新（9个 Rust API，前端完整集成）
- ✅ **命名空间管理**：列表查询、创建/更新、删除（4个 Rust API，前端完整集成）

### 🔐 认证和权限模块（100% 完成）

- ✅ **认证功能**：登录、注册、管理员检查（3个 Rust API，前端完整集成）
- ✅ **用户管理**：列表、详情、创建、删除、密码修改、启用/禁用、搜索（6个 Rust API，前端完整集成）
- ✅ **角色管理**：列表、创建、删除（3个 Rust API，前端完整集成）
- ✅ **权限管理**：列表、创建、删除、检查（4个 Rust API，前端完整集成）
- ✅ **Token 管理**：存储、验证、刷新、过期处理（3个 Rust API，前端完整集成）

### 💾 数据管理模块（基础功能 100% 完成）

- ✅ **数据库备份**：备份数据库到指定路径（Rust API + 前端集成）
- ✅ **数据库恢复**：从备份文件恢复数据库（Rust API + 前端集成）
- ✅ **数据库清理**：清理所有数据（Rust API + 前端集成）
- ✅ **路径查询**：获取数据库文件路径（Rust API + 前端集成）

### 🛠️ 基础设施（100% 完成）

- ✅ **数据库系统**：5个迁移脚本，完整的 schema 设计
- ✅ **路由系统**：27个路由配置
- ✅ **国际化系统**：Vue I18n 9.x，支持多语言
- ✅ **状态管理**：8个 Pinia Stores
- ✅ **API 层**：62个前端 API 接口，支持 Tauri/HTTP 自动切换
- ✅ **快捷键系统**：全局快捷键支持，Composable 实现
- ✅ **通知系统**：系统通知和应用内通知，Composable 实现
- ✅ **测试框架**：Vitest 集成，27个测试用例（100% 通过）

---

## 📊 项目统计

### 代码统计
- **页面组件**：27个（TSX）
- **通用组件**：17个（TSX）
- **Composables**：3个（useKeyboardShortcuts, useNotification, useI18n）
- **API 接口**：62个（前端）
- **Rust API**：44个 Tauri 命令
  - 3个认证命令
  - 6个用户管理命令
  - 3个角色管理命令
  - 4个权限管理命令
  - 3个Token管理命令
  - 4个数据库管理命令
  - 8个配置管理命令
  - 9个服务管理命令
  - 4个命名空间管理命令
- **Stores**：8个
- **工具函数**：9个
- **测试用例**：27个（100% 通过）

### 技术栈
- **前端**：Vue 3.5 + TypeScript + JSX + Element Plus + UnoCSS + Pinia
- **后端**：Tauri 2.0 + Rust + SQLite
- **测试**：Vitest + @vue/test-utils
- **构建**：Vite 7.2.7
- **规范**：Husky + Commitlint + Commitizen

---

## 🚧 待完成任务（按 Nacos Web Console 功能优先级）

### 🔴 高优先级：核心功能完善（Nacos Web Console 必需功能）

#### 1. 配置管理增强
- [ ] **配置同步功能完善**
  - [ ] Rust API：实现跨命名空间配置同步
  - [ ] 前端 UI：配置同步页面完善
  - [ ] 同步冲突处理
- [ ] **监听查询功能**
  - [ ] Rust API：实现配置变更监听查询
  - [ ] 前端 UI：监听查询页面完善
  - [ ] WebSocket 或轮询机制

#### 2. 服务管理增强
- [ ] **订阅者列表功能**
  - [ ] Rust API：实现服务订阅者查询
  - [ ] 数据库表设计：订阅者表
  - [ ] 前端 UI：订阅者列表页面完善
- [ ] **服务集群管理**
  - [ ] Rust API：实现服务级别的集群管理
  - [ ] 前端 UI：服务详情中的集群管理完善

#### 3. 集群管理功能
- [ ] **Rust API 实现**
  - [ ] `get_cluster_nodes_cmd()` - 查询集群节点列表
  - [ ] `update_node_status_cmd()` - 更新节点状态
  - [ ] `get_cluster_config_cmd()` - 获取集群配置
- [ ] **数据库表设计**
  - [ ] 创建 `cluster_nodes` 表
  - [ ] 创建 `cluster_config` 表
  - [ ] 添加数据库迁移脚本（Migration 6）
- [ ] **前端集成**
  - [ ] 添加 Tauri API 函数
  - [ ] 更新前端 API 层
  - [ ] 更新集群管理页面

### 🟡 中优先级：功能优化和增强

#### 1. 配置版本管理优化
- [ ] **版本回滚优化**
  - [ ] Rust API：实现专门的回滚 API（优化现有实现）
  - [ ] 前端 UI：回滚确认和结果展示优化
- [ ] **版本对比优化**
  - [ ] Rust API：实现版本差异计算 API
  - [ ] 前端 UI：Diff 视图优化

#### 2. 数据导入/导出功能
- [ ] **导出功能**
  - [ ] Rust API：导出配置为 JSON/CSV 格式
  - [ ] Rust API：导出服务为 JSON/CSV 格式
  - [ ] Rust API：导出完整数据库为 SQL 格式
  - [ ] 前端 UI：导出按钮和文件选择
- [ ] **导入功能**
  - [ ] Rust API：从 JSON/CSV 导入配置
  - [ ] Rust API：从 JSON/CSV 导入服务
  - [ ] Rust API：从 SQL 文件恢复数据库
  - [ ] 前端 UI：导入按钮和文件上传
  - [ ] 数据验证和错误处理

#### 3. 性能优化
- [ ] **SQLite 查询优化**
  - [ ] 分析现有查询性能
  - [ ] 添加缺失的索引
  - [ ] 优化复杂查询（JOIN、子查询）
  - [ ] 实现查询结果缓存
- [ ] **前端渲染优化**
  - [ ] 实现虚拟滚动（大数据列表）
  - [ ] 实现懒加载（图片、组件）
  - [ ] 优化列表渲染性能
  - [ ] 减少不必要的重新渲染
- [ ] **缓存策略优化**
  - [ ] 实现内存缓存（配置、服务列表）
  - [ ] 实现本地存储缓存（用户偏好设置）
  - [ ] 缓存失效策略

#### 4. 用户体验优化
- [ ] **搜索和过滤优化**
  - [ ] 实现实时搜索（防抖）
  - [ ] 实现高级过滤（多条件组合）
  - [ ] 保存搜索条件（本地存储）
  - [ ] 搜索历史记录
- [ ] **批量操作优化**
  - [ ] 实现批量选择（全选、反选）
  - [ ] 实现批量删除配置
  - [ ] 实现批量导出配置
  - [ ] 批量操作进度提示
- [ ] **操作反馈优化**
  - [ ] 统一错误提示样式
  - [ ] 添加操作成功动画
  - [ ] 优化加载状态显示
  - [ ] 添加操作确认对话框

### 🔴 最高优先级：Nacos Standalone API 服务器（新增）

#### 1. HTTP 服务器实现
- [ ] **Rust HTTP 服务器**
  - [ ] 添加 HTTP 服务器依赖（如 `axum` 或 `warp`）
  - [ ] 实现 HTTP 服务器启动和停止
  - [ ] 监听 8848 端口（可配置）
  - [ ] 实现请求路由和中间件
  - [ ] 实现 CORS 支持（允许跨域请求）
  - [ ] 实现请求日志记录

#### 2. Nacos API 兼容层实现

##### 2.1 配置管理 API（/nacos/v1/cs/configs）
- [ ] **GET /nacos/v1/cs/configs** - 获取配置
  - [ ] 参数：dataId, group, tenant（命名空间）
  - [ ] 返回：配置内容
  - [ ] 集成现有 SQLite 查询逻辑
- [ ] **POST /nacos/v1/cs/configs** - 发布配置
  - [ ] 参数：dataId, group, content, tenant
  - [ ] 自动计算 MD5
  - [ ] 记录历史版本
  - [ ] 集成现有 SQLite 创建/更新逻辑
- [ ] **DELETE /nacos/v1/cs/configs** - 删除配置
  - [ ] 参数：dataId, group, tenant
  - [ ] 记录历史版本
  - [ ] 集成现有 SQLite 删除逻辑
- [ ] **监听配置变更** - 支持长轮询
  - [ ] 实现配置变更监听机制
  - [ ] 支持长轮询（long polling）
  - [ ] 配置变更通知

##### 2.2 服务注册与发现 API（/nacos/v1/ns/instance）
- [ ] **POST /nacos/v1/ns/instance** - 注册实例
  - [ ] 参数：ip, port, serviceName, namespaceId, groupName, weight, healthy, enabled, ephemeral, metadata
  - [ ] 自动生成 instanceId
  - [ ] 集成现有 SQLite 实例注册逻辑
- [ ] **PUT /nacos/v1/ns/instance** - 更新实例
  - [ ] 参数：同注册实例
  - [ ] 集成现有 SQLite 实例更新逻辑
- [ ] **DELETE /nacos/v1/ns/instance** - 注销实例
  - [ ] 参数：ip, port, serviceName, namespaceId, groupName, ephemeral
  - [ ] 集成现有 SQLite 实例注销逻辑
- [ ] **GET /nacos/v1/ns/instance/list** - 查询实例列表
  - [ ] 参数：serviceName, namespaceId, groupName, healthyOnly
  - [ ] 返回：实例列表（JSON 格式）
  - [ ] 集成现有 SQLite 实例查询逻辑

##### 2.3 服务管理 API（/nacos/v1/ns/service）
- [ ] **GET /nacos/v1/ns/service/list** - 查询服务列表
  - [ ] 参数：pageNo, pageSize, namespaceId, groupName, serviceName
  - [ ] 返回：服务列表（JSON 格式）
  - [ ] 集成现有 SQLite 服务查询逻辑
- [ ] **GET /nacos/v1/ns/service** - 查询服务详情
  - [ ] 参数：serviceName, namespaceId, groupName
  - [ ] 返回：服务详情（包含实例列表）
  - [ ] 集成现有 SQLite 服务详情查询逻辑
- [ ] **POST /nacos/v1/ns/service** - 创建服务
  - [ ] 参数：serviceName, namespaceId, groupName, metadata, protectThreshold
  - [ ] 集成现有 SQLite 服务创建逻辑
- [ ] **PUT /nacos/v1/ns/service** - 更新服务
  - [ ] 参数：同创建服务
  - [ ] 集成现有 SQLite 服务更新逻辑
- [ ] **DELETE /nacos/v1/ns/service** - 删除服务
  - [ ] 参数：serviceName, namespaceId, groupName
  - [ ] 级联删除实例
  - [ ] 集成现有 SQLite 服务删除逻辑

##### 2.4 命名空间管理 API（/nacos/v1/console/namespaces）
- [ ] **GET /nacos/v1/console/namespaces** - 查询命名空间列表
  - [ ] 返回：命名空间列表（JSON 格式）
  - [ ] 集成现有 SQLite 命名空间查询逻辑
- [ ] **POST /nacos/v1/console/namespaces** - 创建命名空间
  - [ ] 参数：customNamespaceId, namespaceName, namespaceDesc
  - [ ] 集成现有 SQLite 命名空间创建逻辑
- [ ] **PUT /nacos/v1/console/namespaces** - 更新命名空间
  - [ ] 参数：namespace, namespaceShowName, namespaceDesc
  - [ ] 集成现有 SQLite 命名空间更新逻辑
- [ ] **DELETE /nacos/v1/console/namespaces** - 删除命名空间
  - [ ] 参数：namespaceId
  - [ ] 级联删除配置和服务
  - [ ] 集成现有 SQLite 命名空间删除逻辑

##### 2.5 认证 API（/nacos/v1/auth/login）
- [ ] **POST /nacos/v1/auth/login** - 用户登录
  - [ ] 参数：username, password
  - [ ] 返回：accessToken
  - [ ] 集成现有 SQLite 认证逻辑
- [ ] **GET /nacos/v1/auth/users** - 查询用户列表（管理员）
  - [ ] 支持 Token 验证
  - [ ] 集成现有 SQLite 用户查询逻辑
- [ ] **Token 验证中间件**
  - [ ] 实现 Token 验证中间件
  - [ ] 保护需要认证的 API 端点

##### 2.6 健康检查 API
- [ ] **GET /nacos/v1/console/health** - 健康检查
  - [ ] 返回：服务器状态
  - [ ] 数据库连接状态检查
- [ ] **实例心跳处理**
  - [ ] 实现实例心跳接收（PUT /nacos/v1/ns/instance/beat）
  - [ ] 更新实例最后心跳时间
  - [ ] 自动清理过期实例（临时实例）

#### 3. Spring Boot 集成支持
- [ ] **API 兼容性测试**
  - [ ] 测试 Spring Boot Nacos Client 连接
  - [ ] 测试配置管理功能
  - [ ] 测试服务注册与发现功能
  - [ ] 验证 API 响应格式兼容性
- [ ] **文档和示例**
  - [ ] 编写 Spring Boot 集成文档
  - [ ] 提供 Spring Boot 配置示例
  - [ ] 提供使用示例代码

#### 4. 服务器管理功能
- [ ] **服务器启动/停止控制**
  - [ ] Tauri 命令：启动 HTTP 服务器
  - [ ] Tauri 命令：停止 HTTP 服务器
  - [ ] Tauri 命令：查询服务器状态
  - [ ] 前端 UI：服务器控制面板
- [ ] **端口配置**
  - [ ] 支持配置监听端口（默认 8848）
  - [ ] 端口冲突检测
  - [ ] 端口配置持久化
- [ ] **访问控制**
  - [ ] IP 白名单配置（可选）
  - [ ] 访问日志记录
  - [ ] 请求限流（可选）

#### 5. 数据库表扩展（如需要）
- [ ] **订阅者表**（subscribers）
  - [ ] 记录配置订阅者信息
  - [ ] 支持配置变更通知
- [ ] **心跳记录表**（heartbeats）
  - [ ] 记录实例心跳时间
  - [ ] 支持实例健康检查

### 🟢 低优先级：增强功能

#### 1. 桌面应用特性
- [ ] **系统集成**
  - [ ] 系统托盘支持
  - [ ] 文件关联（.nacos 配置文件）
  - [ ] 窗口管理（置顶、透明度、主题）
- [ ] **自动更新**
  - [ ] Tauri Updater 配置
  - [ ] 更新检查机制
  - [ ] 增量更新支持

#### 2. 安全增强
- [ ] **JWT Token 支持**（可选，当前使用 UUID）
  - [ ] Rust 实现 JWT Token
  - [ ] 前端集成 JWT
- [ ] **权限控制增强**
  - [ ] 命名空间权限控制
  - [ ] 全局管理员角色管理

#### 3. 测试和文档
- [ ] **测试覆盖**
  - [ ] 增加配置管理 API 测试
  - [ ] 增加服务管理 API 测试
  - [ ] 增加用户管理 Store 测试
  - [ ] 增加组件单元测试
  - [ ] 实现端到端测试（E2E）
- [ ] **文档完善**
  - [ ] 完善 API 文档
  - [ ] 完善组件文档
  - [ ] 完善使用指南

---

## 📈 项目进度

### 完成度统计

| 模块 | 完成度 | 说明 |
|------|--------|------|
| 配置管理（基础） | 100% | 列表、详情、创建/更新、删除、历史记录全部完成 |
| 配置管理（增强） | 60% | 同步、监听查询待实现 |
| 服务管理（基础） | 100% | 列表、详情、创建/更新、删除、实例管理全部完成 |
| 服务管理（增强） | 50% | 订阅者列表、服务集群管理待实现 |
| 命名空间管理 | 100% | CRUD 全部完成 |
| 权限控制 | 100% | 用户、角色、权限、Token 管理全部完成 |
| 集群管理 | 0% | 待实现 |
| 设置中心 | 100% | 应用设置已完成 |
| 数据管理 | 100% | 备份、恢复、清理全部完成 |
| 基础设施 | 100% | 路由、国际化、状态管理、快捷键、通知全部完成 |

**总体完成度**：约 **75%**（核心功能基础部分 100%，增强功能 50%）

### 当前阶段

- ✅ **阶段一：数据库扩展**（100% 完成）
- ✅ **阶段二：核心功能实现**（100% 完成）
- ✅ **阶段三：认证和权限扩展**（100% 完成）
- ✅ **阶段四：数据管理**（100% 完成）
- 🚧 **阶段五：Nacos Web Console 核心功能完善**（进行中）
  - ✅ 配置版本管理（基础功能完成）
  - ✅ 实例健康状态管理（完成）
  - 🚧 配置同步功能（待完善）
  - 🚧 监听查询功能（待实现）
  - 🚧 订阅者列表（待实现）
  - 🚧 集群管理（待实现）
- 🚧 **阶段六：Nacos Standalone API 服务器**（0% 完成，新增）
  - 🚧 HTTP 服务器实现（待实现）
  - 🚧 Nacos API 兼容层（待实现）
  - 🚧 Spring Boot 集成支持（待实现）
  - 🚧 服务器管理功能（待实现）
- 🚧 **阶段七：功能优化**（0% 完成）
- 🚧 **阶段八：桌面应用特性**（30% 完成）
- 🚧 **阶段九：安全增强**（0% 完成）
- 🚧 **阶段十：测试和文档**（30% 完成）

---

## 🎯 下一步计划（优先级排序）

### 🔴 最高优先级（Nacos Standalone API 服务器）
1. **HTTP 服务器实现** - 实现 Rust HTTP 服务器，监听 8848 端口
2. **配置管理 API** - 实现 /nacos/v1/cs/configs 端点（GET、POST、DELETE）
3. **服务注册与发现 API** - 实现 /nacos/v1/ns/instance 端点（注册、更新、注销、查询）
4. **服务管理 API** - 实现 /nacos/v1/ns/service 端点（列表、详情、创建、更新、删除）
5. **认证 API** - 实现 /nacos/v1/auth/login 端点和 Token 验证
6. **Spring Boot 集成测试** - 验证 Spring Boot Nacos Client 可以正常连接和使用

### 🔴 高优先级（Nacos Web Console 核心功能）
7. **配置同步功能完善** - 实现跨命名空间配置同步
8. **监听查询功能** - 实现配置变更监听（长轮询）
9. **订阅者列表功能** - 实现服务订阅者查询
10. **集群管理功能** - 实现集群节点管理和配置

### 🟡 中优先级（功能优化）
11. **配置版本管理优化** - 优化回滚和对比功能
12. **数据导入/导出** - 实现数据迁移和备份功能
13. **性能优化** - 优化查询和渲染性能
14. **用户体验优化** - 提升搜索、过滤、批量操作体验

### 🟢 低优先级（增强功能）
15. **系统托盘支持** - 提升桌面应用体验
16. **自动更新功能** - 提升应用维护体验
17. **JWT Token 支持** - 提升安全性（可选）
18. **测试和文档** - 提升代码质量和可维护性

---

**最后更新**：2024-12-31

**项目状态**：核心功能基础部分已全部完成，正在完善 Nacos Web Console 的增强功能
