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
}

