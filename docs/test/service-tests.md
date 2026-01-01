# 服务管理 API 测试用例

> **API 路径前缀**: `/nacos/v1/ns/service`  
> **测试文件**: `src-tauri/src/server/tests/service_tests.rs`

---

## 1. 服务列表 API (`GET /v1/ns/service/list`)

### 1.1 基础功能测试

#### 测试用例：获取服务列表（成功）
- **测试函数名**: `test_list_services_success`
- **前置条件**:
  - 创建测试数据库
  - 插入多个测试服务：
    - `service_name=service-1`, `namespace_id=public`, `group_name=DEFAULT_GROUP`
    - `service_name=service-2`, `namespace_id=public`, `group_name=DEFAULT_GROUP`
- **请求**:
  - 方法: `GET`
  - URI: `/nacos/v1/ns/service/list?pageNo=1&pageSize=10&namespaceId=public&groupName=DEFAULT_GROUP`
- **预期响应**:
  - 状态码: `200 OK`
  - 响应体: JSON 格式，包含服务列表和总数
- **验证点**:
  - 响应状态码为 200
  - 返回的服务列表包含插入的服务
  - 总数（count）正确

#### 测试用例：分页功能（pageNo、pageSize）
- **测试函数名**: `test_list_services_pagination`
- **前置条件**: 插入超过 10 个服务
- **测试场景**:
  1. `pageNo=1&pageSize=10`：返回前10个服务
  2. `pageNo=2&pageSize=10`：返回第11-20个服务
  3. `pageNo=1&pageSize=5`：返回前5个服务
- **验证点**: 分页功能正确，返回正确的服务数量

#### 测试用例：不同命名空间的服务列表
- **测试函数名**: `test_list_services_different_namespaces`
- **前置条件**:
  - 插入命名空间：`namespace_id=test-ns`
  - 插入服务：
    - `namespace_id=public` 的服务
    - `namespace_id=test-ns` 的服务
- **测试场景**:
  1. `namespaceId=public`：只返回 public 命名空间的服务
  2. `namespaceId=test-ns`：只返回 test-ns 命名空间的服务
- **验证点**: 命名空间隔离正确

#### 测试用例：不同 Group 的服务列表
- **测试函数名**: `test_list_services_different_groups`
- **前置条件**: 插入不同 group 的服务
- **测试场景**:
  1. `groupName=DEFAULT_GROUP`：只返回默认组的服务
  2. `groupName=custom-group`：只返回自定义组的服务
- **验证点**: Group 过滤正确

#### 测试用例：空列表返回
- **测试函数名**: `test_list_services_empty`
- **前置条件**: 创建测试数据库（不插入服务）
- **请求**: `GET /nacos/v1/ns/service/list?namespaceId=public&groupName=DEFAULT_GROUP`
- **预期响应**:
  - 状态码: `200 OK`
  - 响应体: 空列表或 `{"count":0,"services":[]}`
- **验证点**: 返回空列表

### 1.2 参数验证测试

#### 测试用例：无效的分页参数
- **测试函数名**: `test_list_services_invalid_pagination`
- **测试场景**:
  1. `pageNo=0`：应使用默认值或返回错误
  2. `pageNo=-1`：应返回错误
  3. `pageSize=0`：应使用默认值或返回错误
  4. `pageSize=-1`：应返回错误
- **验证点**: 参数验证正确

#### 测试用例：无效的命名空间 ID
- **测试函数名**: `test_list_services_invalid_namespace`
- **请求**: `GET /nacos/v1/ns/service/list?namespaceId=non-existent`
- **预期响应**: `200 OK` 或 `404 Not Found`（根据实现）
- **验证点**: 根据实现验证行为

---

## 2. 服务详情 API (`GET /v1/ns/service`)

### 2.1 基础功能测试

#### 测试用例：获取存在的服务详情（成功）
- **测试函数名**: `test_get_service_success`
- **前置条件**:
  - 创建测试数据库
  - 插入测试服务：`service_name=test-service`, `namespace_id=public`, `group_name=DEFAULT_GROUP`
  - 可选：插入服务实例
- **请求**:
  - 方法: `GET`
  - URI: `/nacos/v1/ns/service?serviceName=test-service&namespaceId=public&groupName=DEFAULT_GROUP`
