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

## 📊 测试覆盖率目标

- **配置管理 API**: 目标 90%+
- **服务管理 API**: 目标 90%+
- **实例管理 API**: 目标 90%+
- **命名空间管理 API**: 目标 90%+
- **认证 API**: 目标 90%+
- **健康检查 API**: 目标 100%

---

## 📈 进度跟踪

- **总任务数**: 约 165+ 个测试用例（参考 Nacos develop 项目）
- **已完成**: 148 个（实际统计：integration_tests.rs 中的测试函数）
- **进行中**: 0 个
- **待完成**: 17+ 个（Console API、导出/导入、克隆、Beta/Gray 等）
- **完成率**: 约 90%

---

## 📚 参考文档

- [测试框架文档](../../src-tauri/src/server/tests/README.md)
- [Nacos 官方 API 文档](https://nacos.io/docs/latest/)
- [nacos-develop 测试用例](https://github.com/alibaba/nacos/tree/develop/test)

---

**最后更新**: 2025-01-27（参考 Nacos develop 项目补充缺失测试用例设计）

