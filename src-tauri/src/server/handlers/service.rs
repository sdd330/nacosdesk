/**
 * 服务管理处理器
 * 实现服务管理相关 API
 */

use axum::{
    extract::{Query, State},
    response::{IntoResponse, Response},
    Json,
};
use axum_extra::extract::Form;
use serde::Deserialize;
use std::sync::Arc;
use tauri::AppHandle;

use crate::service::{
    get_service_list as get_service_list_impl,
    get_service_detail as get_service_detail_impl,
    create_service as create_service_impl,
    update_service as update_service_impl,
    delete_service as delete_service_impl,
    get_service_instances as get_service_instances_impl,
    ServiceQueryParams, CreateServiceRequest, UpdateServiceRequest,
};

/// 查询服务列表参数（Nacos API 格式）
#[derive(Debug, Deserialize)]
pub struct ListServicesParams {
    pub pageNo: String,
    pub pageSize: String,
    #[serde(default)]
    pub namespaceId: String, // 命名空间，默认 "public"
    #[serde(default)]
    pub groupName: String, // 服务组，默认 "DEFAULT_GROUP"
    #[serde(default)]
    pub selector: Option<String>, // 选择器 JSON
}

/// 查询服务详情参数
#[derive(Debug, Deserialize)]
pub struct GetServiceParams {
    pub serviceName: String,
    #[serde(default)]
    pub namespaceId: String,
}

/// 创建服务请求（Nacos API 格式）
#[derive(Debug, Deserialize)]
pub struct CreateServiceForm {
    pub serviceName: String,
    #[serde(default)]
    pub namespaceId: String,
    #[serde(default)]
    pub protectThreshold: Option<String>, // 保护阈值，默认 0.0
    #[serde(default)]
    pub metadata: Option<String>, // 元数据 JSON
    #[serde(default)]
    pub selector: Option<String>, // 选择器 JSON
}

/// 更新服务请求（Nacos API 格式）
#[derive(Debug, Deserialize)]
pub struct UpdateServiceForm {
    pub serviceName: String,
    #[serde(default)]
    pub namespaceId: String,
    pub protectThreshold: String, // 必需参数
    #[serde(default)]
    pub metadata: Option<String>,
    #[serde(default)]
    pub selector: Option<String>,
}

/// 删除服务参数
#[derive(Debug, Deserialize)]
pub struct DeleteServiceParams {
    pub serviceName: String,
    #[serde(default)]
    pub namespaceId: String,
}

/// 搜索服务名称参数
#[derive(Debug, Deserialize)]
pub struct SearchServiceNamesParams {
    #[serde(default)]
    pub namespaceId: String,
    #[serde(default)]
    pub expr: Option<String>, // 搜索表达式
}

/// 查询服务订阅者参数
#[derive(Debug, Deserialize)]
pub struct GetSubscribersParams {
    pub serviceName: String,
    #[serde(default)]
    pub namespaceId: String,
    #[serde(default)]
    pub groupName: Option<String>, // Console API 使用 groupName
    #[serde(default)]
    pub pageNo: Option<String>,
    #[serde(default)]
    pub pageSize: Option<String>,
    #[serde(default)]
    pub aggregation: Option<String>, // 是否聚合，默认 "true"
}