- **预期响应**:
  - 状态码: `200 OK`
  - 响应体: JSON 格式，包含服务详情（名称、命名空间、组、实例列表等）
- **验证点**:
  - 响应状态码为 200
  - 服务详情信息完整
  - 包含实例列表（如果有）

#### 测试用例：获取不存在的服务（404）
- **测试函数名**: `test_get_service_not_found`
- **前置条件**: 创建测试数据库（不插入服务）
- **请求**: `GET /nacos/v1/ns/service?serviceName=non-existent&namespaceId=public&groupName=DEFAULT_GROUP`
- **预期响应**:
  - 状态码: `404 Not Found`
  - 响应体: 错误消息
- **验证点**: 返回 404 状态码

#### 测试用例：服务详情包含实例列表
- **测试函数名**: `test_get_service_with_instances`
- **前置条件**:
  - 插入测试服务
  - 插入多个服务实例
- **验证点**: 服务详情中包含所有实例信息

#### 测试用例：服务元数据信息
- **测试函数名**: `test_get_service_metadata`
- **前置条件**: 插入带元数据的服务
- **验证点**: 服务详情中包含元数据信息

---

## 3. 服务创建 API (`POST /v1/ns/service`)

### 3.1 基础功能测试

#### 测试用例：创建新服务（成功）
- **测试函数名**: `test_create_service_success`
- **前置条件**: 创建测试数据库
- **请求**:
  - 方法: `POST`
  - URI: `/nacos/v1/ns/service?serviceName=test-service&namespaceId=public&groupName=DEFAULT_GROUP`
  - Body: 可选 JSON（元数据、保护阈值等）
- **预期响应**:
  - 状态码: `200 OK` 或 `201 Created`
  - 响应体: `true` 或成功消息
- **验证点**:
  - 响应状态码正确
  - 数据库中服务已创建

#### 测试用例：创建已存在的服务（错误处理）
- **测试函数名**: `test_create_service_already_exists`
- **前置条件**: 插入测试服务
- **请求**: 同上，使用相同的服务名
- **预期响应**: `400 Bad Request` 或 `409 Conflict`
- **验证点**: 返回错误状态码

#### 测试用例：服务元数据设置
- **测试函数名**: `test_create_service_with_metadata`
- **请求**: Body 包含元数据 JSON
- **验证点**: 元数据正确保存

#### 测试用例：保护阈值设置
- **测试函数名**: `test_create_service_with_protect_threshold`
- **请求**: Body 包含 `protectThreshold` 参数
- **验证点**: 保护阈值正确保存

---

## 4. 服务更新 API (`PUT /v1/ns/service`)

### 4.1 基础功能测试

#### 测试用例：更新服务元数据
- **测试函数名**: `test_update_service_metadata`
- **前置条件**: 插入测试服务
- **请求**:
  - 方法: `PUT`
  - URI: `/nacos/v1/ns/service?serviceName=test-service&namespaceId=public&groupName=DEFAULT_GROUP`
  - Body: JSON 包含新的元数据
- **预期响应**: `200 OK`
- **验证点**: 元数据已更新

#### 测试用例：更新保护阈值
- **测试函数名**: `test_update_service_protect_threshold`
- **前置条件**: 插入测试服务
- **请求**: Body 包含新的 `protectThreshold`
- **验证点**: 保护阈值已更新

#### 测试用例：更新不存在的服务（404）
- **测试函数名**: `test_update_service_not_found`
- **前置条件**: 创建测试数据库（不插入服务）
- **请求**: 更新不存在的服务
- **预期响应**: `404 Not Found`
- **验证点**: 返回 404 状态码

---

## 5. 服务删除 API (`DELETE /v1/ns/service`)

### 5.1 基础功能测试

#### 测试用例：删除存在的服务（成功）
- **测试函数名**: `test_delete_service_success`
- **前置条件**:
  - 创建测试数据库
  - 插入测试服务
- **请求**:
  - 方法: `DELETE`
  - URI: `/nacos/v1/ns/service?serviceName=test-service&namespaceId=public&groupName=DEFAULT_GROUP`
- **预期响应**:
  - 状态码: `200 OK`
  - 响应体: `true`
- **验证点**:
  - 响应状态码为 200
  - 数据库中服务已删除

