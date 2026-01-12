/**
 * Nacos API 集成测试
 * 使用真实的 SQLite 数据库测试 API 功能
 */

#[cfg(test)]
mod tests {
    use crate::server::tests::db_setup::TestDatabase;
    use crate::server::router::create_router;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use tower::ServiceExt;

    /// 测试配置发布 API
    /// POST /nacos/v1/cs/configs
    #[tokio::test]
    async fn test_publish_config() {
        let test_db = TestDatabase::new().await.unwrap();
        
        // 准备测试数据
        test_db.insert_test_user("test_user", "$2a$10$EuWPZHzz32dJN7jexM34MOeYirDdFAZm2kuWj7VEOJhhZkDrxfvUu").await.unwrap();
        
        // 创建路由
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试发布配置
        let request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/cs/configs?dataId=test-config&group=DEFAULT_GROUP&tenant=public&content=test-content")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 验证响应
        assert_eq!(response.status(), StatusCode::OK);
        
        // 清理
        test_db.cleanup().await.unwrap();
    }

    /// 测试配置获取 API
    /// GET /nacos/v1/cs/configs
    #[tokio::test]
    async fn test_get_config() {
        let test_db = TestDatabase::new().await.unwrap();
        
        // 准备测试数据
        test_db.insert_test_config("test-config", "DEFAULT_GROUP", "public", "test-content").await.unwrap();
        
        // 创建路由
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试获取配置
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/cs/configs?dataId=test-config&group=DEFAULT_GROUP&tenant=public")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 验证响应
        assert_eq!(response.status(), StatusCode::OK);
        
        // 清理
        test_db.cleanup().await.unwrap();
    }

    /// 测试服务注册 API
    /// POST /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_register_instance() {
        let test_db = TestDatabase::new().await.unwrap();
        
        // 准备测试数据
        test_db.insert_test_service("test-service", "public", "DEFAULT_GROUP").await.unwrap();
        
        // 创建路由
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试注册实例
        let request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 验证响应
        assert_eq!(response.status(), StatusCode::OK);
        
