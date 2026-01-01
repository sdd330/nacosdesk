# Console API 测试用例设计

> **API 路径前缀**: `/nacos/v3/console`  
> **测试文件**: `src-tauri/src/server/tests/integration_tests.rs`  
> **参考**: Nacos develop 项目 Console API 实现

---

## 📋 概述

Console API 是 Nacos 控制台专用的 API，提供更丰富的功能和更友好的响应格式。本文档列出所有 Console API 的测试用例设计。

---

## 1. Console API 配置管理

### 1.1 配置监听查询 API

#### 1.1.1 按配置查询监听者 (`GET /v3/console/cs/config/listener`)

##### 测试用例：按配置查询监听者列表
- **测试函数名**: `test_console_list_listeners_by_config`
- **API**: `GET /v3/console/cs/config/listener`
- **参数**: 
  - `dataId`: 配置 ID（必需）
  - `groupName`: 配置组（必需）
  - `namespaceId`: 命名空间 ID（可选，默认为 public）
  - `aggregation`: 是否聚合（可选，默认 false）
- **前置条件**:
  - 插入测试配置：`dataId=test-config`, `group=DEFAULT_GROUP`, `tenant=public`
  - 获取配置的 MD5 值
  - 启动一个或多个监听请求（模拟客户端监听）
- **请求**: 
  ```
  GET /nacos/v3/console/cs/config/listener?dataId=test-config&groupName=DEFAULT_GROUP&namespaceId=public
  ```
- **预期响应**:
  - 状态码: `200 OK`
  - 响应体: JSON 格式
    ```json
    {
      "queryType": "config",
      "listenersStatus": {
        "127.0.0.1:8080": "md5-value-1",
        "127.0.0.1:8081": "md5-value-2"
      }
    }
    ```
- **验证点**: 
  - 返回指定配置的所有监听者 IP 及其 MD5 值
  - `queryType` 字段为 "config"
  - `listenersStatus` 对象包含所有监听者

##### 测试用例：按配置查询监听者（无监听者）
- **测试函数名**: `test_console_list_listeners_by_config_empty`
- **前置条件**: 插入测试配置（无监听者）
- **预期响应**: 
  - 状态码: `200 OK`
  - 响应体: `{ "queryType": "config", "listenersStatus": {} }`
- **验证点**: 返回空的 `listenersStatus` 对象

##### 测试用例：不同命名空间的监听者隔离
- **测试函数名**: `test_console_list_listeners_by_config_different_namespace`
- **前置条件**:
  - 创建两个命名空间：`public` 和 `test-ns`
  - 在两个命名空间创建相同 dataId 的配置
  - 在不同命名空间启动监听请求
- **步骤**:
  1. 查询 `public` 命名空间的监听者
  2. 查询 `test-ns` 命名空间的监听者
- **验证点**: 
  - 不同命名空间的监听者相互隔离
  - 每个命名空间只返回自己的监听者

##### 测试用例：聚合模式查询
- **测试函数名**: `test_console_list_listeners_by_config_aggregation`
- **请求**: `aggregation=true`
- **验证点**: 返回聚合后的监听者信息（如果支持）

#### 1.1.2 按 IP 查询监听者 (`GET /v3/console/cs/config/listener/ip`)

##### 测试用例：按 IP 查询监听者列表
- **测试函数名**: `test_console_list_listeners_by_ip`
- **API**: `GET /v3/console/cs/config/listener/ip`
- **参数**: 
  - `ip`: 客户端 IP（必需，如：`127.0.0.1`）
  - `namespaceId`: 命名空间 ID（可选，默认为 public）
  - `aggregation`: 是否聚合（可选，默认 false）
- **前置条件**:
  - 插入多个测试配置
  - 使用指定 IP（如 `127.0.0.1`）启动多个监听请求
- **请求**: 
  ```
  GET /nacos/v3/console/cs/config/listener/ip?ip=127.0.0.1&namespaceId=public
  ```
- **预期响应**:
  - 状态码: `200 OK`
  - 响应体: JSON 格式
    ```json
    {
      "queryType": "ip",
      "listenersStatus": {
        "test-config-1+DEFAULT_GROUP": "md5-value-1",
        "test-config-2+DEFAULT_GROUP": "md5-value-2"
      }
    }
    ```
- **验证点**: 
  - 返回指定 IP 监听的所有配置及其 MD5 值
  - `queryType` 字段为 "ip"
  - 配置标识格式为 `dataId+group`

##### 测试用例：按 IP 查询监听者（无监听者）
- **测试函数名**: `test_console_list_listeners_by_ip_empty`
- **前置条件**: 插入测试配置（指定 IP 无监听者）
- **预期响应**: 
  - 状态码: `200 OK`
  - 响应体: `{ "queryType": "ip", "listenersStatus": {} }`
