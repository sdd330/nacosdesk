# Nacos API 测试用例设计文档

> **文档版本**: v1.0  
> **创建日期**: 2025-01-27  
> **状态**: 🚧 进行中

---

## 📋 概述

本文档目录包含 Nacos Standalone API 的详细测试用例设计。测试框架已建立（`src-tauri/src/server/tests/`），本文档为 AI 智能体提供详细的测试用例实现指导。

---

## 📚 测试用例文档索引

### 🔴 高优先级（核心功能）

1. **[配置管理 API 测试](./config-tests.md)**
   - 配置发布、获取、删除、监听
   - 配置历史记录和回滚
   - 配置目录和搜索
   - Console API 配置监听查询（按配置/按 IP）
   - 配置导出/导入（ZIP 格式）
   - 配置克隆（同命名空间）
   - Beta/Gray 配置管理
   - 批量删除配置
   - 配置搜索增强（按内容搜索）
   - 配置高级信息查询

2. **[服务管理 API 测试](./service-tests.md)**
   - 服务列表、详情、CRUD
   - 服务搜索和订阅者查询

3. **[实例管理 API 测试](./instance-tests.md)**
   - 实例注册、查询、心跳
   - 实例更新和批量操作

4. **[认证 API 测试](./auth-tests.md)**
   - 用户登录和 Token 验证
   - 用户列表查询

### 🟡 中优先级（增强功能）

5. **[命名空间管理 API 测试](./namespace-tests.md)**
   - 命名空间 CRUD 操作
   - 命名空间隔离验证

6. **[健康检查 API 测试](./health-tests.md)**
   - 配置服务健康检查
   - 命名服务健康检查
   - 服务器监控指标

7. **[Console API 测试](./console-api-tests.md)** ⚠️ 新增
   - Console API 配置监听查询（按配置/按 IP）
   - Console API 服务订阅者查询
   - Console API 配置回滚
   - Console API 批量操作（如果实现）

### 🟢 低优先级（辅助功能）

8. **[集成测试场景](./integration-tests.md)**
   - 完整业务流程测试
   - 跨模块集成测试

---

## 🎯 测试目标

- ✅ 确保所有 API 端点功能正常
- ✅ 验证 API 响应格式与 nacos-develop 保持一致
- ✅ 覆盖正常流程和异常流程
- ✅ 提高代码测试覆盖率（目标 90%+）

---

## 🛠️ 测试工具和框架

- **测试框架**: Rust 标准测试框架 + tokio
- **HTTP 客户端**: tower ServiceExt
- **数据库**: SQLite（临时数据库）
- **测试辅助**: `src-tauri/src/server/tests/db_setup.rs`

---

## 📝 测试编写规范

### 测试文件结构
```
src-tauri/src/server/tests/
├── mod.rs                    # 测试模块声明
├── db_setup.rs              # 数据库设置辅助
├── helpers.rs               # 测试辅助函数
├── integration_tests.rs     # 集成测试（已有基础）
├── config_tests.rs         # 配置管理 API 测试
├── service_tests.rs         # 服务管理 API 测试
├── instance_tests.rs        # 实例管理 API 测试
├── namespace_tests.rs        # 命名空间管理 API 测试
├── auth_tests.rs            # 认证 API 测试
└── health_tests.rs          # 健康检查 API 测试
```

### 测试命名规范
- 测试函数名：`test_<api_name>_<scenario>`
- 例如：`test_publish_config_success`, `test_get_config_not_found`

### 测试结构模板
```rust
#[tokio::test]
async fn test_<api_name>_<scenario>() {
    // 1. 创建测试数据库
    let test_db = TestDatabase::new().await.unwrap();
    
    // 2. 插入测试数据（如需要）
    test_db.insert_test_xxx().await.unwrap();
    
    // 3. 创建路由并发送请求
    let router = create_router("/nacos".to_string(), test_db.app.clone());
    let request = Request::builder()
        .method("POST")
        .uri("/nacos/v1/cs/configs?dataId=test&group=DEFAULT_GROUP&tenant=public&content=test-content")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(Body::empty())
        .unwrap();
    
    let response = router.oneshot(request).await.unwrap();
    
    // 4. 验证响应
    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let body_str = String::from_utf8(body.to_vec()).unwrap();
    // 验证响应体内容...
    
    // 5. 清理（可选）
    test_db.cleanup().await.unwrap();
}
```

---

## 📊 测试覆盖率与标准兼容性

- **配置管理 API**  
  - 覆盖：发布 / 获取 / 删除 / 历史 / 上一版本 / 监听 / 导入 / 导出 / 克隆 / Beta / 灰度等完整链路  
  - 兼容性：与官方 Nacos OpenAPI 文档参数、响应结构保持一致  
  - 标准测试：`config_standard_api_tests.rs` 验证 GET/POST/DELETE `/cs/configs` 的响应内容类型与示例值  
