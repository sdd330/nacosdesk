# 集成测试场景

> **测试文件**: `src-tauri/src/server/tests/integration_tests.rs`

---

## 1. 配置管理完整流程

### 1.1 完整流程测试

#### 测试用例：创建配置 → 获取配置 → 更新配置 → 监听配置变更 → 删除配置
- **测试函数名**: `test_config_full_lifecycle`
- **前置条件**: 创建测试数据库
- **步骤**:
  1. **创建配置**: `POST /v1/cs/configs?dataId=test-config&group=DEFAULT_GROUP&tenant=public&content=initial-content`
     - 验证: 返回 200 OK，配置已创建
  2. **获取配置**: `GET /v1/cs/configs?dataId=test-config&group=DEFAULT_GROUP&tenant=public`
     - 验证: 返回配置内容 "initial-content"
  3. **更新配置**: `POST /v1/cs/configs?dataId=test-config&group=DEFAULT_GROUP&tenant=public&content=updated-content`
     - 验证: 返回 200 OK，配置已更新
  4. **监听配置变更**: `POST /v1/cs/configs/listener`（使用旧的 MD5）
     - 验证: 立即返回变更信息
  5. **删除配置**: `DELETE /v1/cs/configs?dataId=test-config&group=DEFAULT_GROUP&tenant=public`
     - 验证: 返回 200 OK，配置已删除
  6. **验证删除**: `GET /v1/cs/configs?dataId=test-config&group=DEFAULT_GROUP&tenant=public`
     - 验证: 返回 404 Not Found
- **验证点**: 整个流程执行成功，每个步骤的状态正确

#### 测试用例：配置历史记录和回滚流程
- **测试函数名**: `test_config_history_and_rollback`
- **前置条件**: 创建测试数据库
- **步骤**:
  1. **创建配置**: `content=version1`
  2. **更新配置**: `content=version2`
  3. **更新配置**: `content=version3`
  4. **获取历史记录**: `GET /v1/cs/history?dataId=test-config&group=DEFAULT_GROUP&tenant=public`
     - 验证: 返回 3 条历史记录
  5. **回滚到版本1**: `POST /v3/console/cs/config/rollback`（使用版本1的历史ID）
     - 验证: 返回 200 OK
  6. **获取配置**: 验证配置内容为 "version1"
  7. **获取历史记录**: 验证新增一条回滚记录
- **验证点**: 历史记录正确，回滚功能正常

#### 测试用例：配置导入导出流程
- **测试函数名**: `test_config_import_export`
- **前置条件**: 
  - 创建测试数据库
  - 插入多个测试配置
- **步骤**:
  1. **导出配置**: `GET /v1/cs/configs?export=true&tenant=public`
     - 验证: 返回配置导出数据（JSON 或 ZIP）
  2. **清理配置**: 删除所有配置
  3. **导入配置**: `POST /v1/cs/configs?import=true` + 导出的数据
     - 验证: 返回 200 OK
  4. **验证导入**: 查询配置列表，验证配置已恢复
- **验证点**: 导出和导入功能正常，数据完整性保持

---

## 2. 服务管理完整流程

### 2.1 完整流程测试

#### 测试用例：创建服务 → 注册实例 → 查询服务 → 更新实例 → 注销实例 → 删除服务
- **测试函数名**: `test_service_full_lifecycle`
- **前置条件**: 创建测试数据库
- **步骤**:
  1. **创建服务**: `POST /v1/ns/service?serviceName=test-service&namespaceId=public&groupName=DEFAULT_GROUP`
     - 验证: 返回 200 OK，服务已创建
  2. **注册实例**: `POST /v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service&namespaceId=public&groupName=DEFAULT_GROUP`
     - 验证: 返回 200 OK，实例已注册
  3. **查询服务**: `GET /v1/ns/service?serviceName=test-service&namespaceId=public&groupName=DEFAULT_GROUP`
     - 验证: 返回服务详情，包含实例列表
  4. **更新实例**: `PUT /v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service&namespaceId=public&groupName=DEFAULT_GROUP` + `{"weight":0.8}`
     - 验证: 返回 200 OK，实例权重已更新
  5. **注销实例**: `DELETE /v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service&namespaceId=public&groupName=DEFAULT_GROUP`
     - 验证: 返回 200 OK，实例已注销
  6. **删除服务**: `DELETE /v1/ns/service?serviceName=test-service&namespaceId=public&groupName=DEFAULT_GROUP`
     - 验证: 返回 200 OK，服务已删除
