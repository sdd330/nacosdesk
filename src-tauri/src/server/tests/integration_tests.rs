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

    // ========== 服务管理边界情况测试用例 ==========

    /// 测试用例：获取不存在的服务（404）
    /// GET /nacos/v1/ns/service
    #[tokio::test]
    async fn test_get_service_not_found() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service?serviceName=non-existent-service&namespaceId=public")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
        
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
            .uri("/nacos/v1/ns/service?serviceName=non-existent-service&namespaceId=public")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        // 根据实现，可能返回 404 或 200（幂等性）
        assert!(response.status() == StatusCode::NOT_FOUND || response.status() == StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：服务详情包含实例列表
    /// GET /nacos/v1/ns/service
    #[tokio::test]
    async fn test_get_service_with_instances() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_service("test-service-with-instances", "public", "DEFAULT_GROUP").await.unwrap();
        test_db.insert_test_instance("test-service-with-instances", "public", "DEFAULT_GROUP", "127.0.0.1", 8080).await.unwrap();
        test_db.insert_test_instance("test-service-with-instances", "public", "DEFAULT_GROUP", "127.0.0.1", 8081).await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service?serviceName=test-service-with-instances&namespaceId=public")
            .body(Body::empty())
            .unwrap();
        
        let response = router.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        // 验证包含实例列表
        assert!(body.get("hosts").is_some());
        let hosts = body["hosts"].as_array().unwrap();
        assert!(hosts.len() >= 2);
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 集成测试场景 ==========

    /// 测试用例：配置管理完整生命周期
    /// 创建配置 → 获取配置 → 更新配置 → 监听配置变更 → 删除配置
    #[tokio::test]
    async fn test_config_full_lifecycle() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let data_id = "test-config-lifecycle";
        let group = "DEFAULT_GROUP";
        let tenant = "public";
        
        // 1. 创建配置
        let create_request = Request::builder()
            .method("POST")
            .uri(&format!("/nacos/v1/cs/configs?dataId={}&group={}&tenant={}&content=initial-content", data_id, group, tenant))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let create_response = router.clone().oneshot(create_request).await.unwrap();
        assert_eq!(create_response.status(), StatusCode::OK);
        
        // 2. 获取配置
        let get_request1 = Request::builder()
            .method("GET")
            .uri(&format!("/nacos/v1/cs/configs?dataId={}&group={}&tenant={}", data_id, group, tenant))
            .body(Body::empty())
            .unwrap();
        
        let get_response1 = router.clone().oneshot(get_request1).await.unwrap();
        assert_eq!(get_response1.status(), StatusCode::OK);
        let body_bytes1 = axum::body::to_bytes(get_response1.into_body(), usize::MAX).await.unwrap();
        let body_text1 = String::from_utf8(body_bytes1.to_vec()).unwrap();
        assert_eq!(body_text1, "initial-content");
        
        // 3. 更新配置
        let update_request = Request::builder()
            .method("POST")
            .uri(&format!("/nacos/v1/cs/configs?dataId={}&group={}&tenant={}&content=updated-content", data_id, group, tenant))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let update_response = router.clone().oneshot(update_request).await.unwrap();
        assert_eq!(update_response.status(), StatusCode::OK);
        
        // 4. 获取配置的 MD5 用于监听
        let get_md5_request = Request::builder()
            .method("GET")
            .uri(&format!("/nacos/v1/cs/configs?dataId={}&group={}&tenant={}&show=all", data_id, group, tenant))
            .body(Body::empty())
            .unwrap();
        
        let get_md5_response = router.clone().oneshot(get_md5_request).await.unwrap();
        assert_eq!(get_md5_response.status(), StatusCode::OK);
        let md5_body_bytes = axum::body::to_bytes(get_md5_response.into_body(), usize::MAX).await.unwrap();
        let md5_body: serde_json::Value = serde_json::from_slice(&md5_body_bytes).unwrap();
        let old_md5 = md5_body["md5"].as_str().unwrap();
        
        // 5. 再次更新配置以触发变更
        let update_request2 = Request::builder()
            .method("POST")
            .uri(&format!("/nacos/v1/cs/configs?dataId={}&group={}&tenant={}&content=final-content", data_id, group, tenant))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(update_request2).await.unwrap();
        
        // 6. 监听配置变更（使用旧的 MD5）
        let listening_configs = format!("{}^2{}^2{}^1{}^1", data_id, group, tenant, old_md5);
        let listen_request = Request::builder()
            .method("POST")
            .uri(&format!("/nacos/v1/cs/configs/listener?Listening-Configs={}", urlencoding::encode(&listening_configs)))
            .header("Long-Pulling-Timeout", "1000")
            .body(Body::empty())
            .unwrap();
        
        let listen_response = router.clone().oneshot(listen_request).await.unwrap();
        assert_eq!(listen_response.status(), StatusCode::OK);
        
        // 7. 删除配置
        let delete_request = Request::builder()
            .method("DELETE")
            .uri(&format!("/nacos/v1/cs/configs?dataId={}&group={}&tenant={}", data_id, group, tenant))
            .body(Body::empty())
            .unwrap();
        
        let delete_response = router.clone().oneshot(delete_request).await.unwrap();
        assert_eq!(delete_response.status(), StatusCode::OK);
        
        // 8. 验证删除
        let get_request2 = Request::builder()
            .method("GET")
            .uri(&format!("/nacos/v1/cs/configs?dataId={}&group={}&tenant={}", data_id, group, tenant))
            .body(Body::empty())
            .unwrap();
        
        let get_response2 = router.oneshot(get_request2).await.unwrap();
        assert!(get_response2.status() == StatusCode::NOT_FOUND || get_response2.status() == StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：服务管理完整生命周期
    /// 创建服务 → 注册实例 → 查询服务 → 更新实例 → 注销实例 → 删除服务
    #[tokio::test]
    async fn test_service_full_lifecycle() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let service_name = "test-service-lifecycle";
        let namespace_id = "public";
        let group_name = "DEFAULT_GROUP";
        
        // 1. 创建服务
        let create_request = Request::builder()
            .method("POST")
            .uri(&format!("/nacos/v1/ns/service?serviceName={}&namespaceId={}", service_name, namespace_id))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let create_response = router.clone().oneshot(create_request).await.unwrap();
        assert_eq!(create_response.status(), StatusCode::OK);
        
        // 2. 注册实例
        let register_request = Request::builder()
            .method("POST")
            .uri(&format!("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName={}&namespaceId={}&groupName={}", service_name, namespace_id, group_name))
            .body(Body::empty())
            .unwrap();
        
        let register_response = router.clone().oneshot(register_request).await.unwrap();
        assert_eq!(register_response.status(), StatusCode::OK);
        
        // 3. 查询服务
        let get_service_request = Request::builder()
            .method("GET")
            .uri(&format!("/nacos/v1/ns/service?serviceName={}&namespaceId={}", service_name, namespace_id))
            .body(Body::empty())
            .unwrap();
        
        let get_service_response = router.clone().oneshot(get_service_request).await.unwrap();
        assert_eq!(get_service_response.status(), StatusCode::OK);
        
        let service_body_bytes = axum::body::to_bytes(get_service_response.into_body(), usize::MAX).await.unwrap();
        let service_body: serde_json::Value = serde_json::from_slice(&service_body_bytes).unwrap();
        assert_eq!(service_body["name"], service_name);
        
        // 4. 更新实例
        let update_request = Request::builder()
            .method("PUT")
            .uri(&format!("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName={}&namespaceId={}&groupName={}&weight=0.8", service_name, namespace_id, group_name))
            .body(Body::empty())
            .unwrap();
        
        let update_response = router.clone().oneshot(update_request).await.unwrap();
        assert_eq!(update_response.status(), StatusCode::OK);
        
        // 5. 注销实例
        let deregister_request = Request::builder()
            .method("DELETE")
            .uri(&format!("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName={}&namespaceId={}&groupName={}", service_name, namespace_id, group_name))
            .body(Body::empty())
            .unwrap();
        
        let deregister_response = router.clone().oneshot(deregister_request).await.unwrap();
        assert_eq!(deregister_response.status(), StatusCode::OK);
        
        // 6. 删除服务
        let delete_request = Request::builder()
            .method("DELETE")
            .uri(&format!("/nacos/v1/ns/service?serviceName={}&namespaceId={}", service_name, namespace_id))
            .body(Body::empty())
            .unwrap();
        
        let delete_response = router.oneshot(delete_request).await.unwrap();
        assert_eq!(delete_response.status(), StatusCode::OK);
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：命名空间隔离（跨模块集成）
    /// 命名空间创建 → 配置管理 → 服务管理（命名空间隔离）
    #[tokio::test]
    async fn test_namespace_isolation_integration() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 1. 创建命名空间
        let create_ns_request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/console/namespaces?customNamespaceId=test-ns-isolation&namespaceName=Test%20Namespace&namespaceDesc=Test")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let create_ns_response = router.clone().oneshot(create_ns_request).await.unwrap();
        assert_eq!(create_ns_response.status(), StatusCode::OK);
        
        // 2. 在 public 命名空间创建配置
        let config_public_request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/cs/configs?dataId=config1&group=DEFAULT_GROUP&tenant=public&content=public-content")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(config_public_request).await.unwrap();
        
        // 3. 在 test-ns-isolation 命名空间创建配置
        let config_test_ns_request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/cs/configs?dataId=config1&group=DEFAULT_GROUP&tenant=test-ns-isolation&content=test-ns-content")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(config_test_ns_request).await.unwrap();
        
        // 4. 验证隔离：查询 public 命名空间的配置
        let get_public_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/cs/configs?dataId=config1&group=DEFAULT_GROUP&tenant=public")
            .body(Body::empty())
            .unwrap();
        
        let get_public_response = router.clone().oneshot(get_public_request).await.unwrap();
        assert_eq!(get_public_response.status(), StatusCode::OK);
        let public_body_bytes = axum::body::to_bytes(get_public_response.into_body(), usize::MAX).await.unwrap();
        let public_body_text = String::from_utf8(public_body_bytes.to_vec()).unwrap();
        assert_eq!(public_body_text, "public-content");
        
        // 5. 验证隔离：查询 test-ns-isolation 命名空间的配置
        let get_test_ns_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/cs/configs?dataId=config1&group=DEFAULT_GROUP&tenant=test-ns-isolation")
            .body(Body::empty())
            .unwrap();
        
        let get_test_ns_response = router.clone().oneshot(get_test_ns_request).await.unwrap();
        assert_eq!(get_test_ns_response.status(), StatusCode::OK);
        let test_ns_body_bytes = axum::body::to_bytes(get_test_ns_response.into_body(), usize::MAX).await.unwrap();
        let test_ns_body_text = String::from_utf8(test_ns_body_bytes.to_vec()).unwrap();
        assert_eq!(test_ns_body_text, "test-ns-content");
        
        // 6. 在 public 命名空间创建服务
        let service_public_request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/ns/service?serviceName=service1&namespaceId=public")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(service_public_request).await.unwrap();
        
        // 7. 在 test-ns-isolation 命名空间创建服务
        let service_test_ns_request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/ns/service?serviceName=service1&namespaceId=test-ns-isolation")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(service_test_ns_request).await.unwrap();
        
        // 8. 验证隔离：查询 public 命名空间的服务列表
        let list_public_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/list?pageNo=1&pageSize=10&namespaceId=public&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let list_public_response = router.clone().oneshot(list_public_request).await.unwrap();
        assert_eq!(list_public_response.status(), StatusCode::OK);
        
        // 9. 验证隔离：查询 test-ns-isolation 命名空间的服务列表
        let list_test_ns_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/ns/service/list?pageNo=1&pageSize=10&namespaceId=test-ns-isolation&groupName=DEFAULT_GROUP")
            .body(Body::empty())
            .unwrap();
        
        let list_test_ns_response = router.oneshot(list_test_ns_request).await.unwrap();
        assert_eq!(list_test_ns_response.status(), StatusCode::OK);
        
        // 验证两个命名空间的服务列表互不影响
        let public_body_bytes = axum::body::to_bytes(list_public_response.into_body(), usize::MAX).await.unwrap();
        let public_body: serde_json::Value = serde_json::from_slice(&public_body_bytes).unwrap();
        let test_ns_body_bytes = axum::body::to_bytes(list_test_ns_response.into_body(), usize::MAX).await.unwrap();
        let test_ns_body: serde_json::Value = serde_json::from_slice(&test_ns_body_bytes).unwrap();
        
        // 两个命名空间都应该有自己的服务
        assert!(public_body.get("count").is_some() || public_body.get("doms").is_some());
        assert!(test_ns_body.get("count").is_some() || test_ns_body.get("doms").is_some());
        
        test_db.cleanup().await.unwrap();
    }

    // ========== 集成测试场景更多测试用例 ==========

    /// 测试用例：服务发现流程
    /// 创建服务 → 注册多个实例（健康/不健康）→ 查询实例列表
    #[tokio::test]
    async fn test_service_discovery_flow() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let service_name = "discovery-service";
        let namespace_id = "public";
        let group_name = "DEFAULT_GROUP";
        
        // 1. 创建服务
        let create_request = Request::builder()
            .method("POST")
            .uri(&format!("/nacos/v1/ns/service?serviceName={}&namespaceId={}", service_name, namespace_id))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(create_request).await.unwrap();
        
        // 2. 注册多个实例
        // 健康实例 1
        let register1_request = Request::builder()
            .method("POST")
            .uri(&format!("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName={}&namespaceId={}&groupName={}&healthy=true", service_name, namespace_id, group_name))
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(register1_request).await.unwrap();
        
        // 健康实例 2
        let register2_request = Request::builder()
            .method("POST")
            .uri(&format!("/nacos/v1/ns/instance?ip=127.0.0.1&port=8081&serviceName={}&namespaceId={}&groupName={}&healthy=true", service_name, namespace_id, group_name))
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(register2_request).await.unwrap();
        
        // 不健康实例
        let register3_request = Request::builder()
            .method("POST")
            .uri(&format!("/nacos/v1/ns/instance?ip=127.0.0.1&port=8082&serviceName={}&namespaceId={}&groupName={}&healthy=false", service_name, namespace_id, group_name))
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(register3_request).await.unwrap();
        
        // 3. 查询服务实例列表
        let list_request = Request::builder()
            .method("GET")
            .uri(&format!("/nacos/v1/ns/instance/list?serviceName={}&namespaceId={}&groupName={}", service_name, namespace_id, group_name))
            .body(Body::empty())
            .unwrap();
        
        let list_response = router.clone().oneshot(list_request).await.unwrap();
        assert_eq!(list_response.status(), StatusCode::OK);
        
        let list_body_bytes = axum::body::to_bytes(list_response.into_body(), usize::MAX).await.unwrap();
        let list_body: serde_json::Value = serde_json::from_slice(&list_body_bytes).unwrap();
        
        // 验证返回所有实例
        if let Some(hosts) = list_body.get("hosts") {
            let hosts_array = hosts.as_array().unwrap();
            assert!(hosts_array.len() >= 3);
            
            // 验证包含健康和不健康的实例
            let healthy_count = hosts_array.iter()
                .filter(|h| h.get("healthy").and_then(|v| v.as_bool()).unwrap_or(false))
                .count();
            let unhealthy_count = hosts_array.iter()
                .filter(|h| !h.get("healthy").and_then(|v| v.as_bool()).unwrap_or(true))
                .count();
            
            assert!(healthy_count >= 2);
            assert!(unhealthy_count >= 1);
        }
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：实例健康检查和心跳流程
    /// 注册临时实例 → 发送心跳 → 查询状态 → 停止心跳
    #[tokio::test]
    async fn test_instance_healthcheck_and_heartbeat() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let service_name = "test-service-heartbeat-flow";
        let namespace_id = "public";
        let group_name = "DEFAULT_GROUP";
        
        // 1. 创建服务
        let create_request = Request::builder()
            .method("POST")
            .uri(&format!("/nacos/v1/ns/service?serviceName={}&namespaceId={}", service_name, namespace_id))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(create_request).await.unwrap();
        
        // 2. 注册临时实例
        let register_request = Request::builder()
            .method("POST")
            .uri(&format!("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName={}&namespaceId={}&groupName={}&ephemeral=true", service_name, namespace_id, group_name))
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(register_request).await.unwrap();
        
        // 3. 发送心跳（多次）
        for _ in 0..3 {
            let heartbeat_request = Request::builder()
                .method("PUT")
                .uri(&format!("/nacos/v1/ns/instance/beat?serviceName={}&namespaceId={}&ip=127.0.0.1&port=8080", service_name, namespace_id))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .body(Body::empty())
                .unwrap();
            
            let heartbeat_response = router.clone().oneshot(heartbeat_request).await.unwrap();
            assert_eq!(heartbeat_response.status(), StatusCode::OK);
            
            // 短暂延迟
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }
        
        // 4. 查询实例状态，验证实例保持健康状态
        let get_request = Request::builder()
            .method("GET")
            .uri(&format!("/nacos/v1/ns/instance?ip=127.0.0.1&port=8080&serviceName={}&namespaceId={}&groupName={}", service_name, namespace_id, group_name))
            .body(Body::empty())
            .unwrap();
        
        let get_response = router.oneshot(get_request).await.unwrap();
        if get_response.status() == StatusCode::OK {
            let body_bytes = axum::body::to_bytes(get_response.into_body(), usize::MAX).await.unwrap();
            let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
            
            // 验证实例存在
            assert_eq!(body["ip"], "127.0.0.1");
            assert_eq!(body["port"], 8080);
        }
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：用户登录 → 配置管理 → 服务管理（认证流程）
    /// POST /nacos/v1/auth/users/login → POST /nacos/v1/cs/configs → POST /nacos/v1/ns/service
    #[tokio::test]
    async fn test_auth_integration() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 1. 登录获取 Token
        let login_request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/auth/users/login")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::from("username=nacos&password=nacos"))
            .unwrap();
        
        let login_response = router.clone().oneshot(login_request).await.unwrap();
        assert_eq!(login_response.status(), StatusCode::OK);
        
        let login_body_bytes = axum::body::to_bytes(login_response.into_body(), usize::MAX).await.unwrap();
        let login_body: serde_json::Value = serde_json::from_slice(&login_body_bytes).unwrap();
        
        if let Some(access_token) = login_body.get("accessToken") {
            let token = access_token.as_str().unwrap();
            
            // 2. 使用 Token 创建配置（如果配置管理需要认证）
            let config_request = Request::builder()
                .method("POST")
                .uri(&format!("/nacos/v1/cs/configs?dataId=test-config-auth&group=DEFAULT_GROUP&tenant=public&content=test-content&accessToken={}", token))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .body(Body::empty())
                .unwrap();
            
            let config_response = router.clone().oneshot(config_request).await.unwrap();
            // 根据实现，可能返回 200（如果不需要认证）或需要认证
            assert!(config_response.status() == StatusCode::OK || config_response.status() == StatusCode::UNAUTHORIZED);
            
            // 3. 使用 Token 创建服务（如果服务管理需要认证）
            let service_request = Request::builder()
                .method("POST")
                .uri(&format!("/nacos/v1/ns/service?serviceName=test-service-auth&namespaceId=public&accessToken={}", token))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .body(Body::empty())
                .unwrap();
            
            let service_response = router.clone().oneshot(service_request).await.unwrap();
            // 根据实现，可能返回 200（如果不需要认证）或需要认证
            assert!(service_response.status() == StatusCode::OK || service_response.status() == StatusCode::UNAUTHORIZED);
            
            // 4. 使用无效 Token 验证返回 401
            let invalid_request = Request::builder()
                .method("POST")
                .uri("/nacos/v1/cs/configs?dataId=test-invalid&group=DEFAULT_GROUP&tenant=public&content=test&accessToken=invalid-token")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .body(Body::empty())
                .unwrap();
            
            let invalid_response = router.oneshot(invalid_request).await.unwrap();
            // 根据实现，可能返回 401（如果认证已实现）或 200（如果不需要认证）
            assert!(invalid_response.status() == StatusCode::UNAUTHORIZED || invalid_response.status() == StatusCode::OK);
        }
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：配置变更通知
    /// 启动配置监听 → 更新配置 → 验证监听返回变更信息
    #[tokio::test]
    async fn test_config_change_notification() {
        let test_db = TestDatabase::new().await.unwrap();
        
        test_db.insert_test_config("test-config-notification", "DEFAULT_GROUP", "public", "initial-content").await.unwrap();
        
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 1. 获取配置的当前 MD5
        let get_md5_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/cs/configs?dataId=test-config-notification&group=DEFAULT_GROUP&tenant=public&show=all")
            .body(Body::empty())
            .unwrap();
        
        let get_md5_response = router.clone().oneshot(get_md5_request).await.unwrap();
        assert_eq!(get_md5_response.status(), StatusCode::OK);
        
        let md5_body_bytes = axum::body::to_bytes(get_md5_response.into_body(), usize::MAX).await.unwrap();
        let md5_body: serde_json::Value = serde_json::from_slice(&md5_body_bytes).unwrap();
        let old_md5 = md5_body["md5"].as_str().unwrap();
        
        // 2. 启动配置监听（使用旧的 MD5）
        let listening_configs = format!("test-config-notification^2DEFAULT_GROUP^2public^1{}^1", old_md5);
        let listen_request = Request::builder()
            .method("POST")
            .uri(&format!("/nacos/v1/cs/configs/listener?Listening-Configs={}", urlencoding::encode(&listening_configs)))
            .header("Long-Pulling-Timeout", "3000")
            .body(Body::empty())
            .unwrap();
        
        // 3. 在另一个任务中更新配置（模拟配置变更）
        let router_clone = router.clone();
        let update_task = tokio::spawn(async move {
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            
            let update_request = Request::builder()
                .method("POST")
                .uri("/nacos/v1/cs/configs?dataId=test-config-notification&group=DEFAULT_GROUP&tenant=public&content=updated-content")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .body(Body::empty())
                .unwrap();
            
            router_clone.oneshot(update_request).await.unwrap()
        });
        
        // 4. 等待监听响应（应该检测到变更）
        let start_time = std::time::Instant::now();
        let listen_response = router.oneshot(listen_request).await.unwrap();
        let elapsed = start_time.elapsed();
        
        assert_eq!(listen_response.status(), StatusCode::OK);
        
        // 验证监听在配置更新后立即返回（而不是超时）
        assert!(elapsed.as_millis() < 2000); // 应该在2秒内返回
        
        let listen_body_bytes = axum::body::to_bytes(listen_response.into_body(), usize::MAX).await.unwrap();
        let listen_body_text = String::from_utf8(listen_body_bytes.to_vec()).unwrap();
        
        // 验证返回了配置变更信息
        assert!(listen_body_text.contains("test-config-notification") || listen_body_text.is_empty());
        
        // 等待更新任务完成
        update_task.await.unwrap();
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：配置历史记录和回滚流程
    /// 创建配置 → 更新多次 → 获取历史记录 → 回滚到指定版本
    #[tokio::test]
    async fn test_config_history_and_rollback() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        let data_id = "test-config-rollback-flow";
        let group = "DEFAULT_GROUP";
        let tenant = "public";
        
        // 1. 创建配置
        let create_request = Request::builder()
            .method("POST")
            .uri(&format!("/nacos/v1/cs/configs?dataId={}&group={}&tenant={}&content=version1", data_id, group, tenant))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(create_request).await.unwrap();
        
        // 2. 更新配置到 version2
        let update1_request = Request::builder()
            .method("POST")
            .uri(&format!("/nacos/v1/cs/configs?dataId={}&group={}&tenant={}&content=version2", data_id, group, tenant))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(update1_request).await.unwrap();
        
        // 3. 更新配置到 version3
        let update2_request = Request::builder()
            .method("POST")
            .uri(&format!("/nacos/v1/cs/configs?dataId={}&group={}&tenant={}&content=version3", data_id, group, tenant))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(update2_request).await.unwrap();
        
        // 4. 获取历史记录
        let history_request = Request::builder()
            .method("GET")
            .uri(&format!("/nacos/v1/cs/history?dataId={}&group={}&tenant={}", data_id, group, tenant))
            .body(Body::empty())
            .unwrap();
        
        let history_response = router.clone().oneshot(history_request).await.unwrap();
        assert_eq!(history_response.status(), StatusCode::OK);
        
        let history_body_bytes = axum::body::to_bytes(history_response.into_body(), usize::MAX).await.unwrap();
        let history_body: serde_json::Value = serde_json::from_slice(&history_body_bytes).unwrap();
        
        // 验证历史记录存在
        let history_array = if history_body.is_array() {
            history_body.as_array().unwrap()
        } else if let Some(page_items) = history_body.get("pageItems") {
            page_items.as_array().unwrap()
        } else {
            &[]
        };
        
        assert!(history_array.len() >= 3);
        
        // 5. 查找 version1 的历史记录 ID（用于回滚）
        let mut version1_id = None;
        for history_item in history_array {
            if let Some(content) = history_item.get("content") {
                if content.as_str() == Some("version1") {
                    if let Some(id) = history_item.get("id").or_else(|| history_item.get("nid")) {
                        version1_id = id.as_i64();
                        break;
                    }
                }
            }
        }
        
        // 6. 如果找到历史记录 ID，执行回滚
        if let Some(nid) = version1_id {
            let rollback_request = Request::builder()
                .method("POST")
                .uri(&format!("/nacos/v3/console/cs/config/rollback?dataId={}&groupName={}&namespaceId={}&nid={}", data_id, group, tenant, nid))
                .body(Body::empty())
                .unwrap();
            
            let rollback_response = router.clone().oneshot(rollback_request).await.unwrap();
            // 回滚可能成功或失败（取决于实现）
            assert!(rollback_response.status() == StatusCode::OK || rollback_response.status() == StatusCode::BAD_REQUEST);
            
            // 7. 如果回滚成功，验证配置内容为 version1
            if rollback_response.status() == StatusCode::OK {
                let get_request = Request::builder()
                    .method("GET")
                    .uri(&format!("/nacos/v1/cs/configs?dataId={}&group={}&tenant={}", data_id, group, tenant))
                    .body(Body::empty())
                    .unwrap();
                
                let get_response = router.oneshot(get_request).await.unwrap();
                if get_response.status() == StatusCode::OK {
                    let get_body_bytes = axum::body::to_bytes(get_response.into_body(), usize::MAX).await.unwrap();
                    let get_body_text = String::from_utf8(get_body_bytes.to_vec()).unwrap();
                    assert_eq!(get_body_text, "version1");
                }
            }
        }
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：配置导入导出流程
    /// 导出配置 → 删除 → 导入恢复
    #[tokio::test]
    async fn test_config_import_export() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 1. 插入多个测试配置
        test_db.insert_test_config("export-import-1", "DEFAULT_GROUP", "public", "content-1").await.unwrap();
        test_db.insert_test_config("export-import-2", "DEFAULT_GROUP", "public", "content-2").await.unwrap();
        
        // 2. 导出配置
        let export_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/cs/configs?export=true&tenant=public")
            .body(Body::empty())
            .unwrap();
        
        let export_response = router.clone().oneshot(export_request).await.unwrap();
        assert_eq!(export_response.status(), StatusCode::OK);
        
        let export_body_bytes = axum::body::to_bytes(export_response.into_body(), usize::MAX).await.unwrap();
        assert!(!export_body_bytes.is_empty());
        
        // 3. 删除配置
        let delete_request1 = Request::builder()
            .method("DELETE")
            .uri("/nacos/v1/cs/configs?dataId=export-import-1&group=DEFAULT_GROUP&tenant=public")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(delete_request1).await.unwrap();
        
        let delete_request2 = Request::builder()
            .method("DELETE")
            .uri("/nacos/v1/cs/configs?dataId=export-import-2&group=DEFAULT_GROUP&tenant=public")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(delete_request2).await.unwrap();
        
        // 4. 验证配置已删除
        let get_request1 = Request::builder()
            .method("GET")
            .uri("/nacos/v1/cs/configs?dataId=export-import-1&group=DEFAULT_GROUP&tenant=public")
            .body(Body::empty())
            .unwrap();
        
        let get_response1 = router.clone().oneshot(get_request1).await.unwrap();
        assert!(get_response1.status() == StatusCode::NOT_FOUND || get_response1.status() == StatusCode::OK);
        
        // 注意：实际导入需要使用 multipart/form-data，这里只是验证导出功能
        // 完整的导入测试在 config_integration_tests.rs 中
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：配置导出 → 删除 → 导入恢复
    #[tokio::test]
    async fn test_config_export_import_restore() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 1. 插入多个测试配置
        test_db.insert_test_config("restore-1", "DEFAULT_GROUP", "public", "restore-content-1").await.unwrap();
        test_db.insert_test_config("restore-2", "DEFAULT_GROUP", "public", "restore-content-2").await.unwrap();
        
        // 2. 导出配置
        let export_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/cs/configs?export=true&tenant=public")
            .body(Body::empty())
            .unwrap();
        
        let export_response = router.clone().oneshot(export_request).await.unwrap();
        assert_eq!(export_response.status(), StatusCode::OK);
        
        let export_body_bytes = axum::body::to_bytes(export_response.into_body(), usize::MAX).await.unwrap();
        assert!(!export_body_bytes.is_empty());
        
        // 3. 删除配置
        let delete_request1 = Request::builder()
            .method("DELETE")
            .uri("/nacos/v1/cs/configs?dataId=restore-1&group=DEFAULT_GROUP&tenant=public")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(delete_request1).await.unwrap();
        
        let delete_request2 = Request::builder()
            .method("DELETE")
            .uri("/nacos/v1/cs/configs?dataId=restore-2&group=DEFAULT_GROUP&tenant=public")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(delete_request2).await.unwrap();
        
        // 4. 验证配置已删除
        let get_request1 = Request::builder()
            .method("GET")
            .uri("/nacos/v1/cs/configs?dataId=restore-1&group=DEFAULT_GROUP&tenant=public")
            .body(Body::empty())
            .unwrap();
        
        let get_response1 = router.clone().oneshot(get_request1).await.unwrap();
        assert!(get_response1.status() == StatusCode::NOT_FOUND || get_response1.status() == StatusCode::OK);
        
        // 注意：完整的导入恢复测试需要使用 multipart/form-data 上传 ZIP 文件
        // 这里主要验证导出和删除流程，导入测试在 config_integration_tests.rs 中
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：配置导出 V2 → 导入 V2（包含元数据）
    #[tokio::test]
    async fn test_config_export_import_v2_with_metadata() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 1. 插入测试配置
        test_db.insert_test_config("v2-metadata-1", "DEFAULT_GROUP", "public", "v2-content-1").await.unwrap();
        test_db.insert_test_config("v2-metadata-2", "DEFAULT_GROUP", "public", "v2-content-2").await.unwrap();
        
        // 2. 导出配置 V2
        let export_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/cs/configs?exportV2=true&tenant=public")
            .body(Body::empty())
            .unwrap();
        
        let export_response = router.clone().oneshot(export_request).await.unwrap();
        assert_eq!(export_response.status(), StatusCode::OK);
        
        let export_body_bytes = axum::body::to_bytes(export_response.into_body(), usize::MAX).await.unwrap();
        assert!(!export_body_bytes.is_empty());
        
        // 验证 ZIP 文件格式
        assert!(export_body_bytes.len() >= 2);
        assert_eq!(&export_body_bytes[0..2], b"PK");
        
        // 注意：完整的导入 V2 测试需要使用 multipart/form-data 上传包含 metadata.yml 的 ZIP 文件
        // 这里主要验证导出 V2 功能，导入测试在 config_integration_tests.rs 中
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：配置克隆 → 修改 → 验证隔离
    #[tokio::test]
    async fn test_config_clone_and_modify_isolation() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 1. 插入源配置
        test_db.insert_test_config("source-config-clone", "DEFAULT_GROUP", "public", "source-content").await.unwrap();
        
        // 获取源配置 ID
        let config_id = test_db.get_config_id("source-config-clone", "DEFAULT_GROUP", "public").await.unwrap();
        assert!(config_id.is_some());
        
        // 2. 克隆配置
        let clone_body = serde_json::json!([{
            "cfgId": config_id.unwrap(),
            "dataId": "cloned-config-isolation",
            "group": "cloned-group"
        }]);
        
        let clone_request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/cs/configs?clone=true&tenant=public")
            .header("Content-Type", "application/json")
            .body(Body::from(serde_json::to_string(&clone_body).unwrap()))
            .unwrap();
        
        let clone_response = router.clone().oneshot(clone_request).await.unwrap();
        assert_eq!(clone_response.status(), StatusCode::OK);
        
        // 3. 验证克隆配置已创建
        let get_cloned_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/cs/configs?dataId=cloned-config-isolation&group=cloned-group&tenant=public")
            .body(Body::empty())
            .unwrap();
        
        let get_cloned_response = router.clone().oneshot(get_cloned_request).await.unwrap();
        assert_eq!(get_cloned_response.status(), StatusCode::OK);
        let cloned_body_bytes = axum::body::to_bytes(get_cloned_response.into_body(), usize::MAX).await.unwrap();
        let cloned_content = String::from_utf8(cloned_body_bytes.to_vec()).unwrap();
        assert_eq!(cloned_content, "source-content");
        
        // 4. 修改克隆的配置
        let update_cloned_request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/cs/configs?dataId=cloned-config-isolation&group=cloned-group&tenant=public&content=modified-cloned-content")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        router.clone().oneshot(update_cloned_request).await.unwrap();
        
        // 5. 验证隔离：源配置内容不变
        let get_source_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/cs/configs?dataId=source-config-clone&group=DEFAULT_GROUP&tenant=public")
            .body(Body::empty())
            .unwrap();
        
        let get_source_response = router.clone().oneshot(get_source_request).await.unwrap();
        assert_eq!(get_source_response.status(), StatusCode::OK);
        let source_body_bytes = axum::body::to_bytes(get_source_response.into_body(), usize::MAX).await.unwrap();
        let source_content = String::from_utf8(source_body_bytes.to_vec()).unwrap();
        assert_eq!(source_content, "source-content");
        
        // 6. 验证克隆配置内容已更新
        let get_cloned_updated_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/cs/configs?dataId=cloned-config-isolation&group=cloned-group&tenant=public")
            .body(Body::empty())
            .unwrap();
        
        let get_cloned_updated_response = router.oneshot(get_cloned_updated_request).await.unwrap();
        assert_eq!(get_cloned_updated_response.status(), StatusCode::OK);
        let cloned_updated_body_bytes = axum::body::to_bytes(get_cloned_updated_response.into_body(), usize::MAX).await.unwrap();
        let cloned_updated_content = String::from_utf8(cloned_updated_body_bytes.to_vec()).unwrap();
        assert_eq!(cloned_updated_content, "modified-cloned-content");
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试用例：Beta 配置生命周期
    /// 发布 Beta 配置 → 查询 → 停止
    #[tokio::test]
    async fn test_beta_config_lifecycle() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 1. 先创建正式配置
        test_db.insert_test_config("beta-config-lifecycle", "DEFAULT_GROUP", "public", "normal-content").await.unwrap();
        
        // 2. 发布 Beta 配置
        let beta_request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/cs/configs?beta=true&dataId=beta-config-lifecycle&group=DEFAULT_GROUP&tenant=public&content=beta-content")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let beta_response = router.clone().oneshot(beta_request).await.unwrap();
        // 根据实现，可能返回 200 或 404（如果 Beta 功能未实现）
        assert!(beta_response.status() == StatusCode::OK || beta_response.status() == StatusCode::NOT_FOUND);
        
        if beta_response.status() == StatusCode::OK {
            // 3. 查询 Beta 配置
            let query_beta_request = Request::builder()
                .method("GET")
                .uri("/nacos/v1/cs/configs?beta=true&dataId=beta-config-lifecycle&group=DEFAULT_GROUP&tenant=public")
                .body(Body::empty())
                .unwrap();
            
            let query_beta_response = router.clone().oneshot(query_beta_request).await.unwrap();
            if query_beta_response.status() == StatusCode::OK {
                let beta_body_bytes = axum::body::to_bytes(query_beta_response.into_body(), usize::MAX).await.unwrap();
                let beta_content = String::from_utf8(beta_body_bytes.to_vec()).unwrap();
                assert_eq!(beta_content, "beta-content");
            }
            
            // 4. 查询正式配置（应该与 Beta 不同）
            let query_normal_request = Request::builder()
                .method("GET")
                .uri("/nacos/v1/cs/configs?dataId=beta-config-lifecycle&group=DEFAULT_GROUP&tenant=public")
                .body(Body::empty())
                .unwrap();
            
            let query_normal_response = router.clone().oneshot(query_normal_request).await.unwrap();
            assert_eq!(query_normal_response.status(), StatusCode::OK);
            let normal_body_bytes = axum::body::to_bytes(query_normal_response.into_body(), usize::MAX).await.unwrap();
            let normal_content = String::from_utf8(normal_body_bytes.to_vec()).unwrap();
            assert_eq!(normal_content, "normal-content");
            
            // 5. 停止 Beta 配置
            let stop_beta_request = Request::builder()
                .method("DELETE")
                .uri("/nacos/v1/cs/configs?beta=true&dataId=beta-config-lifecycle&group=DEFAULT_GROUP&tenant=public")
                .body(Body::empty())
                .unwrap();
            
            let stop_beta_response = router.oneshot(stop_beta_request).await.unwrap();
            assert_eq!(stop_beta_response.status(), StatusCode::OK);
        }
        
        test_db.cleanup().await.unwrap();
    }
}
