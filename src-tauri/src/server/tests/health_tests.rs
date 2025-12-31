/**
 * 健康检查 API 测试
 * 
 * 注意：由于 Tauri AppHandle 在测试环境中难以创建，
 * 这些测试主要验证 API 路由和响应格式的正确性
 */

#[cfg(test)]
mod tests {
    use axum::{
        body::Body,
        http::{Request, StatusCode},
        response::Response,
    };
    use tower::ServiceExt;
    use crate::server::handlers::health;

    /// 测试配置服务健康检查
    /// GET /v1/cs/health
    #[tokio::test]
    async fn test_config_health() {
        let response = health::config_health().await;
        
        assert_eq!(response.status(), StatusCode::OK);
        
        // 验证响应体格式
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        assert_eq!(body["status"], "UP");
        assert_eq!(body["service"], "config");
    }

    /// 测试命名服务健康检查
    /// GET /v1/ns/health
    #[tokio::test]
    async fn test_naming_health() {
        let response = health::naming_health().await;
        
        assert_eq!(response.status(), StatusCode::OK);
        
        // 验证响应体格式
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
        
        assert_eq!(body["status"], "UP");
        assert_eq!(body["service"], "naming");
    }
}