- **验证点**: 返回空的 `listenersStatus` 对象

##### 测试用例：按 IP 查询多个命名空间的监听者
- **测试函数名**: `test_console_list_listeners_by_ip_multiple_namespaces`
- **前置条件**: 
  - 在多个命名空间创建配置
  - 使用相同 IP 监听不同命名空间的配置
- **验证点**: 返回指定 IP 在所有命名空间的监听配置

### 1.2 配置回滚 API (`POST /v3/console/cs/config/rollback`)

#### 测试用例：Console API 配置回滚
- **测试函数名**: `test_console_rollback_config`
- **API**: `POST /v3/console/cs/config/rollback`
- **参数**: 
  - `dataId`: 配置 ID（必需）
  - `groupName`: 配置组（必需）
  - `namespaceId`: 命名空间 ID（必需）
  - `nid`: 历史记录 ID（必需）
- **前置条件**:
  - 插入配置并更新多次
  - 获取历史记录 ID
- **预期响应**:
  - 状态码: `200 OK`
  - 响应体: JSON `{ "code": "0", "data": true }`
- **验证点**: 配置已回滚到指定版本

---

## 2. Console API 服务管理

### 2.1 服务订阅者查询 API (`GET /v3/console/ns/service/subscribers`)

#### 测试用例：Console API 获取服务订阅者列表
- **测试函数名**: `test_console_get_service_subscribers_success`
- **API**: `GET /v3/console/ns/service/subscribers`
- **参数**: 
  - `serviceName`: 服务名称（必需）
  - `namespaceId`: 命名空间 ID（可选，默认为 public）
  - `groupName`: 服务组（可选，默认为 DEFAULT_GROUP）
- **前置条件**:
  - 插入测试服务
  - 注册多个实例（模拟订阅者）
- **预期响应**:
  - 状态码: `200 OK`
  - 响应体: JSON 格式，包含订阅者列表
- **验证点**: 
  - 返回订阅者信息
  - 响应格式可能与标准 API 不同（Console API 格式）

#### 测试用例：Console API 无订阅者时返回空列表
- **测试函数名**: `test_console_get_service_subscribers_empty`
- **前置条件**: 插入测试服务（无订阅者）
- **验证点**: 返回空列表

---

## 3. Console API 配置导出/导入（如果实现）

### 3.1 配置导出 API

#### 测试用例：Console API 导出配置
- **测试函数名**: `test_console_export_config`
- **API**: `GET /v3/console/cs/config/export`（如果实现）
- **参数**: 
  - `dataId`, `groupName`, `namespaceId`: 过滤条件
  - `ids`: 配置 ID 列表
- **预期响应**: ZIP 文件
- **验证点**: 返回 ZIP 文件，包含配置内容

### 3.2 配置导入 API

#### 测试用例：Console API 导入配置
- **测试函数名**: `test_console_import_config`
- **API**: `POST /v3/console/cs/config/import`（如果实现）
- **请求体**: MultipartFile（ZIP 文件）
- **预期响应**: JSON 格式，包含导入统计
- **验证点**: 配置已导入并发布

---

## 4. Console API 批量操作（如果实现）

### 4.1 批量删除配置 API

#### 测试用例：Console API 批量删除配置
- **测试函数名**: `test_console_batch_delete_configs`
- **API**: `DELETE /v3/console/cs/config/batchDelete`
- **参数**: `ids`: 配置 ID 列表，逗号分隔
- **预期响应**: JSON `{ "code": "0", "data": true }`
- **验证点**: 所有指定配置已删除

---

## 📝 测试实现注意事项

1. **Console API 响应格式**:
   - Console API 通常返回 JSON 格式：`{ "code": "0", "data": ... }`
   - `code` 为 "0" 表示成功，其他值表示错误
   - `data` 包含实际数据

2. **认证要求**:
   - Console API 可能需要认证（Token）
   - 测试时可能需要设置认证头

3. **参数命名**:
   - Console API 可能使用不同的参数名（如 `groupName` 而不是 `group`）
   - 注意参数的大小写和格式

4. **测试数据准备**:
   - 使用 `TestDatabase::new()` 创建测试数据库
   - 插入测试配置和服务
   - 模拟监听请求（通过启动监听 API）

5. **响应验证**:
   - 验证 `code` 字段
   - 验证 `data` 字段的内容和格式
   - 验证 `queryType` 字段（对于监听查询 API）

---

**最后更新**: 2025-01-27（参考 Nacos develop 项目补充）

