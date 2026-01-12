/**
 * 实例健康状态 API 集成测试
 * 测试 PUT /nacos/v1/ns/health/instance API
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

    /// 测试更新实例健康状态 API
    /// PUT /nacos/v1/ns/health/instance
    #[tokio::test]
    async fn test_update_instance_health_status() {
        let test_db = TestDatabase::new().await.unwrap();
        
        // 插入测试服务
        test_db.insert_test_service("test-service", "public", "DEFAULT_GROUP").await.unwrap();
        
        // 注册实例
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let register_request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service&namespaceId=public&groupName=DEFAULT_GROUP&healthy=true")
            .body(Body::empty())
            .unwrap();
        
        let _response = router.clone().oneshot(register_request).await.unwrap();
        
        // 更新实例健康状态为不健康
        let update_request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/health/instance?serviceName=test-service&ip=127.0.0.1&port=8080&healthy=false&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let update_response = router.clone().oneshot(update_request).await.unwrap();
        assert_eq!(update_response.status(), StatusCode::OK);
        
        let body = axum::body::to_bytes(update_response.into_body(), usize::MAX).await.unwrap();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert_eq!(body_str, "ok");
        
        // 验证实例健康状态已更新
        let get_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName=test-service&namespaceId=public")
            .body(Body::empty())
            .unwrap();
        
        let get_response = router.oneshot(get_request).await.unwrap();
        assert_eq!(get_response.status(), StatusCode::OK);
        
        let get_body = axum::body::to_bytes(get_response.into_body(), usize::MAX).await.unwrap();
        let get_json: serde_json::Value = serde_json::from_slice(&get_body).unwrap();
        
        assert_eq!(get_json["healthy"], false);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试更新实例健康状态 API（实例不存在）
    /// PUT /nacos/v1/ns/health/instance
    #[tokio::test]
    async fn test_update_instance_health_status_not_found() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());

        // 尝试更新不存在的实例
        let request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/health/instance?serviceName=non-existent&ip=127.0.0.1&port=8080&healthy=true&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();

        let response = router.oneshot(request).await.unwrap();
        // 实例不存在时应该返回错误
        assert!(response.status() == StatusCode::INTERNAL_SERVER_ERROR || response.status() == StatusCode::NOT_FOUND);

        test_db.cleanup().await.unwrap();
    }

    /// 测试更新实例健康状态 API（参数验证）
    /// PUT /nacos/v1/ns/health/instance
    #[tokio::test]
    async fn test_update_instance_health_status_invalid_params() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());

        // 缺少必需参数
        let request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/health/instance?serviceName=test-service&ip=127.0.0.1")
            .body(Body::empty())
            .unwrap();

        let response = router.oneshot(request).await.unwrap();
        // 缺少必需参数应该返回错误
        assert!(response.status() == StatusCode::BAD_REQUEST || response.status() == StatusCode::INTERNAL_SERVER_ERROR);

        test_db.cleanup().await.unwrap();
    }
}
