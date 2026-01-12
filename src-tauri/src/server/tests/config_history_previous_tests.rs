/**
 * 配置历史上一版本 API 集成测试
 * 测试 GET /nacos/v1/cs/history/previous API
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

    /// 测试查询配置历史上一版本 API
    /// GET /nacos/v1/cs/history/previous
    #[tokio::test]
    async fn test_get_history_previous() {
        let test_db = TestDatabase::new().await.unwrap();
        
        // 插入测试配置
        test_db.insert_test_config("test-config", "DEFAULT_GROUP", "public", "content-v1").await.unwrap();
        
        // 更新配置创建历史记录
        let router = create_router("/nacos".to_string(), test_db.app.clone());
        
        // 第一次更新
        let update_request = Request::builder()
            .method("POST")
            .uri("/nacos/v1/cs/configs?dataId=test-config&group=DEFAULT_GROUP&tenant=public&content=content-v2")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let _response = router.clone().oneshot(update_request).await.unwrap();
        
        // 第二次更新
        let update_request2 = Request::builder()
            .method("POST")
            .uri("/nacos/v1/cs/configs?dataId=test-config&group=DEFAULT_GROUP&tenant=public&content=content-v3")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::empty())
            .unwrap();
        
        let _response2 = router.clone().oneshot(update_request2).await.unwrap();
        
        // 查询历史记录，获取最新的 nid
        let history_request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/cs/history?dataId=test-config&group=DEFAULT_GROUP&tenant=public&pageNo=1&pageSize=10")
            .body(Body::empty())
            .unwrap();
        
        let history_response = router.clone().oneshot(history_request).await.unwrap();
        assert_eq!(history_response.status(), StatusCode::OK);
        
        let history_body = axum::body::to_bytes(history_response.into_body(), usize::MAX).await.unwrap();
        let history_json: serde_json::Value = serde_json::from_slice(&history_body).unwrap();
        
        // 获取第一个历史记录的 nid（最新的）
        let page_items = history_json["pageItems"].as_array().unwrap();
        if page_items.len() >= 2 {
            let latest_nid = page_items[0]["id"].as_i64().unwrap();
            
            // 查询上一版本
            let previous_request = Request::builder()
                .method("GET")
                .uri(&format!("/nacos/v1/cs/history/previous?id={}&dataId=test-config&group=DEFAULT_GROUP&tenant=public", latest_nid))
                .body(Body::empty())
                .unwrap();
            
            let previous_response = router.oneshot(previous_request).await.unwrap();
            assert_eq!(previous_response.status(), StatusCode::OK);
            
            let previous_body = axum::body::to_bytes(previous_response.into_body(), usize::MAX).await.unwrap();
            let previous_json: serde_json::Value = serde_json::from_slice(&previous_body).unwrap();
            
            // 验证返回的上一版本信息
            assert!(previous_json.get("id").is_some());
            assert_eq!(previous_json["dataId"], "test-config");
            assert_eq!(previous_json["group"], "DEFAULT_GROUP");
            assert!(previous_json.get("content").is_some());
        }
        
        test_db.cleanup().await.unwrap();
    }

    /// 测试查询配置历史上一版本 API（不存在的情况）
    /// GET /nacos/v1/cs/history/previous
    #[tokio::test]
    async fn test_get_history_previous_not_found() {
        let test_db = TestDatabase::new().await.unwrap();
        let router = create_router("/nacos".to_string(), test_db.app.clone());

        // 查询不存在的历史版本
        let request = Request::builder()
            .method("GET")
            .uri("/nacos/v1/cs/history/previous?id=99999&dataId=non-existent&group=DEFAULT_GROUP&tenant=public")
            .body(Body::empty())
            .unwrap();

        let response = router.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::NOT_FOUND);

        test_db.cleanup().await.unwrap();
    }
}
