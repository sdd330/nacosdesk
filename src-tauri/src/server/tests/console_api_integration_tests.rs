/**
 * Console API 集成测试
 * 使用真实的 SQLite 数据库测试 Console API 相关功能
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

    // ========== Console API 配置监听查询测试用例 ==========

    /// 测试用例：Console API 按配置查询监听者列表
    /// GET /nacos/v3/console/cs/config/listener
    #[tokio::test]
    async fn test_console_list_listeners_by_config() {
        let test_db = TestDatabase::new().await.unwrap();
        
        // 插入测试配置
        test_db.insert_test_config("test-config-console", "DEFAULT_GROUP", "public", "test-content").await.unwrap();
        
        // 获取配置的 MD5
        let md5_hash = format!("{:x}", md5::compute("test-content"));
        
        // 插入测试订阅者（模拟客户端监听，使用不同的 IP）
        test_db.insert_test_subscriber(
            "test-config-console",
            "DEFAULT_GROUP",
            "public",
            "127.0.0.1",
            Some(8080),
            Some(&md5_hash),
        ).await.unwrap();
        
        test_db.insert_test_subscriber(
            "test-config-console",
            "DEFAULT_GROUP",
            "public",
            "127.0.0.2",
            Some(8081),
            Some(&md5_hash),
        ).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试 Console API 查询监听者
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v3/console/cs/config/listener?dataId=test-config-console&groupName=DEFAULT_GROUP&namespaceId=public")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 验证响应
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        // 验证响应格式
        assert!(body.get("listenersStatus").is_some());
        let listeners_status = body["listenersStatus"].as_object().unwrap();
        
        // 验证返回了监听者（应该包含两个不同的 IP）
        assert_eq!(listeners_status.len(), 2);
        assert!(listeners_status.contains_key("127.0.0.1"));
        assert!(listeners_status.contains_key("127.0.0.2"));
        // 验证 MD5 值
        assert_eq!(listeners_status.get("127.0.0.1").unwrap().as_str().unwrap(), &md5_hash);
        assert_eq!(listeners_status.get("127.0.0.2").unwrap().as_str().unwrap(), &md5_hash);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：Console API 按配置查询监听者（无监听者）
    /// GET /nacos/v3/console/cs/config/listener
    #[tokio::test]
    async fn test_console_list_listeners_by_config_empty() {
        let test_db = TestDatabase::new().await.unwrap();
        
        // 插入测试配置（无监听者）
        test_db.insert_test_config("test-config-console-empty", "DEFAULT_GROUP", "public", "test-content").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试 Console API 查询监听者
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v3/console/cs/config/listener?dataId=test-config-console-empty&groupName=DEFAULT_GROUP&namespaceId=public")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 验证响应
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        // 验证响应格式
        assert!(body.get("listenersStatus").is_some());
        let listeners_status = body["listenersStatus"].as_object().unwrap();
        
        // 验证返回空的监听者列表
        assert!(listeners_status.is_empty());
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：Console API 按配置查询监听者（不同命名空间隔离）
    /// GET /nacos/v3/console/cs/config/listener
    #[tokio::test]
    async fn test_console_list_listeners_by_config_different_namespace() {
        let test_db = TestDatabase::new().await.unwrap();
        
        // 创建两个命名空间
        test_db.insert_test_namespace("public", "Public Namespace").await.unwrap();
        test_db.insert_test_namespace("test-ns", "Test Namespace").await.unwrap();
        
        // 在两个命名空间创建相同 dataId 的配置
        test_db.insert_test_config("test-config-ns", "DEFAULT_GROUP", "public", "content-public").await.unwrap();
        test_db.insert_test_config("test-config-ns", "DEFAULT_GROUP", "test-ns", "content-test-ns").await.unwrap();
        
        // 获取配置的 MD5
        let md5_public = format!("{:x}", md5::compute("content-public"));
        let md5_test_ns = format!("{:x}", md5::compute("content-test-ns"));
        
        // 在不同命名空间插入订阅者
        test_db.insert_test_subscriber(
            "test-config-ns",
            "DEFAULT_GROUP",
            "public",
            "127.0.0.1",
            Some(8080),
            Some(&md5_public),
        ).await.unwrap();
        
        test_db.insert_test_subscriber(
            "test-config-ns",
            "DEFAULT_GROUP",
            "test-ns",
            "127.0.0.1",
            Some(8081),
            Some(&md5_test_ns),
        ).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 查询 public 命名空间的监听者
        let request_public = Request::builder()
            .method("GET")
            .uri("/nacos/v3/console/cs/config/listener?dataId=test-config-ns&groupName=DEFAULT_GROUP&namespaceId=public")
            .body(Body::empty())
            .unwrap();
        
        let response_public = router.clone().oneshot(request_public).await.unwrap();
        assert_eq!(response_public.status(), StatusCode::OK);
        
        let body_bytes_public = axum::body::to_bytes(response_public.into_body(), usize::MAX).await.unwrap();
        let body_public: serde_json::Value = serde_json::from_slice(&body_bytes_public).unwrap();
        let listeners_status_public = body_public["listenersStatus"].as_object().unwrap();
        
        // 验证 public 命名空间只返回自己的监听者
        assert_eq!(listeners_status_public.len(), 1);
        assert!(listeners_status_public.contains_key("127.0.0.1"));
        
        // 查询 test-ns 命名空间的监听者
        let request_test_ns = Request::builder()
            .method("GET")
            .uri("/nacos/v3/console/cs/config/listener?dataId=test-config-ns&groupName=DEFAULT_GROUP&namespaceId=test-ns")
            .body(Body::empty())
            .unwrap();
        
        let response_test_ns = router.oneshot(request_test_ns).await.unwrap();
        assert_eq!(response_test_ns.status(), StatusCode::OK);
        
        let body_bytes_test_ns = axum::body::to_bytes(response_test_ns.into_body(), usize::MAX).await.unwrap();
        let body_test_ns: serde_json::Value = serde_json::from_slice(&body_bytes_test_ns).unwrap();
        let listeners_status_test_ns = body_test_ns["listenersStatus"].as_object().unwrap();
        
        // 验证 test-ns 命名空间只返回自己的监听者
        assert_eq!(listeners_status_test_ns.len(), 1);
        assert!(listeners_status_test_ns.contains_key("127.0.0.1"));
        
        // 验证不同命名空间的监听者相互隔离
        assert_ne!(listeners_status_public.get("127.0.0.1"), listeners_status_test_ns.get("127.0.0.1"));
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：Console API 按 IP 查询监听者列表
    /// GET /nacos/v3/console/cs/config/listener/ip
    #[tokio::test]
    async fn test_console_list_listeners_by_ip() {
        let test_db = TestDatabase::new().await.unwrap();
        
        // 插入多个测试配置
        test_db.insert_test_config("test-config-ip-1", "DEFAULT_GROUP", "public", "content-1").await.unwrap();
        test_db.insert_test_config("test-config-ip-2", "DEFAULT_GROUP", "public", "content-2").await.unwrap();
        
        // 获取配置的 MD5
        let md5_1 = format!("{:x}", md5::compute("content-1"));
        let md5_2 = format!("{:x}", md5::compute("content-2"));
        
        // 使用指定 IP 插入多个订阅者
        test_db.insert_test_subscriber(
            "test-config-ip-1",
            "DEFAULT_GROUP",
            "public",
            "127.0.0.1",
            Some(8080),
            Some(&md5_1),
        ).await.unwrap();
        
        test_db.insert_test_subscriber(
            "test-config-ip-2",
            "DEFAULT_GROUP",
            "public",
            "127.0.0.1",
            Some(8080),
            Some(&md5_2),
        ).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试 Console API 按 IP 查询监听者
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v3/console/cs/config/listener/ip?ip=127.0.0.1&namespaceId=public")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 验证响应
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        // 验证响应格式
        assert!(body.get("listenersStatus").is_some());
        let listeners_status = body["listenersStatus"].as_object().unwrap();
        
        // 验证返回了监听者（格式为 dataId+group）
        assert_eq!(listeners_status.len(), 2);
        assert!(listeners_status.contains_key("test-config-ip-1+DEFAULT_GROUP"));
        assert!(listeners_status.contains_key("test-config-ip-2+DEFAULT_GROUP"));
        // 验证 MD5 值
        assert_eq!(listeners_status.get("test-config-ip-1+DEFAULT_GROUP").unwrap().as_str().unwrap(), &md5_1);
        assert_eq!(listeners_status.get("test-config-ip-2+DEFAULT_GROUP").unwrap().as_str().unwrap(), &md5_2);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：Console API 按 IP 查询监听者（无监听者）
    /// GET /nacos/v3/console/cs/config/listener/ip
    #[tokio::test]
    async fn test_console_list_listeners_by_ip_empty() {
        let test_db = TestDatabase::new().await.unwrap();
        
        // 插入测试配置（指定 IP 无监听者）
        test_db.insert_test_config("test-config-ip-empty", "DEFAULT_GROUP", "public", "content").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试 Console API 按 IP 查询监听者（使用不存在的 IP）
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v3/console/cs/config/listener/ip?ip=192.168.1.100&namespaceId=public")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 验证响应
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        // 验证响应格式
        assert!(body.get("listenersStatus").is_some());
        let listeners_status = body["listenersStatus"].as_object().unwrap();
        
        // 验证返回空的监听者列表
        assert!(listeners_status.is_empty());
        
        test_db.cleanup().await.unwrap();
    }
}

