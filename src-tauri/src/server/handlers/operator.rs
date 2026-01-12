/**
 * 系统操作处理器
 * 实现系统开关、服务器列表、Raft leader 等 API
 */

use axum::{
    extract::{Query, State},
    response::Response,
    Json,
};
use serde::Deserialize;
use std::sync::Arc;
use tauri::AppHandle;

/// 查询系统开关参数
#[derive(Debug, Deserialize)]
pub struct GetSwitchesParams {
    #[serde(default)]
    pub debug: Option<String>, // 是否只在本机生效
}

/// 修改系统开关参数
#[derive(Debug, Deserialize)]
pub struct UpdateSwitchParams {
    pub entry: String, // 开关名
    pub value: String, // 开关值
    #[serde(default)]
    pub debug: Option<String>, // 是否只在本机生效
}

/// 查询服务器列表参数
#[derive(Debug, Deserialize)]
pub struct GetServersParams {
    #[serde(default)]
    pub healthy: Option<String>, // 是否只返回健康Server节点
}

/// 查询系统开关
/// GET /nacos/v1/ns/operator/switches
/// 响应: 系统开关配置（JSON 格式）
pub async fn get_switches(
    _State(_app): State<Arc<AppHandle>>,
    _Query(_params): Query<GetSwitchesParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // Standalone 模式返回默认配置
    let switches = serde_json::json!({
        "name": "00-00---000-NACOS_SWITCH_DOMAIN-000---00-00",
        "masters": null,
        "adWeightMap": {},
        "defaultPushCacheMillis": 10000,
        "clientBeatInterval": 5000,
        "defaultCacheMillis": 3000,
        "distroThreshold": 0.7,
        "healthCheckEnabled": true,
        "distroEnabled": false, // Standalone 模式禁用分布式
        "enableStandalone": true,
        "pushEnabled": true,
        "checkTimes": 3,
        "httpHealthParams": {
            "max": 5000,
            "min": 500,
            "factor": 0.85
        },
        "tcpHealthParams": {
            "max": 5000,
            "min": 1000,
            "factor": 0.75
        },
        "mysqlHealthParams": {
            "max": 3000,
            "min": 2000,
            "factor": 0.65
        },
        "incrementalList": [],
        "serverStatusSynchronizationPeriodMillis": 15000,
        "serviceStatusSynchronizationPeriodMillis": 5000,
        "disableAddIP": false,
        "sendBeatOnly": false,
        "limitedUrlMap": {},
        "distroServerExpiredMillis": 30000,
        "pushGoVersion": "0.1.0",
        "pushJavaVersion": "0.1.0",
        "pushPythonVersion": "0.4.3",
        "pushCVersion": "1.0.12",
        "enableAuthentication": false,
        "overriddenServerStatus": "UP",
        "defaultInstanceEphemeral": true,
        "healthCheckWhiteList": [],
        "checksum": null
    });

    Ok(Json(switches))
}

/// 修改系统开关
/// PUT /nacos/v1/ns/operator/switches
/// 必需参数: entry, value
/// 可选参数: debug
/// 响应: "ok"（成功）
/// 注意：Standalone 模式下，开关修改仅在本机生效
pub async fn update_switch(
    _State(_app): State<Arc<AppHandle>>,
    Query(params): Query<UpdateSwitchParams>,
) -> Result<Response, axum::http::StatusCode> {
    // Standalone 模式下，开关修改仅在本机生效
    // 这里可以添加实际的开关存储逻辑（如存储到数据库或配置文件）
    // 目前仅返回成功响应
    
    // 验证开关名和值
    let _entry = &params.entry;
    let _value = &params.value;
    let _debug = params.debug.as_deref().unwrap_or("false") == "true";

    // TODO: 实现实际的开关存储逻辑
    
    Ok(Response::builder()
        .status(axum::http::StatusCode::OK)
        .body(axum::body::Body::from("ok"))
        .unwrap())
}

/// 查看系统当前数据指标
/// GET /nacos/v1/ns/operator/metrics
/// 响应: 系统指标（JSON 格式）
pub async fn get_metrics(
    State(app): State<Arc<AppHandle>>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    use crate::service::get_service_list as get_service_list_impl;
    use crate::service::ServiceQueryParams;
    
    // 查询服务数量
    let service_count = match get_service_list_impl(
        &app,
        ServiceQueryParams {
            namespace_id: None,
            group_name: None,
            page_no: Some(1),
            page_size: Some(10000), // 获取所有服务
        },
    )
    .await
    {
        Ok(response) => response.total_count as i32,
        Err(_) => 0,
    };

    // 查询实例数量（通过服务列表计算）
    let instance_count = 0; // TODO: 实现实例数量统计

    // 获取系统资源使用情况（简化实现）
    let metrics = serde_json::json!({
        "serviceCount": service_count,
        "load": 0.0, // TODO: 实现系统负载统计
        "mem": 0.0, // TODO: 实现内存使用统计
        "responsibleServiceCount": service_count, // Standalone 模式下，所有服务都由本机负责
        "instanceCount": instance_count,
        "cpu": 0.0, // TODO: 实现 CPU 使用统计
        "status": "UP",
        "responsibleInstanceCount": instance_count
    });

    Ok(Json(metrics))
}

/// 查看当前集群Server列表
/// GET /nacos/v1/ns/operator/servers
/// 可选参数: healthy
/// 响应: 服务器列表（JSON 格式）
pub async fn get_servers(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<GetServersParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // Standalone 模式下，返回本机服务器信息
    // 获取服务器地址（可以从配置中读取，这里使用默认值）
    let server_ip = "127.0.0.1".to_string();
    let server_port = 8848;

    let healthy_only = params.healthy.as_deref().unwrap_or("false") == "true";

    // 构建服务器列表
    let servers = vec![serde_json::json!({
        "ip": server_ip,
        "servePort": server_port,
        "site": "unknown",
        "weight": 1,
        "adWeight": 0,
        "alive": true,
        "lastRefTime": chrono::Utc::now().timestamp_millis(),
        "lastRefTimeStr": null,
        "key": format!("{}:{}", server_ip, server_port)
    })];

    // 如果只返回健康的服务器，过滤列表
    let filtered_servers: Vec<serde_json::Value> = if healthy_only {
        servers.into_iter()
            .filter(|s| s["alive"].as_bool().unwrap_or(false))
            .collect()
    } else {
        servers
    };

    Ok(Json(serde_json::json!({
        "servers": filtered_servers
    })))
}

/// 查看当前集群leader
/// GET /nacos/v1/ns/raft/leader
/// 响应: Raft leader 信息（JSON 格式）
pub async fn get_raft_leader(
    State(_app): State<Arc<AppHandle>>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // Standalone 模式下，本机就是 leader
    let server_ip = "127.0.0.1".to_string();
    let server_port = 8848;
    let leader_key = format!("{}:{}", server_ip, server_port);

    let leader = serde_json::json!({
        "leader": serde_json::json!({
            "heartbeatDueMs": 2500,
            "ip": leader_key,
            "leaderDueMs": 12853,
            "state": "LEADER",
            "term": 1,
            "voteFor": leader_key
        })
    });

    Ok(Json(leader))
}