/// 查询服务列表
/// GET /nacos/v1/ns/service/list
/// 必需参数: pageNo, pageSize
/// 可选参数: namespaceId, groupName, selector
/// 响应: 服务列表（JSON 格式，包含 count 和 doms 数组）
pub async fn list_services(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<ListServicesParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // 处理命名空间和服务组
    let namespace_id = if params.namespaceId.is_empty() {
        "public".to_string()
    } else {
        params.namespaceId
    };
    
    let group_name = if params.groupName.is_empty() {
        "DEFAULT_GROUP".to_string()
    } else {
        params.groupName
    };

    // 解析分页参数
    let page_no = params.pageNo.parse::<i64>()
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
    let page_size = params.pageSize.parse::<i64>()
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;

    // 构建查询参数
    let query_params = ServiceQueryParams {
        namespace_id: Some(namespace_id),
        group_name: Some(group_name),
        service_name: None,
        page_no: Some(page_no),
        page_size: Some(page_size),
    };

    match get_service_list_impl(&app, query_params).await {
        Ok(response) => {
            // 转换为 Nacos 格式
            let doms: Vec<String> = response.page_items
                .iter()
                .map(|service| service.service_name.clone())
                .collect();

            Ok(Json(serde_json::json!({
                "count": response.total_count,
                "doms": doms
            })))
        }
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 查询服务详情
/// GET /nacos/v1/ns/service
/// 必需参数: serviceName
/// 可选参数: namespaceId
/// 响应: 服务详情（JSON 格式，包含服务元数据和实例列表）
pub async fn get_service(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<GetServiceParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // 处理命名空间和服务组
    let namespace_id = if params.namespaceId.is_empty() {
        "public".to_string()
    } else {
        params.namespaceId
    };
    
    let group_name = "DEFAULT_GROUP".to_string();

    // 查询服务详情
    let service_detail = get_service_detail_impl(&app, &namespace_id, &group_name, &params.serviceName).await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(axum::http::StatusCode::NOT_FOUND)?;

    // 查询服务实例列表
    let instances = get_service_instances_impl(&app, &namespace_id, &group_name, &params.serviceName).await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    // 转换为 Nacos 格式
    let hosts: Vec<serde_json::Value> = instances.instances
        .iter()
        .map(|inst| {
            serde_json::json!({
                "instanceId": inst.instance_id,
                "ip": inst.ip,
                "port": inst.port,
                "weight": inst.weight,
                "healthy": inst.healthy,
                "enabled": inst.enabled,
                "ephemeral": inst.ephemeral,
                "clusterName": inst.cluster_name,
                "serviceName": inst.service_name,
                "metadata": inst.metadata.as_ref()
                    .and_then(|s| serde_json::from_str::<serde_json::Value>(s).ok())
                    .unwrap_or(serde_json::json!({}))
            })
        })
        .collect();

    let metadata = service_detail.metadata.as_ref()
        .and_then(|s| serde_json::from_str::<serde_json::Value>(s).ok())
        .unwrap_or(serde_json::json!({}));

    Ok(Json(serde_json::json!({
        "name": service_detail.service_name,
        "groupName": service_detail.group_name,
        "namespaceId": service_detail.namespace_id,
        "protectThreshold": service_detail.protect_threshold,
        "metadata": metadata,
        "selector": service_detail.selector.as_deref()
            .and_then(|s| serde_json::from_str::<serde_json::Value>(s).ok())
            .unwrap_or(serde_json::json!({})),
        "hosts": hosts
    })))
}

/// 创建服务
/// POST /nacos/v1/ns/service
/// 必需参数: serviceName
/// 可选参数: namespaceId, protectThreshold, metadata, selector
/// 响应: "ok"（成功）
pub async fn create_service(
    State(app): State<Arc<AppHandle>>,
    Form(form): Form<CreateServiceForm>,
) -> Result<Response, axum::http::StatusCode> {
    // 处理命名空间和服务组
    let namespace_id = if form.namespaceId.is_empty() {
        "public".to_string()
    } else {
        form.namespaceId
    };
    
    let group_name = "DEFAULT_GROUP".to_string();

    // 解析保护阈值
    let protect_threshold = form.protectThreshold.as_deref()
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(0.0);

    // 构建创建请求
    let request = CreateServiceRequest {
        namespace_id,
        group_name,
        service_name: form.serviceName,
        metadata: form.metadata,
        protect_threshold: Some(protect_threshold),
        selector_type: None, // TODO: 从 selector JSON 中解析
        selector: form.selector,
    };

    match create_service_impl(&app, request).await {
        Ok(_) => Ok(Response::builder()
            .status(axum::http::StatusCode::OK)
            .body(axum::body::Body::from("ok"))
            .unwrap()),
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 更新服务
/// PUT /nacos/v1/ns/service
/// 必需参数: serviceName, protectThreshold
/// 可选参数: namespaceId, metadata, selector
/// 响应: "ok"（成功）
pub async fn update_service(
    State(app): State<Arc<AppHandle>>,
    Form(form): Form<UpdateServiceForm>,
) -> Result<Response, axum::http::StatusCode> {
    // 处理命名空间和服务组
    let namespace_id = if form.namespaceId.is_empty() {
        "public".to_string()
    } else {
        form.namespaceId
    };
    
    let group_name = "DEFAULT_GROUP".to_string();

    // 解析保护阈值
    let protect_threshold = form.protectThreshold.parse::<f64>()
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;

    // 构建更新请求
    let request = UpdateServiceRequest {
        namespace_id,
        group_name,
        service_name: form.serviceName,
        metadata: form.metadata,
        protect_threshold: Some(protect_threshold),
        selector_type: None, // TODO: 从 selector JSON 中解析
        selector: form.selector,
    };

    match update_service_impl(&app, request).await {
        Ok(_) => Ok(Response::builder()
            .status(axum::http::StatusCode::OK)
            .body(axum::body::Body::from("ok"))
            .unwrap()),
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 删除服务
/// DELETE /nacos/v1/ns/service
/// 必需参数: serviceName
/// 可选参数: namespaceId
/// 响应: "ok"（成功）
pub async fn delete_service(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<DeleteServiceParams>,
) -> Result<Response, axum::http::StatusCode> {
    // 处理命名空间和服务组
    let namespace_id = if params.namespaceId.is_empty() {
        "public".to_string()
    } else {
        params.namespaceId
    };
    
    let group_name = "DEFAULT_GROUP".to_string();

    match delete_service_impl(&app, &namespace_id, &group_name, &params.serviceName).await {
        Ok(_) => Ok(Response::builder()
            .status(axum::http::StatusCode::OK)
            .body(axum::body::Body::from("ok"))
            .unwrap()),
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 搜索服务名称
/// GET /nacos/v1/ns/service/names
/// 可选参数: namespaceId, expr
/// 响应: 服务名称搜索结果（JSON 格式，包含 META-INF/services 和 count）
pub async fn search_service_names(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<SearchServiceNamesParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // 处理命名空间和服务组
    let namespace_id = if params.namespaceId.is_empty() {
        None
    } else {
        Some(params.namespaceId)
    };
    
    let group_name = "DEFAULT_GROUP".to_string();

    // 构建查询参数
    let query_params = ServiceQueryParams {
        namespace_id,
        group_name: Some(group_name),
        service_name: params.expr,
        page_no: Some(1),
        page_size: Some(1000), // 搜索时返回更多结果
    };

    match get_service_list_impl(&app, query_params).await {
        Ok(response) => {
            // 转换为 Nacos 格式
            let service_names: Vec<String> = response.page_items
                .iter()
                .map(|service| service.service_name.clone())
                .collect();

            Ok(Json(serde_json::json!({
                "count": response.total_count,
                "META-INF/services": service_names
            })))
        }
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 查询服务订阅者列表
/// GET /nacos/v1/ns/service/subscribers
/// 必需参数: serviceName
/// 可选参数: namespaceId, groupName, pageNo, pageSize, aggregation
/// 响应: 订阅者列表（JSON 格式，包含 subscribers 数组和 count）
pub async fn get_subscribers(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<GetSubscribersParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    use crate::service::get_service_instances as get_service_instances_impl;
    
    // 处理命名空间和服务组
    let namespace_id = if params.namespaceId.is_empty() {
        "public".to_string()
    } else {
        params.namespaceId
    };
    
    let group_name = "DEFAULT_GROUP".to_string();

    // 解析分页参数
    let page_no = params.pageNo.as_deref()
        .and_then(|s| s.parse::<i32>().ok())
        .unwrap_or(1);
    let page_size = params.pageSize.as_deref()
        .and_then(|s| s.parse::<i32>().ok())
        .unwrap_or(1000);
    
    // 聚合模式：如果为 true，则从所有实例中提取唯一的订阅者信息
    let aggregation = params.aggregation.as_deref()
        .map(|s| s == "true" || s == "True" || s == "1")
        .unwrap_or(true);

    // 获取服务实例列表
    match get_service_instances_impl(&app, &namespace_id, &group_name, &params.serviceName).await {
        Ok(response) => {
            // 从实例中提取订阅者信息
            // 在 Standalone 模式下，我们可以从实例的元数据中提取客户端信息
            // 或者基于实例的 IP 和端口构建订阅者信息
            let mut subscribers_map = std::collections::HashMap::new();
            
            for instance in &response.instances {
                // 构建订阅者地址字符串（IP:PORT）
                let addr_str = format!("{}:{}", instance.ip, instance.port);
                
                // 从元数据中提取 agent 和 app 信息
                let mut agent = String::new();
                let mut app = String::new();
                
                if let Some(metadata_str) = &instance.metadata {
                    if let Ok(metadata) = serde_json::from_str::<serde_json::Value>(metadata_str) {
                        if let Some(agent_val) = metadata.get("agent").or(metadata.get("user-agent")) {
                            agent = agent_val.as_str().unwrap_or("").to_string();
                        }
                        if let Some(app_val) = metadata.get("app").or(metadata.get("appName")) {
                            app = app_val.as_str().unwrap_or("").to_string();
                        }
                    }
                }
                
                // 构建订阅者键（用于去重）
                let subscriber_key = if aggregation {
                    // 聚合模式：使用 IP:PORT 作为唯一键
                    addr_str.clone()
                } else {
                    // 非聚合模式：使用完整信息作为键
                    format!("{}:{}:{}:{}", instance.ip, instance.port, agent, app)
                };
                
                // 如果不存在或需要更新，则添加/更新订阅者
                if !subscribers_map.contains_key(&subscriber_key) {
                    subscribers_map.insert(subscriber_key, serde_json::json!({
                        "addrStr": addr_str,
                        "ip": instance.ip,
                        "port": instance.port,
                        "agent": agent,
                        "app": app,
                        "namespaceId": namespace_id,
                        "serviceName": params.serviceName,
                        "cluster": instance.cluster_name
                    }));
                }
            }
            
            // 转换为列表并排序
            let mut subscribers: Vec<serde_json::Value> = subscribers_map.into_values().collect();
            subscribers.sort_by(|a, b| {
                let addr_a = a.get("addrStr").and_then(|v| v.as_str()).unwrap_or("");
                let addr_b = b.get("addrStr").and_then(|v| v.as_str()).unwrap_or("");
                addr_a.cmp(addr_b)
            });
            
            let total_count = subscribers.len();
            
            // 分页处理
            let start = ((page_no - 1) * page_size).max(0) as usize;
            let end = (start + page_size as usize).min(total_count);
            let page_items = if start < total_count {
                subscribers[start..end].to_vec()
            } else {
                Vec::new()
            };
            
            Ok(Json(serde_json::json!({
                "count": total_count,
                "subscribers": page_items
            })))
        }
        Err(_) => {
            // 如果服务不存在，返回空列表
            Ok(Json(serde_json::json!({
                "count": 0,
                "subscribers": []
            })))
        }
    }
}

/// Console API：查询服务订阅者列表
/// GET /nacos/v3/console/ns/service/subscribers
/// 必需参数: serviceName, groupName
/// 可选参数: namespaceId
/// 响应: { code: 0, data: { pageItems: [...], totalCount: number } }
pub async fn console_get_subscribers(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<GetSubscribersParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // 处理命名空间和服务组
    let namespace_id = if params.namespaceId.is_empty() {
        "public".to_string()
    } else {
        params.namespaceId
    };
    
    let group_name = params.groupName.unwrap_or_else(|| "DEFAULT_GROUP".to_string());

    // 解析分页参数
    let page_no = params.pageNo.as_deref()
        .and_then(|s| s.parse::<i32>().ok())
        .unwrap_or(1);
    let page_size = params.pageSize.as_deref()
        .and_then(|s| s.parse::<i32>().ok())
        .unwrap_or(10);
    
    // 聚合模式：如果为 true，则从所有实例中提取唯一的订阅者信息
    let aggregation = params.aggregation.as_deref()
        .map(|s| s == "true" || s == "True" || s == "1")
        .unwrap_or(true);

    use crate::service::get_service_instances as get_service_instances_impl;
    
    // 获取服务实例列表
    match get_service_instances_impl(
        &app,
        &namespace_id,
        &group_name,
        &params.serviceName,
    ).await {
        Ok(response) => {
            // 从实例中提取订阅者信息
            let mut subscribers_map = std::collections::HashMap::new();
            
            for instance in &response.instances {
                // 构建订阅者地址字符串（IP:PORT）
                let addr_str = format!("{}:{}", instance.ip, instance.port);
                
                // 从元数据中提取 agent 和 app 信息
                let mut agent = String::new();
                let mut app = String::new();
                
                if let Some(metadata_str) = &instance.metadata {
                    if let Ok(metadata) = serde_json::from_str::<serde_json::Value>(metadata_str) {
                        if let Some(agent_val) = metadata.get("agent").or(metadata.get("user-agent")) {
                            agent = agent_val.as_str().unwrap_or("").to_string();
                        }
                        if let Some(app_val) = metadata.get("app").or(metadata.get("appName")) {
                            app = app_val.as_str().unwrap_or("").to_string();
                        }
                    }
                }
                
                // 构建订阅者键（用于去重）
                let subscriber_key = if aggregation {
                    addr_str.clone()
                } else {
                    format!("{}_{}_{}", addr_str, agent, app)
                };
                
                // 如果不存在或需要更新，则添加/更新订阅者
                if !subscribers_map.contains_key(&subscriber_key) {
                    subscribers_map.insert(subscriber_key, serde_json::json!({
                        "addrStr": addr_str,
                        "groupName": group_name,
                        "serviceName": params.serviceName,
                        "address": addr_str,
                        "agent": agent,
                        "appName": app,
                    }));
                }
            }
            
            // 转换为列表并排序
            let mut subscribers: Vec<serde_json::Value> = subscribers_map.into_values().collect();
            subscribers.sort_by(|a, b| {
                let addr_a = a.get("addrStr").and_then(|v| v.as_str()).unwrap_or("");
                let addr_b = b.get("addrStr").and_then(|v| v.as_str()).unwrap_or("");
                addr_a.cmp(addr_b)
            });
            
            let total_count = subscribers.len();
            
            // 分页处理
            let start = ((page_no - 1) * page_size).max(0) as usize;
            let end = (start + page_size as usize).min(total_count);
            let page_items = if start < total_count {
                subscribers[start..end].to_vec()
            } else {
                Vec::new()
            };
            
            Ok(Json(serde_json::json!({
                "code": 0,
                "data": {
                    "pageItems": page_items,
                    "totalCount": total_count,
                    "count": total_count,
                    "subscribers": page_items
                }
            })))
        }
        Err(_) => {
            // 如果服务不存在，返回空列表
            Ok(Json(serde_json::json!({
                "code": 0,
                "data": {
                    "pageItems": [],
                    "totalCount": 0,
                    "count": 0,
                    "subscribers": []
                }
            })))
        }
    }
}