- **服务管理 API**  
  - 覆盖：服务 CRUD、服务列表、订阅者查询等  
  - 兼容性：`/nacos/v1/ns/service`、`/nacos/v1/ns/service/list` 响应结构对齐官方示例  
- **实例管理 API**  
  - 覆盖：实例 CRUD、列表、心跳、健康状态、批量元数据更新 / 删除等  
  - 兼容性：新增 `instance_standard_api_tests.rs`，对 `/instance/list` 与 `/instance/beat` 的响应字段进行"逐字段"校验  
- **命名空间管理 API**  
  - 覆盖：命名空间 CRUD、命名空间隔离、级联删除配置与服务  
- **认证 API**  
  - 覆盖：登录、用户列表等 Console 相关接口  
- **健康检查 / 运维 API**  
  - 覆盖：配置 / 命名服务健康检查、服务端健康与指标、运维开关、服务器列表、Raft leader 等  
  - 兼容性：返回字段与官方 Nacos Console 使用的接口保持兼容，满足 Spring Boot / Nacos Client 探活需求  
- **Nacos 兼容性测试** ⭐ 新增  
  - 文件：`nacos_compatibility_tests.rs`  
  - 目的：参考本地运行的 Nacos Server（Java 版本）的真实 API 响应格式，验证 Nacos Desktop Standalone API 服务的实现与标准 Nacos Server 一致  
  - 测试内容（**完整 CRUD 覆盖**）：
    - **配置管理 CRUD**：
      - POST `/nacos/v1/cs/configs` - 创建配置（验证响应 Body: "true"）
      - GET `/nacos/v1/cs/configs` - 获取配置（验证响应头格式：Content-Type、Config-Type、Content-MD5、Last-Modified 等）
      - POST `/nacos/v1/cs/configs` - 更新配置（通过 POST 更新已存在的配置）
      - DELETE `/nacos/v1/cs/configs` - 删除配置（验证响应格式：Content-Type: application/json，Body: "true"）
    - **服务管理 CRUD**：
      - POST `/nacos/v1/ns/service` - 创建服务（验证响应 Body: "ok"）
      - GET `/nacos/v1/ns/service` - 查询服务详情（验证响应格式：包含 name、groupName、namespaceId、protectThreshold、metadata、hosts 等字段）
      - PUT `/nacos/v1/ns/service` - 更新服务（验证响应 Body: "ok"）
      - DELETE `/nacos/v1/ns/service` - 删除服务（验证响应 Body: "ok"）
      - GET `/nacos/v1/ns/service/list` - 查询服务列表（验证响应格式：{"count":<number>,"doms":[...]}）
    - **实例管理 CRUD**：
      - POST `/nacos/v1/ns/instance` - 注册实例（验证响应 Body: "ok"）
      - GET `/nacos/v1/ns/instance/list` - 查询实例列表（验证响应格式：包含 name、groupName、clusters、cacheMillis、hosts、lastRefTime 等字段）
      - PUT `/nacos/v1/ns/instance` - 更新实例（验证响应 Body: "ok"）
      - DELETE `/nacos/v1/ns/instance` - 注销实例（验证响应 Body: "ok"）
    - **命名空间管理 CRUD**：
      - POST `/nacos/v1/console/namespaces` - 创建命名空间（验证响应格式：RestResult 格式）
      - GET `/nacos/v1/console/namespaces` - 查询命名空间列表（验证响应格式：RestResult 格式：{"code":200,"message":null,"data":[...]}）
      - PUT `/nacos/v1/console/namespaces` - 更新命名空间（验证响应格式：RestResult 格式）
      - DELETE `/nacos/v1/console/namespaces` - 删除命名空间（验证响应格式：RestResult 格式）
    - **运维/监控 API**：
      - GET `/nacos/v1/ns/operator/switches` - 验证响应格式（包含 enableStandalone、healthCheckEnabled、pushEnabled 等字段）
      - GET `/nacos/v1/cs/health` - 验证响应格式（Content-Type: text/plain，Body: "UP"）

> 当前集成测试总数超过 README 中标注的 193 个，并在关键路径（实例 + 服务 + 配置）上新增了"标准 OpenAPI 兼容性测试"和"Nacos 兼容性测试"，目标是 **对官方 Nacos OpenAPI 实现 1:1 兼容**，保证 Spring Boot / 标准 Nacos Client **开箱可用**。

---

## 📚 参考文档

- [测试框架文档](../../src-tauri/src/server/tests/README.md)
- [Nacos 官方 API 文档](https://nacos.io/docs/latest/)
- [nacos-develop 测试用例](https://github.com/alibaba/nacos/tree/develop/test)

---

**最后更新**: 2025-01-27（参考 Nacos develop 项目补充缺失测试用例设计）

