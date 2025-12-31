/**
 * 配置管理 API 测试
 * 
 * 注意：这些测试主要验证 API 参数解析和响应格式的正确性
 * 完整的集成测试需要真实的数据库和 AppHandle
 */

#[cfg(test)]
mod tests {
    use axum::extract::Query;
    use crate::server::handlers::config::GetConfigParams;

    /// 测试配置查询参数解析
    #[tokio::test]
    async fn test_get_config_params_parsing() {
        // 测试基本参数
        let query = "dataId=test&group=DEFAULT_GROUP&tenant=public";
        let uri: http::Uri = format!("?{}", query).parse().unwrap();
        let params: Result<Query<GetConfigParams>, _> = 
            Query::try_from_uri(&uri);
        
        assert!(params.is_ok());
        let Query(params) = params.unwrap();
        assert_eq!(params.dataId, Some("test".to_string()));
        assert_eq!(params.group, Some("DEFAULT_GROUP".to_string()));
        assert_eq!(params.tenant, "public");
    }

    /// 测试配置查询参数默认值
    #[tokio::test]
    async fn test_get_config_params_defaults() {
        let query = "";
        let uri: http::Uri = format!("?{}", query).parse().unwrap();
        let params: Result<Query<GetConfigParams>, _> = 
            Query::try_from_uri(&uri);
        
        assert!(params.is_ok());
        let Query(params) = params.unwrap();
        assert_eq!(params.tenant, ""); // 默认空字符串（public）
    }
}

