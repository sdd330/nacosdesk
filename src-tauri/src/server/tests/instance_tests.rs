/**
 * 实例管理 API 测试
 * 
 * 注意：这些测试主要验证 API 参数解析和响应格式的正确性
 */

#[cfg(test)]
mod tests {
    use axum::extract::Query;
    use crate::server::handlers::instance::RegisterInstanceParams;

    /// 测试实例注册参数解析
    #[tokio::test]
    async fn test_register_instance_params_parsing() {
        let query = "ip=127.0.0.1&port=8080&serviceName=test-service&namespaceId=public&groupName=DEFAULT_GROUP";
        let uri: http::Uri = format!("?{}", query).parse().unwrap();
        let params: Result<Query<RegisterInstanceParams>, _> = 
            Query::try_from_uri(&uri);
        
        assert!(params.is_ok());
        let Query(params) = params.unwrap();
        assert_eq!(params.ip, "127.0.0.1");
        assert_eq!(params.port, "8080");
        assert_eq!(params.serviceName, "test-service");
        assert_eq!(params.namespaceId, "public");
        assert_eq!(params.groupName, "DEFAULT_GROUP");
    }

    /// 测试实例注册参数默认值
    #[tokio::test]
    async fn test_register_instance_params_defaults() {
        let query = "ip=127.0.0.1&port=8080&serviceName=test-service";
        let uri: http::Uri = format!("?{}", query).parse().unwrap();
        let params: Result<Query<RegisterInstanceParams>, _> = 
            Query::try_from_uri(&uri);
        
        assert!(params.is_ok());
        let Query(params) = params.unwrap();
        assert_eq!(params.namespaceId, ""); // 默认空字符串（public）
        assert_eq!(params.groupName, ""); // 默认空字符串（DEFAULT_GROUP）
    }
}