- **验证点**: 整个流程执行成功，每个步骤的状态正确

#### 测试用例：服务发现流程
- **测试函数名**: `test_service_discovery_flow`
- **前置条件**: 创建测试数据库
- **步骤**:
  1. **创建服务**: `serviceName=discovery-service`
  2. **注册多个实例**:
     - `127.0.0.1:8080`（健康）
     - `127.0.0.1:8081`（健康）
     - `127.0.0.1:8082`（不健康）
  3. **查询服务实例列表**: `GET /v1/ns/instance/list?serviceName=discovery-service&namespaceId=public&groupName=DEFAULT_GROUP`
     - 验证: 返回所有实例
  4. **过滤健康实例**: 验证只返回健康实例（如果支持）
  5. **客户端订阅服务**: 模拟客户端订阅服务变更
- **验证点**: 服务发现功能正常，实例列表正确

#### 测试用例：实例健康检查和心跳流程
- **测试函数名**: `test_instance_healthcheck_and_heartbeat`
- **前置条件**: 
  - 创建测试数据库
  - 插入测试服务和实例
- **步骤**:
  1. **注册临时实例**: `ephemeral=true`
  2. **发送心跳**: `PUT /v1/ns/instance/beat`（多次）
     - 验证: 每次返回 200 OK
  3. **查询实例状态**: 验证实例保持健康状态
  4. **停止发送心跳**: 等待心跳超时
  5. **查询实例状态**: 验证实例变为不健康（如果支持自动清理）
- **验证点**: 心跳机制正常，健康检查正确

---

## 3. 跨模块集成测试

### 3.1 跨模块测试

#### 测试用例：命名空间创建 → 配置管理 → 服务管理（命名空间隔离）
- **测试函数名**: `test_namespace_isolation`
- **前置条件**: 创建测试数据库
- **步骤**:
  1. **创建命名空间**: `POST /v1/console/namespaces` + `{"customNamespaceId":"test-ns","namespaceName":"Test"}`
     - 验证: 命名空间已创建
  2. **在 public 命名空间创建配置**: `POST /v1/cs/configs?dataId=config1&tenant=public&content=public-content`
  3. **在 test-ns 命名空间创建配置**: `POST /v1/cs/configs?dataId=config1&tenant=test-ns&content=test-ns-content`
  4. **验证隔离**: 
     - 查询 public 命名空间的配置，应返回 "public-content"
     - 查询 test-ns 命名空间的配置，应返回 "test-ns-content"
  5. **在 public 命名空间创建服务**: `POST /v1/ns/service?serviceName=service1&namespaceId=public`
  6. **在 test-ns 命名空间创建服务**: `POST /v1/ns/service?serviceName=service1&namespaceId=test-ns`
  7. **验证隔离**: 两个命名空间的服务列表互不影响
- **验证点**: 命名空间隔离正确，不同命名空间的资源相互独立

#### 测试用例：用户登录 → 配置管理 → 服务管理（认证流程）
- **测试函数名**: `test_auth_integration`
- **前置条件**: 
  - 创建测试数据库
  - 插入测试用户
- **步骤**:
  1. **登录**: `POST /v1/auth/users/login` + `username=nacos&password=nacos`
     - 验证: 返回 Token
  2. **使用 Token 创建配置**: `POST /v1/cs/configs` + `Authorization: Bearer <token>`
     - 验证: 返回 200 OK（如果配置管理需要认证）
  3. **使用 Token 创建服务**: `POST /v1/ns/service` + `Authorization: Bearer <token>`
     - 验证: 返回 200 OK（如果服务管理需要认证）
  4. **使用无效 Token**: 验证返回 401 Unauthorized
- **验证点**: 认证流程正常，Token 正确验证

#### 测试用例：配置变更 → 服务实例监听（配置监听流程）
- **测试函数名**: `test_config_change_notification`
- **前置条件**: 
  - 创建测试数据库
  - 插入测试配置和服务实例
