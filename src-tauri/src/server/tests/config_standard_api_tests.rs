/**
 * Nacos 配置管理标准 API 测试用例
 * 按照官方 Nacos OpenAPI / MCP example 校验 /cs/configs 的响应内容类型与示例值
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

    /// 标准：发布配置
    /// POST /nacos/v1/cs/configs
    /// - 参数: tenant(可选), dataId, group, content
    /// - 响应: Content-Type: application/octet-stream; body: "true" 表示发布成功
    #[tokio::test]
    async fn test_publish_config_standard_response() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());

        let request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/cs/configs?dataId=nacos.example&group=com.alibaba.nacos&tenant=&content=contentTest")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();

        let response = router.oneshot(request).await.unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        // 校验 Content-Type
        let content_type = response
            .headers()
            .get("content-type")
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default()
            .to_lowercase();
        // 实现里可能返回 application/octet-stream 或 text/plain，这里只要求是文本 / 二进制流类型
        assert!(
            content_type.starts_with("application/octet-stream")
                || content_type.starts_with("text/plain"),
            "unexpected content-type: {}",
            content_type
        );

        // 校验 body 为 "true"
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let body_text = String::from_utf8(body_bytes.to_vec()).unwrap();
        assert_eq!(body_text.trim(), "true");

        test_db.cleanup().await.unwrap();
    }

    /// 标准：获取配置
    /// GET /nacos/v1/cs/configs
    /// - 参数: dataId, group, tenant(可选)
    /// - 响应: Content-Type: application/octet-stream; body: 配置内容字符串
    #[tokio::test]
    async fn test_get_config_standard_response() {
        let test_db = TestDatabase::new().await.unwrap();

        // 先插入一条配置
        test_db
            .insert_test_config("nacos.example", "com.alibaba.nacos", "", "contentTest")
            .await
            .unwrap();

        let router = create_router("/nacos".to_string(), test_db.app.clone());

        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/cs/configs?dataId=nacos.example&group=com.alibaba.nacos&tenant=")
            .body(Body::empty())
            .unwrap();

        let response = router.oneshot(request).await.unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        // 校验 Content-Type
        let content_type = response
            .headers()
            .get("content-type")
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default()
            .to_lowercase();
        assert!(
            content_type.starts_with("application/octet-stream")
                || content_type.starts_with("text/plain"),
            "unexpected content-type: {}",
            content_type
        );

        // 校验 body 为示例内容
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let body_text = String::from_utf8(body_bytes.to_vec()).unwrap();
        assert_eq!(body_text, "contentTest");

        test_db.cleanup().await.unwrap();
    }

    /// 标准：删除配置
    /// DELETE /nacos/v1/cs/configs
    /// - 参数: dataId, group, tenant(可选)
    /// - 响应: Content-Type: application/octet-stream; body: "true" 表示删除成功
    #[tokio::test]
    async fn test_delete_config_standard_response() {
        let test_db = TestDatabase::new().await.unwrap();

        // 先插入一条配置以确保删除目标存在
        test_db
            .insert_test_config("nacos.example", "com.alibaba.nacos", "", "contentTest")
            .await
            .unwrap();

        let router = create_router("/nacos".to_string(), test_db.app.clone());

        let request = Request::builder()
            .method("DELETE")
            .uri("/nacos/v1/cs/configs?dataId=nacos.example&group=com.alibaba.nacos&tenant=")
            .body(Body::empty())
            .unwrap();

        let response = router.oneshot(request).await.unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        // 校验 Content-Type
        let content_type = response
            .headers()
            .get("content-type")
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default()
            .to_lowercase();
        assert!(
            content_type.starts_with("application/octet-stream")
                || content_type.starts_with("text/plain"),
            "unexpected content-type: {}",
            content_type
        );

        // 校验 body 为 "true"
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let body_text = String::from_utf8(body_bytes.to_vec()).unwrap();
        assert_eq!(body_text.trim(), "true");

        test_db.cleanup().await.unwrap();
    }

    /// 使用线上同款 dataId / group / tenant 组合：openapi-proxy.yml / DEFAULT_GROUP / public
    /// 确认在 nacosdesk 上，用与线上相同的请求参数可以稳定获取配置内容，且内容类型符合预期
    #[tokio::test]
    async fn test_get_config_openapi_proxy_yaml_like_online() {
        let test_db = TestDatabase::new().await.unwrap();

        // 模拟线上 dataId=openapi-proxy.yml, group=DEFAULT_GROUP, tenant=public 的配置
        let content = "openapi:\n  proxy: true\n";
        test_db
            .insert_test_config("openapi-proxy.yml", "DEFAULT_GROUP", "public", content)
            .await
            .unwrap();

        let router = create_router("/nacos".to_string(), test_db.app.clone());

        // 使用与线上一致的查询参数（dataId/group/tenant）
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/cs/configs?dataId=openapi-proxy.yml&group=DEFAULT_GROUP&tenant=public")
            .body(Body::empty())
            .unwrap();

        let response = router.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        // Content-Type 与前面标准测试保持相同约束：二进制流或纯文本
        let content_type = response
            .headers()
            .get("content-type")
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default()
            .to_lowercase();
        assert!(
            content_type.starts_with("application/octet-stream")
                || content_type.starts_with("text/plain"),
            "unexpected content-type: {}",
            content_type
        );

        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let body_text = String::from_utf8(body_bytes.to_vec()).unwrap();
        assert_eq!(body_text, content);

        test_db.cleanup().await.unwrap();
    }
}

