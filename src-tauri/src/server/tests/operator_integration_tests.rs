/**
 * 系统操作 API 集成测试
 * 测试系统开关、服务器列表、Raft leader 等 API
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

    /// 测试查询系统开关 API
    /// GET /nacos/v1/ns/operator/switches
    #[tokio::test]
    async fn test_get_switches() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());

        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/operator/switches")
            .body(Body::empty())
            .unwrap();

        let response = router.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();

        // 验证返回的开关配置
        assert!(json.get("name").is_some());
        assert_eq!(json["enableStandalone"], true);
        assert_eq!(json["distroEnabled"], false); // Standalone 模式禁用分布式
        assert_eq!(json["healthCheckEnabled"], true);

        test_db.cleanup().await.unwrap();
    }

    /// 测试修改系统开关 API
    /// PUT /nacos/v1/ns/operator/switches
    #[tokio::test]
    async fn test_update_switch() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());

        let request = Request::builder()
            .method("PUT")
            .uri("/nacos/v1/ns/operator/switches?entry=pushEnabled&value=false")
            .body(Body::empty())
            .unwrap();

        let response = router.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert_eq!(body_str, "ok");

        test_db.cleanup().await.unwrap();
    }

    /// 测试查询系统指标 API
    /// GET /nacos/v1/ns/operator/metrics
    #[tokio::test]
    async fn test_get_metrics() {
        let test_db = TestDatabase::new().await.unwrap();
        
        // 插入测试服务
        test_db.insert_test_service("test-service-1", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_service("test-service-2", "public", "DEFAULT_GROUP").await.unwrap();

        let router = create_router("/nacos".to_string(), test_db.app.clone());

        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/operator/metrics")
            .body(Body::empty())
            .unwrap();

        let response = router.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();

        // 验证返回的指标
        assert!(json.get("serviceCount").is_some());
        assert!(json.get("status").is_some());
        assert_eq!(json["status"], "UP");
        assert!(json["serviceCount"].as_i64().unwrap() >= 2);

        test_db.cleanup().await.unwrap();
    }

    /// 测试查询服务器列表 API
    /// GET /nacos/v1/ns/operator/servers
    #[tokio::test]
    async fn test_get_servers() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());

        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/operator/servers")
            .body(Body::empty())
            .unwrap();

        let response = router.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();

        // 验证返回的服务器列表
        assert!(json.get("servers").is_some());
        let servers = json["servers"].as_array().unwrap();
        assert!(servers.len() > 0);
        
        let server = &servers[0];
        assert!(server.get("ip").is_some());
        assert!(server.get("servePort").is_some());
        assert_eq!(server["alive"], true);

        test_db.cleanup().await.unwrap();
    }

    /// 测试查询服务器列表 API（仅健康节点）
    /// GET /nacos/v1/ns/operator/servers?healthy=true
    #[tokio::test]
    async fn test_get_servers_healthy_only() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());

        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/operator/servers?healthy=true")
            .body(Body::empty())
            .unwrap();

        let response = router.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();

        // 验证返回的服务器列表（应该只包含健康的节点）
        let servers = json["servers"].as_array().unwrap();
        for server in servers {
            assert_eq!(server["alive"], true);
        }

        test_db.cleanup().await.unwrap();
    }

    /// 测试查询 Raft leader API
    /// GET /nacos/v1/ns/raft/leader
    #[tokio::test]
    async fn test_get_raft_leader() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());

        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/raft/leader")
            .body(Body::empty())
            .unwrap();

        let response = router.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();

        // 验证返回的 leader 信息
        assert!(json.get("leader").is_some());
        let leader = &json["leader"];
        assert_eq!(leader["state"], "LEADER");
        assert!(leader.get("ip").is_some());
        assert!(leader.get("term").is_some());

        test_db.cleanup().await.unwrap();
    }
}
