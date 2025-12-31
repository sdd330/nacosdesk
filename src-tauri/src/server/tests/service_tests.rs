/**
 * 服务管理 API 测试
 * 
 * 注意：这些测试主要验证 API 参数解析和响应格式的正确性
 */

#[cfg(test)]
mod tests {
    use axum::extract::Query;
    use crate::server::handlers::service::{ListServicesParams, GetServiceParams};

    /// 测试服务列表查询参数解析
    #[tokio::test]
    async fn test_list_services_params_parsing() {
        let query = "pageNo=1&pageSize=10&namespaceId=public&groupName=DEFAULT_GROUP";
        let uri: http::Uri = format!("?{}", query).parse().unwrap();
        let params: Result<Query<ListServicesParams>, _> = 
            Query::try_from_uri(&uri);
        
        assert!(params.is_ok());
        let Query(params) = params.unwrap();
        assert_eq!(params.pageNo, "1");
        assert_eq!(params.pageSize, "10");
        assert_eq!(params.namespaceId, "public");
        assert_eq!(params.groupName, "DEFAULT_GROUP");
    }

    /// 测试服务详情查询参数解析
    #[tokio::test]
    async fn test_get_service_params_parsing() {
        let query = "serviceName=test-service&namespaceId=public";
        let uri: http::Uri = format!("?{}", query).parse().unwrap();
        let params: Result<Query<GetServiceParams>, _> = 
            Query::try_from_uri(&uri);
        
        assert!(params.is_ok());
        let Query(params) = params.unwrap();
        assert_eq!(params.serviceName, "test-service");
        assert_eq!(params.namespaceId, "public");
    }
}