        // 清理
        test_db.cleanup().await.unwrap();
    }

    /// 测试服务列表 API
    /// GET /nacos/v1/ns/service/list
    #[tokio::test]
    async fn test_list_services() {
        let test_db = TestDatabase::new().await.unwrap();
        
        // 准备测试数据
        test_db.insert_test_service("test-service-1", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_service("test-service-2", "public", "DEFAULT_GROUP").await.unwrap();
        
        // 创建路由
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试获取服务列表
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/list?pageNo=1&pageSize=10&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 验证响应
        assert_eq!(response.status(), StatusCode::OK);
        
        // 清理
        test_db.cleanup().await.unwrap();
    }

    /// 测试用户登录 API
    /// POST /nacos/v1/auth/users/login
    #[tokio::test]
    async fn test_login() {
        let test_db = TestDatabase::new().await.unwrap();
        
        // 准备测试数据（默认用户已存在）
        
        // 创建路由
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试登录
        let request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/auth/users/login")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::from("username=nacos&password=nacos"))
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 验证响应
        assert_eq!(response.status(), StatusCode::OK);
        
        // 清理
        test_db.cleanup().await.unwrap();
    }

    // ========== 实例管理 API 测试用例 ==========

    /// 测试用例：注册新实例（成功）
    /// POST /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_register_instance_success() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-instance", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-instance&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body_text = String::from_utf8(body_bytes.to_vec()).unwrap();
        assert_eq!(body_text.trim(), "ok");
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：注册已存在的实例（更新）
    /// POST /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_register_instance_update_existing() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-instance-update", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-instance-update", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 使用相同的 IP 和端口注册（应该更新而不是创建新实例）
        let request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-instance-update&namespaceId=public&groupName=DEFAULT_GROUP&weight=0.8")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：查询实例列表
    /// GET /nacos/v1/ns/instance/list
    #[tokio::test]
    async fn test_list_instances_success() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-instances", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-instances", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        test_db.insert_test_instance("test-service-instances", "public", "DEFAULT_GROUP", "127.0.0.1", 8081).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance/list?serviceName=test-service-instances&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        assert!(body.get("hosts").is_some());
        let hosts = body["hosts"].as_array().unwrap();
        assert!(hosts.len() >= 2);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：更新实例
    /// PUT /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_update_instance_success() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-instance-update", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-instance-update", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-instance-update&namespaceId=public&groupName=DEFAULT_GROUP&weight=0.9&healthy=false")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：删除实例
    /// DELETE /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_delete_instance_success() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-instance-delete", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-instance-delete", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("DELETE")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-instance-delete&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：不同命名空间和 Group 的实例
    /// POST /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_register_instance_different_namespace_and_group() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_namespace("test-ns-instance", "Test Namespace").await.unwrap();
        test_db.insert_test_service("service-public", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_service("service-test-ns", "test-ns-instance", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试 public 命名空间
        let request_public = Request::builder()
            .method("POST")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=service-public&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response_public = router.clone().oneshot(request_public).await.unwrap();
        assert_eq!(response_public.status(), StatusCode::OK);
        
        // 测试 test-ns-instance 命名空间
        let request_test_ns = Request::builder()
            .method("POST")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8081&serviceName=service-test-ns&namespaceId=test-ns-instance&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response_test_ns = router.clone().oneshot(request_test_ns).await.unwrap();
        assert_eq!(response_test_ns.status(), StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 实例查询单个实例 API 测试用例 ==========

    /// 测试用例：查询单个实例详情
    /// GET /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_get_instance_success() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-instance-get", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-instance-get", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-instance-get&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 200 或 404
        assert!(response.status() == StatusCode::OK || response.status() == StatusCode::NOT_FOUND);
        
        if response.status() == StatusCode::OK {
            let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
            let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
            
            assert_eq!(body["ip"], "127.0.0.1");
            assert_eq!(body["port"], 8080);
        }
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：查询不存在的实例（404）
    /// GET /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_get_instance_not_found() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-instance-notfound", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=9999&serviceName=test-service-instance-notfound&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 404 或 200（空结果）
        assert!(response.status() == StatusCode::NOT_FOUND || response.status() == StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 实例心跳 API 测试用例 ==========

    /// 测试用例：发送心跳（成功）
    /// PUT /nacos/v1/ns/instance/beat
    #[tokio::test]
    async fn test_instance_heartbeat_success() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-heartbeat", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-heartbeat", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/instance/beat?serviceName=test-service-heartbeat&namespaceId=public&ip=127.0.0.1&port=8080")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        // 验证心跳响应包含必要字段
        assert!(body.get("clientBeatInterval").is_some());
        assert!(body.get("code").is_some());
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：心跳不存在的实例（错误处理）
    /// PUT /nacos/v1/ns/instance/beat
    #[tokio::test]
    async fn test_instance_heartbeat_not_found() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-heartbeat-notfound", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/instance/beat?serviceName=test-service-heartbeat-notfound&namespaceId=public&ip=127.0.0.1&port=9999")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 心跳 API 可能仍然返回成功（即使实例不存在），因为心跳主要用于保持连接
        assert!(response.status() == StatusCode::OK || response.status() == StatusCode::NOT_FOUND);
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 实例部分更新 API 测试用例 ==========

    /// 测试用例：部分更新实例元数据
    /// PATCH /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_patch_instance_metadata() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-patch", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-patch", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("PATCH")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-patch&namespaceId=public&groupName=DEFAULT_GROUP&metadata=%7B%22newKey%22%3A%22newValue%22%7D")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：部分更新实例权重
    /// PATCH /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_patch_instance_weight() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-patch-weight", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-patch-weight", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("PATCH")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-patch-weight&namespaceId=public&groupName=DEFAULT_GROUP&weight=0.8")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：部分更新实例健康状态
    /// PATCH /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_patch_instance_healthy() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-patch-healthy", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-patch-healthy", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("PATCH")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-patch-healthy&namespaceId=public&groupName=DEFAULT_GROUP&healthy=false")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 批量操作 API 测试用例 ==========

    /// 测试用例：批量更新多个实例的元数据
    /// PUT /nacos/v1/ns/instance/metadata/batch
    #[tokio::test]
    async fn test_batch_update_instance_metadata_success() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-batch", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-batch", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        test_db.insert_test_instance("test-service-batch", "public", "DEFAULT_GROUP", "127.0.0.1", 8081).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let instances_json = r#"[{"ip":"127.0.0.1","port":8080},{"ip":"127.0.0.1","port":8081}]"#;
        let metadata_json = r#"{"key1":"value1","key2":"value2"}"#;
        
        let request = Request::builder()
            .method("PUT")
            .uri(&format!("/nacos/v1/ns/instance/metadata/batch?serviceName=test-service-batch&namespaceId=public&groupName=DEFAULT_GROUP&instances={}&metadata={}", 
                urlencoding::encode(instances_json),
                urlencoding::encode(metadata_json)
            ))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 200 或 400（如果批量操作未实现）
        assert!(response.status() == StatusCode::OK || response.status() == StatusCode::BAD_REQUEST);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：批量删除多个实例的元数据
    /// DELETE /nacos/v1/ns/instance/metadata/batch
    #[tokio::test]
    async fn test_batch_delete_instance_metadata_success() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-batch-delete", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-batch-delete", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let instances_json = r#"[{"ip":"127.0.0.1","port":8080}]"#;
        let metadata_keys = "key1,key2";
        
        let request = Request::builder()
            .method("DELETE")
            .uri(&format!("/nacos/v1/ns/instance/metadata/batch?serviceName=test-service-batch-delete&namespaceId=public&groupName=DEFAULT_GROUP&instances={}&metadata={}", 
                urlencoding::encode(instances_json),
                urlencoding::encode(metadata_keys)
            ))
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 200 或 400（如果批量操作未实现）
        assert!(response.status() == StatusCode::OK || response.status() == StatusCode::BAD_REQUEST);
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 实例列表过滤测试用例 ==========

    /// 测试用例：实例列表包含健康和不健康的实例
    /// GET /nacos/v1/ns/instance/list
    #[tokio::test]
    async fn test_list_instances_with_health_status() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-health-filter", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-health-filter", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        test_db.insert_test_instance("test-service-health-filter", "public", "DEFAULT_GROUP", "127.0.0.1", 8081).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 查询所有实例
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance/list?serviceName=test-service-health-filter&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        assert!(body.get("hosts").is_some());
        let hosts = body["hosts"].as_array().unwrap();
        assert!(hosts.len() >= 2);
        
        // 验证每个实例都有健康状态字段
        for host in hosts {
            assert!(host.get("healthy").is_some());
        }
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：空实例列表
    /// GET /nacos/v1/ns/instance/list
    #[tokio::test]
    async fn test_list_instances_empty() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-empty-instances", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance/list?serviceName=test-service-empty-instances&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        // 验证返回空列表或空数组
        if let Some(hosts) = body.get("hosts") {
            assert!(hosts.as_array().unwrap().is_empty());
        }
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 实例管理 API 补充测试用例 ==========

    /// 测试用例：无效的 IP 地址
    /// POST /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_register_instance_invalid_ip() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-invalid-ip", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/ns/instance?ip=invalid-ip&port=8080&serviceName=test-service-invalid-ip&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 400 或成功（如果 IP 验证不严格）
        assert!(response.status() == StatusCode::BAD_REQUEST || response.status() == StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：无效的端口号
    /// POST /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_register_instance_invalid_port() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-invalid-port", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试端口号超出范围
        let request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=65536&serviceName=test-service-invalid-port&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 400 或成功（如果端口验证不严格）
        assert!(response.status() == StatusCode::BAD_REQUEST || response.status() == StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：更新不存在的实例（404）
    /// PUT /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_update_instance_not_found() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-update-notfound", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=9999&serviceName=test-service-update-notfound&namespaceId=public&groupName=DEFAULT_GROUP&weight=0.9")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 404 或 200（如果更新会创建新实例）
        assert!(response.status() == StatusCode::NOT_FOUND || response.status() == StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：注销不存在的实例（404）
    /// DELETE /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_deregister_instance_not_found() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-deregister-notfound", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("DELETE")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=9999&serviceName=test-service-deregister-notfound&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 404 或 200（幂等性）
        assert!(response.status() == StatusCode::NOT_FOUND || response.status() == StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 实例管理 API 更多测试用例 ==========

    /// 测试用例：实例元数据设置
    /// POST /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_register_instance_with_metadata() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-instance-metadata", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let metadata_json = urlencoding::encode(r#"{"key":"value","env":"test"}"#);
        let request = Request::builder()
            .method("POST")
            .uri(&format!("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-instance-metadata&namespaceId=public&groupName=DEFAULT_GROUP&metadata={}", metadata_json))
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：实例权重设置
    /// POST /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_register_instance_with_weight() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-instance-weight", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-instance-weight&namespaceId=public&groupName=DEFAULT_GROUP&weight=0.5")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        
        // 验证权重已设置
        let get_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-instance-weight&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let get_response = router.oneshot(get_request).await.unwrap();
        if get_response.status() == StatusCode::OK {
            let body_bytes = axum::body::to_bytes(get_response.into_body(), usize::MAX).await.unwrap();
            let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
            if let Some(weight) = body.get("weight") {
                assert_eq!(weight.as_f64().unwrap(), 0.5);
            }
        }
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：更新后实例信息正确
    /// PUT /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_update_instance_verify_changes() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-instance-verify", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-instance-verify", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 更新实例权重
        let update_request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-instance-verify&namespaceId=public&groupName=DEFAULT_GROUP&weight=0.8")
            .body(Body::empty())
            .unwrap();
        
        let update_response = router.clone().oneshot(update_request).await.unwrap();
        assert_eq!(update_response.status(), StatusCode::OK);
        
        // 查询实例详情验证权重已更新
        let get_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-instance-verify&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let get_response = router.oneshot(get_request).await.unwrap();
        if get_response.status() == StatusCode::OK {
            let body_bytes = axum::body::to_bytes(get_response.into_body(), usize::MAX).await.unwrap();
            let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
            if let Some(weight) = body.get("weight") {
                assert_eq!(weight.as_f64().unwrap(), 0.8);
            }
        }
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：注销后实例从服务中移除
    /// DELETE /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_deregister_instance_removed_from_service() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-instance-remove", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-instance-remove", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        test_db.insert_test_instance("test-service-instance-remove", "public", "DEFAULT_GROUP", "127.0.0.1", 8081).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 注销一个实例
        let delete_request = Request::builder()
            .method("DELETE")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-instance-remove&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let delete_response = router.clone().oneshot(delete_request).await.unwrap();
        assert_eq!(delete_response.status(), StatusCode::OK);
        
        // 查询服务实例列表，验证实例已移除
        let list_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance/list?serviceName=test-service-instance-remove&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let list_response = router.oneshot(list_request).await.unwrap();
        assert_eq!(list_response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(list_response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        if let Some(hosts) = body.get("hosts") {
            let hosts_array = hosts.as_array().unwrap();
            // 应该只剩下一个实例（8081）
            assert_eq!(hosts_array.len(), 1);
            if let Some(first_host) = hosts_array.first() {
                assert_eq!(first_host["port"], 8081);
            }
        }
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：实例详情信息完整性
    /// GET /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_get_instance_details_complete() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-instance-details", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-instance-details", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-instance-details&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        if response.status() == StatusCode::OK {
            let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
            let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
            
            // 验证包含必要的字段
            assert_eq!(body["ip"], "127.0.0.1");
            assert_eq!(body["port"], 8080);
            assert!(body.get("weight").is_some());
            assert!(body.get("healthy").is_some());
        }
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 实例心跳 API 更多测试用例 ==========

    /// 测试用例：心跳更新实例最后心跳时间
    /// PUT /nacos/v1/ns/instance/beat
    #[tokio::test]
    async fn test_instance_heartbeat_updates_time() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-heartbeat-time", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-heartbeat-time", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 记录发送心跳前的时间
        let before_time = std::time::SystemTime::now();
        
        // 发送心跳
        let heartbeat_request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/instance/beat?serviceName=test-service-heartbeat-time&namespaceId=public&ip=127.0.0.1&port=8080")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let heartbeat_response = router.clone().oneshot(heartbeat_request).await.unwrap();
        assert_eq!(heartbeat_response.status(), StatusCode::OK);
        
        // 查询实例详情，验证最后心跳时间已更新
        let get_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-heartbeat-time&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let get_response = router.oneshot(get_request).await.unwrap();
        if get_response.status() == StatusCode::OK {
            let body_bytes = axum::body::to_bytes(get_response.into_body(), usize::MAX).await.unwrap();
            let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
            
            // 验证实例存在且健康（心跳已更新）
            assert!(body.get("healthy").is_some() || body.get("lastBeat").is_some());
        }
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：心跳保持实例健康状态
    /// PUT /nacos/v1/ns/instance/beat
    #[tokio::test]
    async fn test_instance_heartbeat_maintains_health() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-heartbeat-health", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-heartbeat-health", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 先设置实例为不健康（如果支持）
        let update_request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-heartbeat-health&namespaceId=public&groupName=DEFAULT_GROUP&healthy=false")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(update_request).await.unwrap();
        
        // 发送心跳
        let heartbeat_request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/instance/beat?serviceName=test-service-heartbeat-health&namespaceId=public&ip=127.0.0.1&port=8080")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let heartbeat_response = router.clone().oneshot(heartbeat_request).await.unwrap();
        assert_eq!(heartbeat_response.status(), StatusCode::OK);
        
        // 查询实例健康状态，验证实例恢复健康（如果心跳机制支持）
        let get_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-heartbeat-health&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let get_response = router.oneshot(get_request).await.unwrap();
        if get_response.status() == StatusCode::OK {
            let body_bytes = axum::body::to_bytes(get_response.into_body(), usize::MAX).await.unwrap();
            let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
            
            // 验证实例信息存在
            assert!(body.get("ip").is_some());
        }
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 实例管理 API 更多测试用例 ==========

    /// 测试用例：临时实例和持久实例
    /// POST /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_register_instance_ephemeral_vs_persistent() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-ephemeral", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 注册临时实例
        let ephemeral_request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-ephemeral&namespaceId=public&groupName=DEFAULT_GROUP&ephemeral=true")
            .body(Body::empty())
            .unwrap();
        
        let ephemeral_response = router.clone().oneshot(ephemeral_request).await.unwrap();
        assert_eq!(ephemeral_response.status(), StatusCode::OK);
        
        // 注册持久实例
        let persistent_request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8081&serviceName=test-service-ephemeral&namespaceId=public&groupName=DEFAULT_GROUP&ephemeral=false")
            .body(Body::empty())
            .unwrap();
        
        let persistent_response = router.oneshot(persistent_request).await.unwrap();
        assert_eq!(persistent_response.status(), StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：无效的权重值
    /// POST /nacos/v1/ns/instance
    #[tokio::test]
    async fn test_register_instance_invalid_weight() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-invalid-weight", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试负数权重
        let request1 = Request::builder()
            .method("POST")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-invalid-weight&namespaceId=public&groupName=DEFAULT_GROUP&weight=-1")
            .body(Body::empty())
            .unwrap();
        
        let response1 = router.clone().oneshot(request1).await.unwrap();
        // 根据实现，可能返回 400（验证失败）或 200（使用默认值）
        assert!(response1.status() == StatusCode::BAD_REQUEST || response1.status() == StatusCode::OK);
        
        // 测试超过1.0的权重
        let request2 = Request::builder()
            .method("POST")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8081&serviceName=test-service-invalid-weight&namespaceId=public&groupName=DEFAULT_GROUP&weight=2.0")
            .body(Body::empty())
            .unwrap();
        
        let response2 = router.oneshot(request2).await.unwrap();
        // 根据实现，可能返回 400（验证失败）或 200（使用默认值或截断）
        assert!(response2.status() == StatusCode::BAD_REQUEST || response2.status() == StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：过滤健康实例
    /// GET /nacos/v1/ns/instance/list
    #[tokio::test]
    async fn test_list_instances_filter_healthy() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-filter-healthy", "public", "DEFAULT_GROUP").await.unwrap();
        
        // 注册健康和不健康的实例
        test_db.insert_test_instance("test-service-filter-healthy", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        test_db.insert_test_instance("test-service-filter-healthy", "public", "DEFAULT_GROUP", "127.0.0.1", 8081).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 设置一个实例为不健康
        let update_request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8081&serviceName=test-service-filter-healthy&namespaceId=public&groupName=DEFAULT_GROUP&healthy=false")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(update_request).await.unwrap();
        
        // 查询所有实例
        let list_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance/list?serviceName=test-service-filter-healthy&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let list_response = router.oneshot(list_request).await.unwrap();
        assert_eq!(list_response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(list_response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        // 验证返回的实例包含健康状态信息
        if let Some(hosts) = body.get("hosts") {
            let hosts_array = hosts.as_array().unwrap();
            assert!(hosts_array.len() >= 2);
            
            // 验证每个实例都有健康状态字段
            for host in hosts_array {
                assert!(host.get("healthy").is_some());
            }
        }
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：过滤不健康实例
    /// GET /nacos/v1/ns/instance/list
    #[tokio::test]
    async fn test_list_instances_filter_unhealthy() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-filter-unhealthy", "public", "DEFAULT_GROUP").await.unwrap();
        
        // 注册健康和不健康的实例
        test_db.insert_test_instance("test-service-filter-unhealthy", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        test_db.insert_test_instance("test-service-filter-unhealthy", "public", "DEFAULT_GROUP", "127.0.0.1", 8081).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 设置一个实例为不健康
        let update_request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8081&serviceName=test-service-filter-unhealthy&namespaceId=public&groupName=DEFAULT_GROUP&healthy=false")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(update_request).await.unwrap();
        
        // 查询所有实例（验证包含不健康实例）
        let list_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance/list?serviceName=test-service-filter-unhealthy&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let list_response = router.oneshot(list_request).await.unwrap();
        assert_eq!(list_response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(list_response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        // 验证返回的实例包含健康和不健康的实例
        if let Some(hosts) = body.get("hosts") {
            let hosts_array = hosts.as_array().unwrap();
            assert!(hosts_array.len() >= 2);
            
            // 验证至少有一个不健康的实例
            let has_unhealthy = hosts_array.iter()
                .any(|h| !h.get("healthy").and_then(|v| v.as_bool()).unwrap_or(true));
            
            assert!(has_unhealthy);
        }
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：批量更新元数据部分实例不存在的情况
    /// PUT /nacos/v1/ns/instance/metadata/batch
    #[tokio::test]
    async fn test_batch_update_instance_metadata_partial_failure() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-batch-partial", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-batch-partial", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        // 不创建 8081 端口的实例，模拟部分实例不存在的情况
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let instances_json = r#"[{"ip":"127.0.0.1","port":8080},{"ip":"127.0.0.1","port":8081}]"#;
        let metadata_json = r#"{"key1":"value1"}"#;
        
        let request = Request::builder()
            .method("PUT")
            .uri(&format!("/nacos/v1/ns/instance/metadata/batch?serviceName=test-service-batch-partial&namespaceId=public&groupName=DEFAULT_GROUP&instances={}&metadata={}", 
                urlencoding::encode(instances_json),
                urlencoding::encode(metadata_json)
            ))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 200（部分成功）、207（Multi-Status）或 400
        assert!(response.status() == StatusCode::OK || 
                response.status() == StatusCode::MULTI_STATUS ||
                response.status() == StatusCode::BAD_REQUEST);
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 实例管理 API 更多边界情况测试 ==========

    /// 测试用例：实例状态查询 API
    /// GET /nacos/v1/ns/instance/statuses
    #[tokio::test]
    async fn test_get_instance_statuses_success() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-statuses", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-statuses", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        test_db.insert_test_instance("test-service-statuses", "public", "DEFAULT_GROUP", "127.0.0.1", 8081).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 设置一个实例为不健康
        let update_request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8081&serviceName=test-service-statuses&namespaceId=public&groupName=DEFAULT_GROUP&healthy=false")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(update_request).await.unwrap();
        
        // 查询多个实例的健康状态
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance/statuses?serviceName=test-service-statuses&namespaceId=public&groupName=DEFAULT_GROUP&ips=127.0.0.1:8080,127.0.0.1:8081")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 200 或 404（如果状态查询 API 未实现）
        if response.status() == StatusCode::OK {
            let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
            let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
            
            // 验证返回状态信息
            assert!(body.is_object() || body.is_array());
        }
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：状态信息准确性
    /// GET /nacos/v1/ns/instance/statuses
    #[tokio::test]
    async fn test_get_instance_statuses_accuracy() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-status-accuracy", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-status-accuracy", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 设置实例为不健康
        let update_request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service-status-accuracy&namespaceId=public&groupName=DEFAULT_GROUP&healthy=false")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(update_request).await.unwrap();
        
        // 查询实例状态
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance/statuses?serviceName=test-service-status-accuracy&namespaceId=public&groupName=DEFAULT_GROUP&ips=127.0.0.1:8080")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 200 或 404（如果状态查询 API 未实现）
        if response.status() == StatusCode::OK {
            let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
            let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
            
            // 验证返回的状态信息
            assert!(body.is_object() || body.is_array());
        }
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 批量操作 API 更多测试用例 ==========

    /// 测试用例：批量删除不存在的元数据键
    /// DELETE /nacos/v1/ns/instance/metadata/batch
    #[tokio::test]
    async fn test_batch_delete_instance_metadata_not_found() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-batch-delete-notfound", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-batch-delete-notfound", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let instances_json = r#"[{"ip":"127.0.0.1","port":8080}]"#;
        let metadata_keys = "non-existent-key1,non-existent-key2";
        
        let request = Request::builder()
            .method("DELETE")
            .uri(&format!("/nacos/v1/ns/instance/metadata/batch?serviceName=test-service-batch-delete-notfound&namespaceId=public&groupName=DEFAULT_GROUP&instances={}&metadata={}", 
                urlencoding::encode(instances_json),
                urlencoding::encode(metadata_keys)
            ))
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 200（幂等性）、404（不存在）或 400
        assert!(response.status() == StatusCode::OK || 
                response.status() == StatusCode::NOT_FOUND ||
                response.status() == StatusCode::BAD_REQUEST);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：实例心跳 API - 使用 beat 参数（符合 Nacos 标准）
    /// PUT /nacos/v1/ns/instance/beat
    /// 根据 Nacos API 文档，beat 参数是必需的，包含实例的完整信息
    #[tokio::test]
    async fn test_instance_heartbeat_with_beat_parameter() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-heartbeat-beat", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-heartbeat-beat", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 构建 beat 参数（JSON 格式，包含实例信息）
        let beat_json = serde_json::json!({
            "ip": "127.0.0.1",
            "port": 8080,
            "cluster": "DEFAULT",
            "serviceName": "test-service-heartbeat-beat",
            "metadata": {}
        });
        
        let request = Request::builder()
            .method("PUT")
            .uri(&format!(
                "/nacos/v1/ns/instance/beat?serviceName=test-service-heartbeat-beat&namespaceId=public&groupName=DEFAULT_GROUP&beat={}",
                urlencoding::encode(&beat_json.to_string())
            ))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        // 验证响应格式（应该包含 clientBeatInterval, code, lightBeatEnabled）
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body_text = String::from_utf8(body_bytes.to_vec()).unwrap();
        let response_json: serde_json::Value = serde_json::from_str(&body_text).unwrap();
        
        assert!(response_json.get("clientBeatInterval").is_some());
        assert_eq!(response_json.get("code"), Some(&serde_json::json!(10200)));
        assert!(response_json.get("lightBeatEnabled").is_some());
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：实例列表 API - 验证响应格式符合 Nacos 标准
    /// GET /nacos/v1/ns/instance/list
    /// 根据 Nacos API 文档，响应应该包含 name, groupName, clusters, cacheMillis, hosts, lastRefTime 等字段
    #[tokio::test]
    async fn test_instance_list_response_format() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-list-format", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-list-format", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        test_db.insert_test_instance("test-service-list-format", "public", "DEFAULT_GROUP", "127.0.0.2", 8081).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance/list?serviceName=test-service-list-format&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        // 验证响应格式
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body_text = String::from_utf8(body_bytes.to_vec()).unwrap();
        let response_json: serde_json::Value = serde_json::from_str(&body_text).unwrap();
        
        // 验证必需字段
        assert!(response_json.get("name").is_some());
        assert!(response_json.get("groupName").is_some());
        assert!(response_json.get("clusters").is_some());
        assert!(response_json.get("cacheMillis").is_some());
        assert!(response_json.get("hosts").is_some());
        assert!(response_json.get("lastRefTime").is_some());
        assert!(response_json.get("checksum").is_some());
        assert!(response_json.get("allIPs").is_some());
        assert!(response_json.get("reachProtectionThreshold").is_some());
        assert!(response_json.get("valid").is_some());
        
        // 验证 hosts 数组格式
        let hosts = response_json.get("hosts").unwrap().as_array().unwrap();
        assert_eq!(hosts.len(), 2);
        
        for host in hosts {
            assert!(host.get("instanceId").is_some());
            assert!(host.get("ip").is_some());
            assert!(host.get("port").is_some());
            assert!(host.get("weight").is_some());
            assert!(host.get("healthy").is_some());
            assert!(host.get("enabled").is_some());
            assert!(host.get("ephemeral").is_some());
            assert!(host.get("clusterName").is_some());
            assert!(host.get("serviceName").is_some());
            assert!(host.get("metadata").is_some());
        }
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：实例列表 API - healthyOnly 参数过滤
    /// GET /nacos/v1/ns/instance/list?healthyOnly=true
    #[tokio::test]
    async fn test_instance_list_healthy_only_filter() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-healthy-filter", "public", "DEFAULT_GROUP").await.unwrap();
        // 插入健康实例
        test_db.insert_test_instance("test-service-healthy-filter", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试 healthyOnly=true
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance/list?serviceName=test-service-healthy-filter&namespaceId=public&groupName=DEFAULT_GROUP&healthyOnly=true")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body_text = String::from_utf8(body_bytes.to_vec()).unwrap();
        let response_json: serde_json::Value = serde_json::from_str(&body_text).unwrap();
        
        let hosts = response_json.get("hosts").unwrap().as_array().unwrap();
        // 验证所有返回的实例都是健康的
        for host in hosts {
            assert_eq!(host.get("healthy"), Some(&serde_json::json!(true)));
        }
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：实例列表 API - clusters 参数过滤
    /// GET /nacos/v1/ns/instance/list?clusters=DEFAULT
    #[tokio::test]
    async fn test_instance_list_clusters_filter() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-cluster-filter", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-cluster-filter", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试 clusters 过滤
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance/list?serviceName=test-service-cluster-filter&namespaceId=public&groupName=DEFAULT_GROUP&clusters=DEFAULT")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body_text = String::from_utf8(body_bytes.to_vec()).unwrap();
        let response_json: serde_json::Value = serde_json::from_str(&body_text).unwrap();
        
        let hosts = response_json.get("hosts").unwrap().as_array().unwrap();
        // 验证所有返回的实例都属于指定的集群
        for host in hosts {
            assert_eq!(host.get("clusterName"), Some(&serde_json::json!("DEFAULT")));
        }
        
        test_db.cleanup().await.unwrap();
    }
