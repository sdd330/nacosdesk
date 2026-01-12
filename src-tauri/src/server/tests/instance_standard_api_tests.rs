/**
 * Nacos 标准 API 测试用例
 * 根据标准 Nacos API 文档编写的测试用例，确保 API 实现符合标准
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
    use urlencoding;

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
}