- **步骤**:
  1. **启动配置监听**: `POST /v1/cs/configs/listener`（后台线程）
  2. **更新配置**: `POST /v1/cs/configs?dataId=test-config&content=new-content`
  3. **验证监听返回**: 监听请求应立即返回配置变更信息
  4. **验证实例收到通知**: 检查实例是否收到配置变更通知（如果支持）
- **验证点**: 配置变更通知机制正常

---

## 4. 配置导出/导入集成测试

### 4.1 配置导出和导入流程

#### 测试用例：配置导出 → 删除 → 导入恢复
- **测试函数名**: `test_config_export_import_restore`
- **前置条件**: 插入多个测试配置
- **步骤**:
  1. **导出配置**: `GET /v1/cs/configs?export=true&ids=1,2,3`
     - 验证: 返回 ZIP 文件
  2. **删除配置**: `DELETE /v1/cs/configs`（批量删除）
     - 验证: 配置已删除
  3. **导入配置**: `POST /v1/cs/configs?import=true`
     - 验证: 配置已恢复
  4. **验证配置**: 获取配置，验证内容一致
- **验证点**: 导出/导入流程完整，配置内容一致

#### 测试用例：配置导出 V2 → 导入 V2（包含元数据）
- **测试函数名**: `test_config_export_import_v2_with_metadata`
- **步骤**:
  1. **导出配置 V2**: `GET /v1/cs/configs?exportV2=true`
     - 验证: ZIP 文件包含 `metadata.yaml`
  2. **导入配置 V2**: `POST /v1/cs/configs?import=true`
     - 验证: 配置和元数据都已导入
- **验证点**: 元数据信息正确恢复

### 4.2 配置克隆集成测试

#### 测试用例：配置克隆 → 修改 → 验证隔离
- **测试函数名**: `test_config_clone_and_modify_isolation`
- **步骤**:
  1. **插入源配置**: `dataId=source-config`, `content=source-content`
  2. **克隆配置**: `POST /v1/cs/configs?clone=true`
     - 克隆到: `dataId=cloned-config`, `group=cloned-group`
  3. **修改克隆的配置**: 更新 `cloned-config` 的内容
  4. **验证隔离**: 
     - 源配置内容不变
     - 克隆配置内容已更新
- **验证点**: 克隆的配置与源配置相互独立

---

## 5. Beta/Gray 配置集成测试（如果实现）

### 5.1 Beta 配置流程

#### 测试用例：发布 Beta 配置 → 查询 → 停止
- **测试函数名**: `test_beta_config_lifecycle`
- **步骤**:
  1. **发布 Beta 配置**: `POST /v1/cs/configs?beta=true&content=beta-content`
  2. **查询 Beta 配置**: `GET /v1/cs/configs?beta=true`
     - 验证: 返回 Beta 配置内容
  3. **查询正式配置**: `GET /v1/cs/configs`
     - 验证: 返回正式配置内容（与 Beta 不同）
  4. **停止 Beta 配置**: `DELETE /v1/cs/configs?beta=true`
     - 验证: Beta 配置已删除
- **验证点**: Beta 配置生命周期正常

---

## 📝 测试实现注意事项

1. **测试数据准备**:
   - 使用 `TestDatabase::new()` 创建测试数据库
   - 按需插入测试数据（用户、命名空间、配置、服务等）

2. **测试顺序**:
   - 集成测试通常有明确的执行顺序
   - 确保前置步骤成功后再执行后续步骤

3. **异步操作**:
   - 配置监听等操作可能需要异步处理
   - 使用 `tokio::time::sleep()` 等待异步操作完成

4. **清理**:
   - 集成测试后应清理所有测试数据
   - 使用 `test_db.cleanup()` 清理

5. **错误处理**:
   - 验证每个步骤的成功/失败
   - 确保错误情况下的回滚或清理

6. **性能考虑**:
   - 集成测试可能较慢，注意超时设置
   - 考虑使用并发执行提高效率（如果测试独立）

---

**最后更新**: 2025-01-27（参考 Nacos develop 项目补充导出/导入、克隆等集成测试场景）

