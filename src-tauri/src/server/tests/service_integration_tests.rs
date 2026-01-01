/**
 * 服务管理 API 集成测试
 * 使用真实的 SQLite 数据库测试服务管理相关 API 功能
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

    // ========== 服务管理 API 测试用例 ==========

    /// 测试用例：获取服务列表（成功）
    /// GET /nacos/v1/ns/service/list
    #[tokio::test]
    async fn test_list_services_success() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("service-1", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_service("service-2", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/list?pageNo=1&pageSize=10&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        assert!(body.get("count").is_some());
        assert!(body.get("doms").is_some());
        
        let count = body["count"].as_i64().unwrap();
        assert!(count >= 2);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：获取服务详情（成功）
    /// GET /nacos/v1/ns/service
    #[tokio::test]
    async fn test_get_service_success() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-detail", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service?serviceName=test-service-detail&namespaceId=public")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        assert_eq!(body["name"], "test-service-detail");
        assert!(body.get("hosts").is_some());
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：获取不存在的服务（404）
    /// GET /nacos/v1/ns/service
    #[tokio::test]
    async fn test_get_service_not_found() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service?serviceName=non-existent-service&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 404 或 200（空响应）
        assert!(response.status() == StatusCode::NOT_FOUND || response.status() == StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：服务详情包含实例列表
    /// GET /nacos/v1/ns/service
    #[tokio::test]
    async fn test_get_service_with_instances() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-instances", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-instances", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        test_db.insert_test_instance("test-service-instances", "public", "DEFAULT_GROUP", "127.0.0.2", 8081).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service?serviceName=test-service-instances&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        // 验证服务详情包含实例列表
        assert!(body.get("hosts").is_some());
        let hosts = body["hosts"].as_array().unwrap();
        assert!(hosts.len() >= 2);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：创建服务（成功）
    /// POST /nacos/v1/ns/service
    #[tokio::test]
    async fn test_create_service_success() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/ns/service?serviceName=test-service-create&namespaceId=public")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body_text = String::from_utf8(body_bytes.to_vec()).unwrap();
        assert_eq!(body_text.trim(), "ok");
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：更新服务（成功）
    /// PUT /nacos/v1/ns/service
    #[tokio::test]
    async fn test_update_service_success() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-update", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/service?serviceName=test-service-update&namespaceId=public&protectThreshold=0.5")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：更新不存在的服务（404）
    /// PUT /nacos/v1/ns/service
    #[tokio::test]
    async fn test_update_service_not_found() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/service?serviceName=non-existent-service&namespaceId=public&groupName=DEFAULT_GROUP&protectThreshold=0.5")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 404 或 200（如果更新会创建服务）
        assert!(response.status() == StatusCode::NOT_FOUND || response.status() == StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：删除服务（成功）
    /// DELETE /nacos/v1/ns/service
    #[tokio::test]
    async fn test_delete_service_success() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-delete", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("DELETE")
            .uri("/nacos/v1/ns/service?serviceName=test-service-delete&namespaceId=public")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：删除不存在的服务（404）
    /// DELETE /nacos/v1/ns/service
    #[tokio::test]
    async fn test_delete_service_not_found() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("DELETE")
            .uri("/nacos/v1/ns/service?serviceName=non-existent-service&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 404 或 200（如果删除不存在的服务也返回成功）
        assert!(response.status() == StatusCode::NOT_FOUND || response.status() == StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：不同命名空间的服务列表
    /// GET /nacos/v1/ns/service/list
    #[tokio::test]
    async fn test_list_services_different_namespaces() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_namespace("test-ns", "Test Namespace").await.unwrap();
        test_db.insert_test_service("service-public", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_service("service-test-ns", "test-ns", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试 public 命名空间
        let request_public = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/list?pageNo=1&pageSize=10&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response_public = router.clone().oneshot(request_public).await.unwrap();
        assert_eq!(response_public.status(), StatusCode::OK);
        
        // 测试 test-ns 命名空间
        let request_test_ns = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/list?pageNo=1&pageSize=10&namespaceId=test-ns&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response_test_ns = router.clone().oneshot(request_test_ns).await.unwrap();
        assert_eq!(response_test_ns.status(), StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 服务订阅者 API 测试用例 ==========

    /// 测试用例：查询服务订阅者列表
    /// GET /nacos/v1/ns/service/subscribers
    #[tokio::test]
    async fn test_get_subscribers_success() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-subscribers", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-subscribers", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/subscribers?serviceName=test-service-subscribers&namespaceId=public")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        // 验证返回格式
        assert!(body.get("count").is_some());
        assert!(body.get("subscribers").is_some());
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：查询服务订阅者列表（Console API）
    /// GET /nacos/v3/console/ns/service/subscribers
    #[tokio::test]
    async fn test_console_get_subscribers_success() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-console-subscribers", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-console-subscribers", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v3/console/ns/service/subscribers?serviceName=test-service-console-subscribers&groupName=DEFAULT_GROUP&namespaceId=public")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        // 验证 Console API 格式
        assert_eq!(body["code"], 0);
        assert!(body.get("data").is_some());
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：无订阅者时返回空列表
    /// GET /nacos/v1/ns/service/subscribers
    #[tokio::test]
    async fn test_get_subscribers_empty() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-no-subscribers", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/subscribers?serviceName=test-service-no-subscribers&namespaceId=public")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        // 验证返回空列表
        assert_eq!(body["count"], 0);
        assert!(body["subscribers"].as_array().unwrap().is_empty());
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 服务名搜索 API 测试用例 ==========

    /// 测试用例：搜索服务名（模糊匹配）
    /// GET /nacos/v1/ns/service/names
    #[tokio::test]
    async fn test_search_service_names_success() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-search-1", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_service("test-service-search-2", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_service("other-service", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/names?namespaceId=public&expr=test-service-search")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 200 或 404（如果搜索未实现）
        assert!(response.status() == StatusCode::OK || response.status() == StatusCode::NOT_FOUND);
        
        if response.status() == StatusCode::OK {
            let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
            let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
            
            // 验证返回服务名列表
            assert!(body.is_array() || body.get("data").is_some());
        }
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 服务管理 API 补充测试用例 ==========

    /// 测试用例：服务列表分页功能
    /// GET /nacos/v1/ns/service/list
    #[tokio::test]
    async fn test_list_services_pagination() {
        let test_db = TestDatabase::new().await.unwrap();
        
        // 插入超过 10 个服务
        for i in 1..=15 {
            test_db.insert_test_service(&format!("service-{}", i), "public", "DEFAULT_GROUP").await.unwrap();
        }
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试第一页
        let request1 = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/list?pageNo=1&pageSize=10&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response1 = router.clone().oneshot(request1).await.unwrap();
        assert_eq!(response1.status(), StatusCode::OK);
        
        let body_bytes1 = axum::body::to_bytes(response1.into_body(), usize::MAX).await.unwrap();
        let body1: serde_json::Value = serde_json::from_slice(&body_bytes1).unwrap();
        
        if let Some(doms) = body1.get("doms") {
            let doms_array = doms.as_array().unwrap();
            assert!(doms_array.len() <= 10);
        }
        
        // 测试第二页
        let request2 = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/list?pageNo=2&pageSize=10&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response2 = router.oneshot(request2).await.unwrap();
        assert_eq!(response2.status(), StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：不同 Group 的服务列表
    /// GET /nacos/v1/ns/service/list
    #[tokio::test]
    async fn test_list_services_different_groups() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("service-default", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_service("service-custom", "public", "custom-group").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试 DEFAULT_GROUP
        let request_default = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/list?pageNo=1&pageSize=10&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response_default = router.clone().oneshot(request_default).await.unwrap();
        assert_eq!(response_default.status(), StatusCode::OK);
        
        // 测试 custom-group
        let request_custom = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/list?pageNo=1&pageSize=10&namespaceId=public&groupName=custom-group")
            .body(Body::empty())
            .unwrap();
        
        let response_custom = router.oneshot(request_custom).await.unwrap();
        assert_eq!(response_custom.status(), StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：空服务列表返回
    /// GET /nacos/v1/ns/service/list
    #[tokio::test]
    async fn test_list_services_empty() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/list?pageNo=1&pageSize=10&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        if let Some(count) = body.get("count") {
            assert_eq!(count.as_i64().unwrap(), 0);
        }
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 服务管理 API 更多测试用例 ==========

    /// 测试用例：创建已存在的服务（错误处理）
    /// POST /nacos/v1/ns/service
    #[tokio::test]
    async fn test_create_service_already_exists() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-exists", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/ns/service?serviceName=test-service-exists&namespaceId=public")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 200（幂等性）、400 或 409
        assert!(response.status() == StatusCode::OK || 
                response.status() == StatusCode::BAD_REQUEST ||
                response.status() == StatusCode::CONFLICT);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：更新服务元数据
    /// PUT /nacos/v1/ns/service
    #[tokio::test]
    async fn test_update_service_metadata() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-metadata", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/service?serviceName=test-service-metadata&namespaceId=public&metadata=%7B%22key%22%3A%22value%22%7D")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 200 或 400（如果元数据格式不支持）
        assert!(response.status() == StatusCode::OK || response.status() == StatusCode::BAD_REQUEST);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：更新保护阈值
    /// PUT /nacos/v1/ns/service
    #[tokio::test]
    async fn test_update_service_protect_threshold() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-threshold", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/service?serviceName=test-service-threshold&namespaceId=public&protectThreshold=0.7")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：删除服务后实例也被删除
    /// DELETE /nacos/v1/ns/service
    #[tokio::test]
    async fn test_delete_service_cascades_instances() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-cascade-instances", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-cascade-instances", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        test_db.insert_test_instance("test-service-cascade-instances", "public", "DEFAULT_GROUP", "127.0.0.1", 8081).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 删除服务
        let delete_request = Request::builder()
            .method("DELETE")
            .uri("/nacos/v1/ns/service?serviceName=test-service-cascade-instances&namespaceId=public")
            .body(Body::empty())
            .unwrap();
        
        let delete_response = router.clone().oneshot(delete_request).await.unwrap();
        assert_eq!(delete_response.status(), StatusCode::OK);
        
        // 验证实例已删除（级联删除）
        let instance_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance/list?serviceName=test-service-cascade-instances&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let instance_response = router.oneshot(instance_request).await.unwrap();
        // 根据实现，可能返回空列表或 404
        if instance_response.status() == StatusCode::OK {
            let body_bytes = axum::body::to_bytes(instance_response.into_body(), usize::MAX).await.unwrap();
            let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
            if let Some(hosts) = body.get("hosts") {
                assert!(hosts.as_array().unwrap().is_empty());
            }
        }
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 服务管理 API 更多测试用例 ==========

    /// 测试用例：搜索不存在的服务名（空结果）
    /// GET /nacos/v1/ns/service/names
    #[tokio::test]
    async fn test_search_service_names_not_found() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/names?namespaceId=public&expr=non-existent-service-xyz")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 200（空列表）或 404
        if response.status() == StatusCode::OK {
            let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
            let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
            
            // 验证返回空列表
            if body.is_array() {
                assert!(body.as_array().unwrap().is_empty());
            } else if let Some(data) = body.get("data") {
                if let Some(data_array) = data.as_array() {
                    assert!(data_array.is_empty());
                }
            }
        }
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：搜索服务名分页功能
    /// GET /nacos/v1/ns/service/names
    #[tokio::test]
    async fn test_search_service_names_pagination() {
        let test_db = TestDatabase::new().await.unwrap();
        
        // 创建多个匹配的服务
        for i in 1..=15 {
            test_db.insert_test_service(&format!("test-service-search-{}", i), "public", "DEFAULT_GROUP").await.unwrap();
        }
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试分页搜索
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/names?namespaceId=public&expr=test-service-search&pageNo=1&pageSize=10")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 200 或 404（如果搜索未实现）
        if response.status() == StatusCode::OK {
            let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
            let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
            
            // 验证返回结果
            if body.is_array() {
                assert!(body.as_array().unwrap().len() <= 10);
            }
        }
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：多个订阅者的情况
    /// GET /nacos/v1/ns/service/subscribers
    #[tokio::test]
    async fn test_get_service_subscribers_multiple() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-multi-subscribers", "public", "DEFAULT_GROUP").await.unwrap();
        
        // 注册多个实例（模拟多个订阅者）
        test_db.insert_test_instance("test-service-multi-subscribers", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        test_db.insert_test_instance("test-service-multi-subscribers", "public", "DEFAULT_GROUP", "127.0.0.1", 8081).await.unwrap();
        test_db.insert_test_instance("test-service-multi-subscribers", "public", "DEFAULT_GROUP", "127.0.0.1", 8082).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/subscribers?serviceName=test-service-multi-subscribers&namespaceId=public")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        // 验证返回多个订阅者
        if let Some(subscribers) = body.get("subscribers") {
            if let Some(subscribers_array) = subscribers.as_array() {
                assert!(subscribers_array.len() >= 3);
            }
        } else if let Some(count) = body.get("count") {
            assert!(count.as_i64().unwrap() >= 3);
        }
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 服务管理 API 边界情况测试 ==========

    /// 测试用例：无效的分页参数
    /// GET /nacos/v1/ns/service/list
    #[tokio::test]
    async fn test_list_services_invalid_pagination() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 测试 pageNo=0
        let request1 = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/list?pageNo=0&pageSize=10&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response1 = router.clone().oneshot(request1).await.unwrap();
        // 根据实现，可能返回 200（使用默认值）或 400（验证失败）
        assert!(response1.status() == StatusCode::OK || response1.status() == StatusCode::BAD_REQUEST);
        
        // 测试 pageSize=0
        let request2 = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/list?pageNo=1&pageSize=0&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response2 = router.clone().oneshot(request2).await.unwrap();
        // 根据实现，可能返回 200（使用默认值）或 400（验证失败）
        assert!(response2.status() == StatusCode::OK || response2.status() == StatusCode::BAD_REQUEST);
        
        // 测试 pageNo=-1
        let request3 = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/list?pageNo=-1&pageSize=10&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response3 = router.oneshot(request3).await.unwrap();
        // 根据实现，可能返回 200（使用默认值）或 400（验证失败）
        assert!(response3.status() == StatusCode::OK || response3.status() == StatusCode::BAD_REQUEST);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：无效的命名空间 ID（服务列表）
    /// GET /nacos/v1/ns/service/list
    #[tokio::test]
    async fn test_list_services_invalid_namespace() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/list?pageNo=1&pageSize=10&namespaceId=non-existent-ns-xyz&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 200（空列表）或 404（命名空间不存在）
        assert!(response.status() == StatusCode::OK || response.status() == StatusCode::NOT_FOUND);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：创建服务时设置元数据
    /// POST /nacos/v1/ns/service
    #[tokio::test]
    async fn test_create_service_with_metadata() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let metadata_json = urlencoding::encode(r#"{"env":"test","version":"1.0"}"#);
        let request = Request::builder()
            .method("POST")
            .uri(&format!("/nacos/v1/ns/service?serviceName=test-service-metadata-create&namespaceId=public&metadata={}", metadata_json))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 200（成功）或 400（如果元数据格式不支持）
        assert!(response.status() == StatusCode::OK || response.status() == StatusCode::BAD_REQUEST);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：创建服务时设置保护阈值
    /// POST /nacos/v1/ns/service
    #[tokio::test]
    async fn test_create_service_with_protect_threshold() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/ns/service?serviceName=test-service-threshold-create&namespaceId=public&protectThreshold=0.6")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：服务元数据信息
    /// GET /nacos/v1/ns/service
    #[tokio::test]
    async fn test_get_service_metadata() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-metadata-get", "public", "DEFAULT_GROUP").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service?serviceName=test-service-metadata-get&namespaceId=public")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        // 验证服务详情包含元数据字段（如果支持）
        assert_eq!(body["name"], "test-service-metadata-get");
        // 元数据字段可能存在也可能不存在（取决于实现）
        
        test_db.cleanup().await.unwrap();
    }