#### 测试用例：删除不存在的服务（404）
- **测试函数名**: `test_delete_service_not_found`
- **前置条件**: 创建测试数据库（不插入服务）
- **请求**: `DELETE /nacos/v1/ns/service?serviceName=non-existent&namespaceId=public&groupName=DEFAULT_GROUP`
- **预期响应**: `404 Not Found`
- **验证点**: 返回 404 状态码

#### 测试用例：删除服务后实例也被删除
- **测试函数名**: `test_delete_service_cascades_instances`
- **前置条件**:
  - 插入测试服务
  - 插入多个服务实例
- **步骤**:
  1. 删除服务
  2. 查询实例列表
- **验证点**: 所有实例也被删除（级联删除）

---

## 6. 服务名搜索 API (`GET /v1/ns/service/names`)

### 6.1 基础功能测试

#### 测试用例：搜索服务名（模糊匹配）
- **测试函数名**: `test_search_service_names_success`
- **前置条件**: 插入多个服务：
  - `service_name=test-service-1`
  - `service_name=test-service-2`
  - `service_name=other-service`
- **请求**: `GET /nacos/v1/ns/service/names?namespaceId=public&groupName=DEFAULT_GROUP&serviceName=test`
- **预期响应**:
  - 状态码: `200 OK`
  - 响应体: JSON 格式，包含匹配的服务名列表
- **验证点**: 返回包含 "test" 的服务名

#### 测试用例：搜索不存在的服务名（空结果）
- **测试函数名**: `test_search_service_names_not_found`
- **请求**: `GET /nacos/v1/ns/service/names?namespaceId=public&serviceName=non-existent`
- **预期响应**: 空列表
- **验证点**: 返回空列表

#### 测试用例：分页功能
- **测试函数名**: `test_search_service_names_pagination`
- **前置条件**: 插入多个匹配的服务
- **请求**: 包含 `pageNo` 和 `pageSize` 参数
- **验证点**: 分页功能正确

---

## 7. 服务订阅者列表 API (`GET /v1/ns/service/subscribers`)

### 7.1 基础功能测试

#### 测试用例：获取服务的订阅者列表
- **测试函数名**: `test_get_service_subscribers_success`
- **前置条件**:
  - 插入测试服务
  - 插入订阅者记录（通过实例注册等方式）
- **请求**: `GET /nacos/v1/ns/service/subscribers?serviceName=test-service&namespaceId=public&groupName=DEFAULT_GROUP`
- **预期响应**:
  - 状态码: `200 OK`
  - 响应体: JSON 格式，包含订阅者列表
- **验证点**: 返回订阅者信息

#### 测试用例：无订阅者时返回空列表
- **测试函数名**: `test_get_service_subscribers_empty`
- **前置条件**: 插入测试服务（无订阅者）
- **请求**: 同上
- **预期响应**: 空列表
- **验证点**: 返回空列表

#### 测试用例：多个订阅者的情况
- **测试函数名**: `test_get_service_subscribers_multiple`
- **前置条件**: 插入多个订阅者
- **验证点**: 返回所有订阅者信息

---

## 8. Console API 服务订阅者查询 (`GET /v3/console/ns/service/subscribers`)

### 8.1 基础功能测试

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
  - 响应格式与标准 API 可能不同（Console API 格式）

#### 测试用例：Console API 无订阅者时返回空列表
- **测试函数名**: `test_console_get_service_subscribers_empty`
- **前置条件**: 插入测试服务（无订阅者）
- **验证点**: 返回空列表

---

## 📝 测试实现注意事项

1. **测试数据准备**:
   - 使用 `TestDatabase::new()` 创建测试数据库
   - 使用 `insert_test_service()` 插入测试服务
   - 使用 `insert_test_instance()` 插入服务实例
   - 使用 `insert_test_namespace()` 插入测试命名空间

2. **请求构建**:
   - 注意 URL 参数的正确格式
   - POST/PUT 请求可能需要 JSON Body

3. **响应验证**:
   - 验证状态码
   - 验证响应体格式和内容
   - 验证数据库状态（可选）

4. **清理**:
   - 使用 `test_db.cleanup()` 清理测试数据

---

**最后更新**: 2025-01-27（参考 Nacos develop 项目补充 Console API 测试用例）

