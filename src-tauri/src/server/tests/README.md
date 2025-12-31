# Nacos Standalone API 服务器测试

## 测试结构

### 单元测试
- `config_tests.rs` - 配置管理 API 参数解析测试
- `service_tests.rs` - 服务管理 API 参数解析测试
- `instance_tests.rs` - 实例管理 API 参数解析测试
- `auth_tests.rs` - 认证 API 测试
- `health_tests.rs` - 健康检查 API 测试

### 集成测试
- `integration_tests.rs` - 使用真实 SQLite 数据库的完整 API 集成测试
- `db_setup.rs` - 测试数据库设置和清理辅助模块

## 运行测试

```bash
# 运行所有测试
cargo test --lib server::tests

# 运行集成测试
cargo test --lib server::tests::integration_tests

# 运行特定测试
cargo test --lib server::tests::integration_tests::test_publish_config
```

## 测试数据库

集成测试使用临时 SQLite 数据库：
- 每个测试都会创建独立的临时数据库
- 测试前会自动运行所有数据库迁移
- 测试后会自动清理测试数据
- 临时数据库文件会在测试结束后自动删除

## Mock 数据

测试辅助模块 `db_setup.rs` 提供了以下方法插入测试数据：
- `insert_test_user()` - 插入测试用户
- `insert_test_config()` - 插入测试配置
- `insert_test_service()` - 插入测试服务
- `insert_test_instance()` - 插入测试实例
- `insert_test_namespace()` - 插入测试命名空间
- `cleanup()` - 清理所有测试数据

## 示例

```rust
#[tokio::test]
async fn test_example() {
    // 创建测试数据库
    let test_db = TestDatabase::new().await.unwrap();
    
    // 插入测试数据
    test_db.insert_test_config("test-config", "DEFAULT_GROUP", "public", "test-content").await.unwrap();
    
    // 创建路由并测试 API
    let router = create_router("/nacos".to_string(), test_db.app.clone());
    // ... 测试代码 ...
    
    // 清理测试数据
    test_db.cleanup().await.unwrap();
}
```

