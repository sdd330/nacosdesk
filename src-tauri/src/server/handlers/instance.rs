/**
 * 实例管理处理器
 * 实现实例管理相关 API
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
    register_instance as register_instance_impl,
    deregister_instance as deregister_instance_impl,
    get_service_instances as get_service_instances_impl,
    update_instance_health as update_instance_health_impl,
    RegisterInstanceRequest, InstanceInfo,
};

/// 注册实例参数（Nacos API 格式）
#[derive(Debug, Deserialize)]
pub struct RegisterInstanceParams {
    pub ip: String,
    pub port: String, // Nacos 使用字符串格式
    pub serviceName: String,
    #[serde(default)]
    pub namespaceId: String, // 命名空间，默认 "public"
    #[serde(default)]
    pub groupName: String, // 服务组，默认 "DEFAULT_GROUP"
    #[serde(default)]
    pub cluster: Option<String>, // 集群名，默认 "DEFAULT"
    #[serde(default)]
    pub weight: Option<f64>, // 权重，默认 1.0
    #[serde(default)]
    pub healthy: Option<String>, // 健康状态，默认 "true"
    #[serde(default)]
    pub enabled: Option<String>, // 是否启用，默认 "true"
    #[serde(default)]
    pub ephemeral: Option<String>, // 是否临时实例，默认 "true"
    #[serde(default)]
    pub metadata: Option<String>, // 元数据，JSON 字符串
}

/// 更新实例参数（同注册实例）
pub type UpdateInstanceParams = RegisterInstanceParams;

/// 注销实例参数
#[derive(Debug, Deserialize)]
pub struct DeregisterInstanceParams {
    pub ip: String,
    pub port: String,
    pub serviceName: String,
    #[serde(default)]
    pub namespaceId: String,
    #[serde(default)]
    pub groupName: String,
    #[serde(default)]
    pub cluster: Option<String>,
    #[serde(default)]
    pub ephemeral: Option<String>,
}

/// 查询实例列表参数
#[derive(Debug, Deserialize)]
pub struct ListInstancesParams {
    pub serviceName: String,
    #[serde(default)]
    pub namespaceId: String,
    #[serde(default)]
    pub groupName: String,
    #[serde(default)]
    pub clusters: Option<String>, // 集群列表，逗号分隔
    #[serde(default)]
    pub healthyOnly: Option<String>, // 仅健康实例，默认 "false"
    #[serde(default)]
    pub clientIP: Option<String>,
    #[serde(default)]
    pub udpPort: Option<String>,
    #[serde(default)]
    pub app: Option<String>,
}

/// 查询实例详情参数
#[derive(Debug, Deserialize)]
pub struct GetInstanceParams {
    pub ip: String,
    pub port: String,
    pub serviceName: String,
    #[serde(default)]
    pub namespaceId: String,
    #[serde(default)]
    pub cluster: Option<String>,
}

/// 实例心跳参数
#[derive(Debug, Deserialize)]
pub struct HeartbeatParams {
    pub serviceName: String,
    #[serde(default)]
    pub namespaceId: String,
    pub ip: Option<String>,
    pub port: Option<String>,
    #[serde(default)]
    pub cluster: Option<String>,
    #[serde(default)]
    pub beat: Option<String>, // 心跳信息 JSON 字符串
}

/// 部分更新实例参数
#[derive(Debug, Deserialize)]
pub struct PatchInstanceParams {
    pub ip: String,
    pub port: String,
    pub serviceName: String,
    #[serde(default)]
    pub namespaceId: String,
    #[serde(default)]
    pub cluster: Option<String>,
    #[serde(default)]
    pub metadata: Option<String>,
    #[serde(default)]
    pub weight: Option<f64>,
    #[serde(default)]
    pub healthy: Option<String>,
    #[serde(default)]
    pub enabled: Option<String>,
}

/// 查询实例健康状态参数
#[derive(Debug, Deserialize)]
pub struct InstanceStatusesParams {
    pub key: String, // 格式：namespaceId##serviceName 或 serviceName
}

/// 注册实例
/// POST /nacos/v1/ns/instance
/// 必需参数: ip, port, serviceName
/// 可选参数: namespaceId, groupName, cluster, weight, healthy, enabled, ephemeral, metadata
/// 响应: "ok"（成功）
pub async fn register_instance(
    State(app): State<Arc<AppHandle>>,
    Form(params): Form<RegisterInstanceParams>,
) -> Result<Response, axum::http::StatusCode> {
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

    // 解析端口
    let port = params.port.parse::<i32>()
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;

    // 解析布尔值
    let healthy = params.healthy.as_deref()
        .map(|s| s == "true" || s == "True" || s == "1")
        .unwrap_or(true);
    
    let enabled = params.enabled.as_deref()
        .map(|s| s == "true" || s == "True" || s == "1")
        .unwrap_or(true);
    
    let ephemeral = params.ephemeral.as_deref()
        .map(|s| s == "true" || s == "True" || s == "1")
        .unwrap_or(true);

    // 构建注册请求
    let request = RegisterInstanceRequest {
        namespace_id,
        group_name,
        service_name: params.serviceName,
        ip: params.ip,
        port,
        weight: params.weight,
        healthy: Some(healthy),
        enabled: Some(enabled),
        ephemeral: Some(ephemeral),
        cluster_name: params.cluster,
        metadata: params.metadata,
    };

    match register_instance_impl(&app, request).await {
        Ok(_) => Ok(Response::builder()
            .status(axum::http::StatusCode::OK)
            .body(axum::body::Body::from("ok"))
            .unwrap()),
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 更新实例
/// PUT /nacos/v1/ns/instance
/// 参数同注册实例
/// 响应: "ok"（成功）
pub async fn update_instance(
    State(app): State<Arc<AppHandle>>,
    Form(params): Form<UpdateInstanceParams>,
) -> Result<Response, axum::http::StatusCode> {
    // 更新实例实际上就是重新注册
    register_instance(State(app), Form(params)).await
}

/// 注销实例
/// DELETE /nacos/v1/ns/instance
/// 必需参数: ip, port, serviceName
/// 可选参数: namespaceId, groupName, cluster, ephemeral
/// 响应: "ok"（成功）
pub async fn deregister_instance(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<DeregisterInstanceParams>,
) -> Result<Response, axum::http::StatusCode> {
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

    // 构建实例 ID（格式：ip#port#cluster#group）
    let instance_id = format!("{}#{}#{}#{}", 
        params.ip,
        params.port,
        params.cluster.as_deref().unwrap_or("DEFAULT"),
        group_name
    );

    match deregister_instance_impl(&app, &namespace_id, &group_name, &params.serviceName, &instance_id).await {
        Ok(_) => Ok(Response::builder()
            .status(axum::http::StatusCode::OK)
            .body(axum::body::Body::from("ok"))
            .unwrap()),
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 查询实例列表
/// GET /nacos/v1/ns/instance/list
/// 必需参数: serviceName
/// 可选参数: namespaceId, groupName, clusters, healthyOnly, clientIP, udpPort, app
/// 响应: 实例列表（JSON 格式，包含 hosts 数组）
pub async fn list_instances(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<ListInstancesParams>,
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

    match get_service_instances_impl(&app, &namespace_id, &group_name, &params.serviceName).await {
        Ok(response) => {
            // 转换为 Nacos 格式
            let healthy_only = params.healthyOnly.as_deref()
                .map(|s| s == "true" || s == "True" || s == "1")
                .unwrap_or(false);

            let hosts: Vec<serde_json::Value> = response.instances
                .iter()
                .filter(|inst| !healthy_only || inst.healthy)
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

            Ok(Json(serde_json::json!({
                "hosts": hosts,
                "dom": params.serviceName
            })))
        }
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 查询实例详情
/// GET /nacos/v1/ns/instance
/// 必需参数: ip, port, serviceName
/// 可选参数: namespaceId, cluster
/// 响应: 实例详情（JSON 格式）
pub async fn get_instance(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<GetInstanceParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // 处理命名空间和服务组
    let namespace_id = if params.namespaceId.is_empty() {
        "public".to_string()
    } else {
        params.namespaceId
    };
    
    let group_name = "DEFAULT_GROUP".to_string();

    match get_service_instances_impl(&app, &namespace_id, &group_name, &params.serviceName).await {
        Ok(response) => {
            // 查找匹配的实例
            let port = params.port.parse::<i32>()
                .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
            
            let instance = response.instances
                .iter()
                .find(|inst| inst.ip == params.ip && inst.port == port);

            match instance {
                Some(inst) => {
                    Ok(Json(serde_json::json!({
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
                    })))
                }
                None => Err(axum::http::StatusCode::NOT_FOUND),
            }
        }
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 实例心跳
/// PUT /nacos/v1/ns/instance/beat
/// 必需参数: serviceName
/// 可选参数: namespaceId, ip, port, cluster, beat
/// 响应: 心跳响应（JSON 格式，包含 clientBeatInterval, code, lightBeatEnabled）
pub async fn heartbeat(
    State(app): State<Arc<AppHandle>>,
    Form(params): Form<HeartbeatParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // 处理命名空间和服务组
    let namespace_id = if params.namespaceId.is_empty() {
        "public".to_string()
    } else {
        params.namespaceId
    };
    
    let group_name = "DEFAULT_GROUP".to_string();

    // 如果有 ip 和 port，更新实例的最后心跳时间
    if let (Some(ip), Some(port_str)) = (params.ip, params.port) {
        if let Ok(port) = port_str.parse::<i32>() {
            // 构建实例 ID
            let instance_id = format!("{}#{}#{}#{}", 
                ip,
                port,
                params.cluster.as_deref().unwrap_or("DEFAULT"),
                group_name
            );

            // 更新实例健康状态（心跳表示实例健康）
            let _ = update_instance_health_impl(
                &app,
                &namespace_id,
                &group_name,
                &params.serviceName,
                &instance_id,
                true,
            ).await;
        }
    }

    // 返回心跳响应
    Ok(Json(serde_json::json!({
        "clientBeatInterval": 5000,
        "code": 10200,
        "lightBeatEnabled": false
    })))
}

/// 部分更新实例参数
#[derive(Debug, Deserialize)]
pub struct PatchInstanceParams {
    pub ip: String,
    pub port: String,
    pub serviceName: String,
    #[serde(default)]
    pub namespaceId: String,
    #[serde(default)]
    pub groupName: String,
    #[serde(default)]
    pub cluster: Option<String>,
    #[serde(default)]
    pub weight: Option<f64>,
    #[serde(default)]
    pub healthy: Option<String>,
    #[serde(default)]
    pub enabled: Option<String>,
    #[serde(default)]
    pub metadata: Option<String>,
}

/// 部分更新实例
/// PATCH /nacos/v1/ns/instance
/// 必需参数: ip, port, serviceName
/// 可选参数: namespaceId, groupName, cluster, metadata, weight, healthy, enabled
/// 响应: "ok"（成功）
pub async fn patch_instance(
    State(app): State<Arc<AppHandle>>,
    Form(params): Form<PatchInstanceParams>,
) -> Result<Response, axum::http::StatusCode> {
    use crate::service::patch_instance as patch_instance_impl;
    
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

    // 构建实例 ID（格式：ip#port#cluster#group）
    let cluster_name = params.cluster.as_deref().unwrap_or("DEFAULT");
    let instance_id = format!("{}#{}#{}#{}", 
        params.ip,
        params.port,
        cluster_name,
        group_name
    );

    // 解析可选参数
    let weight = params.weight;
    let healthy = params.healthy.as_deref()
        .map(|s| s == "true" || s == "True" || s == "1");
    let enabled = params.enabled.as_deref()
        .map(|s| s == "true" || s == "True" || s == "1");
    let metadata = params.metadata;

    match patch_instance_impl(
        &app,
        &namespace_id,
        &group_name,
        &params.serviceName,
        &instance_id,
        weight,
        enabled,
        healthy,
        metadata,
    ).await {
        Ok(_) => Ok(Response::builder()
            .status(axum::http::StatusCode::OK)
            .body(axum::body::Body::from("ok"))
            .unwrap()),
        Err(e) => {
            if e.contains("not found") {
                Err(axum::http::StatusCode::NOT_FOUND)
            } else {
                Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
            }
        }
    }
}

/// 批量更新实例元数据参数
#[derive(Debug, Deserialize)]
pub struct BatchUpdateMetadataParams {
    pub serviceName: String,
    #[serde(default)]
    pub namespaceId: String,
    #[serde(default)]
    pub groupName: String,
    pub instances: String, // JSON 字符串，包含实例列表
    pub metadata: String, // JSON 字符串或逗号分隔的 key=value 格式
    #[serde(default)]
    pub consistencyType: Option<String>,
}

/// 批量更新实例元数据
/// PUT /nacos/v1/ns/instance/metadata/batch
/// 必需参数: serviceName, instances, metadata
/// 可选参数: namespaceId, groupName, consistencyType
/// 响应: 更新结果（JSON 格式，包含 updated 数组）
pub async fn batch_update_metadata(
    State(app): State<Arc<AppHandle>>,
    Form(params): Form<BatchUpdateMetadataParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    use crate::service::batch_update_instance_metadata as batch_update_metadata_impl;
    
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

    // 解析 instances（JSON 数组）
    #[derive(Debug, Deserialize)]
    struct InstanceRef {
        ip: String,
        port: i32,
        #[serde(default)]
        cluster: Option<String>,
    }
    
    let instances: Vec<InstanceRef> = serde_json::from_str(&params.instances)
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;

    // 构建实例 ID 列表
    let instance_ids: Vec<String> = instances.iter()
        .map(|inst| {
            let cluster = inst.cluster.as_deref().unwrap_or("DEFAULT");
            format!("{}#{}#{}#{}", inst.ip, inst.port, cluster, group_name)
        })
        .collect();

    // 解析 metadata（支持 JSON 或 key=value,key=value 格式）
    let metadata_map: std::collections::HashMap<String, String> = if params.metadata.trim_start().starts_with('{') {
        // JSON 格式
        serde_json::from_str(&params.metadata)
            .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?
    } else {
        // key=value,key=value 格式
        let mut map = std::collections::HashMap::new();
        for pair in params.metadata.split(',') {
            if let Some((key, value)) = pair.split_once('=') {
                map.insert(key.trim().to_string(), value.trim().to_string());
            }
        }
        map
    };

    match batch_update_metadata_impl(
        &app,
        &namespace_id,
        &group_name,
        &params.serviceName,
        &instance_ids,
        &metadata_map,
    ).await {
        Ok(updated) => Ok(Json(serde_json::json!({
            "updated": updated
        }))),
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 批量删除实例元数据参数
#[derive(Debug, Deserialize)]
pub struct BatchDeleteMetadataParams {
    pub serviceName: String,
    #[serde(default)]
    pub namespaceId: String,
    #[serde(default)]
    pub groupName: String,
    pub instances: String, // JSON 字符串，包含实例列表
    pub metadata: String, // 逗号分隔的元数据键列表
    #[serde(default)]
    pub consistencyType: Option<String>,
}

/// 批量删除实例元数据
/// DELETE /nacos/v1/ns/instance/metadata/batch
/// 必需参数: serviceName, instances, metadata（逗号分隔的键列表）
/// 可选参数: namespaceId, groupName, consistencyType
/// 响应: 删除结果（JSON 格式，包含 deleted 数组）
pub async fn batch_delete_metadata(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<BatchDeleteMetadataParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    use crate::service::batch_delete_instance_metadata as batch_delete_metadata_impl;
    
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

    // 解析 instances（JSON 数组）
    #[derive(Debug, Deserialize)]
    struct InstanceRef {
        ip: String,
        port: i32,
        #[serde(default)]
        cluster: Option<String>,
    }
    
    let instances: Vec<InstanceRef> = serde_json::from_str(&params.instances)
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;

    // 构建实例 ID 列表
    let instance_ids: Vec<String> = instances.iter()
        .map(|inst| {
            let cluster = inst.cluster.as_deref().unwrap_or("DEFAULT");
            format!("{}#{}#{}#{}", inst.ip, inst.port, cluster, group_name)
        })
        .collect();

    // 解析 metadata（逗号分隔的键列表）
    let metadata_keys: Vec<String> = params.metadata
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    match batch_delete_metadata_impl(
        &app,
        &namespace_id,
        &group_name,
        &params.serviceName,
        &instance_ids,
        &metadata_keys,
    ).await {
        Ok(deleted) => Ok(Json(serde_json::json!({
            "deleted": deleted
        }))),
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 查询实例健康状态列表
/// GET /nacos/v1/ns/instance/statuses
/// 必需参数: key（格式：namespaceId##serviceName 或 serviceName）
/// 响应: 实例健康状态列表（JSON 格式，包含 ips 数组）
pub async fn get_instance_statuses(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<InstanceStatusesParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // 解析 key 参数（支持命名空间分隔符 ##）
    let (namespace_id, service_name) = if params.key.contains("##") {
        let parts: Vec<&str> = params.key.split("##").collect();
        if parts.len() == 2 {
            (parts[0].to_string(), parts[1].to_string())
        } else {
            ("public".to_string(), params.key)
        }
    } else {
        ("public".to_string(), params.key)
    };

    let group_name = "DEFAULT_GROUP".to_string();

    match get_service_instances_impl(&app, &namespace_id, &group_name, &service_name).await {
        Ok(response) => {
            // 格式化状态列表（格式：ip:port_healthy）
            let ips: Vec<String> = response.instances
                .iter()
                .map(|inst| {
                    format!("{}:{}_{}", inst.ip, inst.port, if inst.healthy { "healthy" } else { "unhealthy" })
                })
                .collect();

            Ok(Json(serde_json::json!({
                "ips": ips
            })))
        }
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}
