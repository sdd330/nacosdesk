/**
 * 服务管理模块
 * 负责服务的 CRUD 操作、实例管理和历史记录
 */

use serde::{Deserialize, Serialize};
use tauri::AppHandle;

/// 服务信息
#[derive(Debug, Serialize, Deserialize)]
pub struct ServiceInfo {
    pub id: Option<i64>,
    pub namespace_id: String,
    pub group_name: String,
    pub service_name: String,
    pub metadata: Option<String>,
    pub protect_threshold: f64,
    pub selector_type: Option<String>,
    pub selector: Option<String>,
    pub gmt_create: i64,
    pub gmt_modified: i64,
}

/// 实例信息
#[derive(Debug, Serialize, Deserialize)]
pub struct InstanceInfo {
    pub id: Option<i64>,
    pub namespace_id: String,
    pub group_name: String,
    pub service_name: String,
    pub instance_id: String,
    pub ip: String,
    pub port: i32,
    pub weight: f64,
    pub healthy: bool,
    pub enabled: bool,
    pub ephemeral: bool,
    pub cluster_name: String,
    pub metadata: Option<String>,
    pub gmt_create: i64,
    pub gmt_modified: i64,
}

/// 服务查询参数
#[derive(Debug, Deserialize)]
pub struct ServiceQueryParams {
    pub namespace_id: Option<String>,
    pub group_name: Option<String>,
    pub service_name: Option<String>,
    pub page_no: Option<i64>,
    pub page_size: Option<i64>,
}

/// 服务列表响应
#[derive(Debug, Serialize)]
pub struct ServiceListResponse {
    pub total_count: i64,
    pub page_number: i64,
    pub pages_available: i64,
    pub page_items: Vec<ServiceInfo>,
}

/// 实例列表响应
#[derive(Debug, Serialize)]
pub struct InstanceListResponse {
    pub instances: Vec<InstanceInfo>,
}

/// 创建服务请求
#[derive(Debug, Deserialize)]
pub struct CreateServiceRequest {
    pub namespace_id: String,
    pub group_name: String,
    pub service_name: String,
    pub metadata: Option<String>,
    pub protect_threshold: Option<f64>,
    pub selector_type: Option<String>,
    pub selector: Option<String>,
}

/// 更新服务请求
#[derive(Debug, Deserialize)]
pub struct UpdateServiceRequest {
    pub namespace_id: String,
    pub group_name: String,
    pub service_name: String,
    pub metadata: Option<String>,
    pub protect_threshold: Option<f64>,
    pub selector_type: Option<String>,
    pub selector: Option<String>,
}

/// 注册实例请求
#[derive(Debug, Deserialize)]
pub struct RegisterInstanceRequest {
    pub namespace_id: String,
    pub group_name: String,
    pub service_name: String,
    pub ip: String,
    pub port: i32,
    pub weight: Option<f64>,
    pub healthy: Option<bool>,
    pub enabled: Option<bool>,
    pub ephemeral: Option<bool>,
    pub cluster_name: Option<String>,
    pub metadata: Option<String>,
}

/// 获取当前时间戳（秒）
fn current_timestamp() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

/// 生成实例 ID
fn generate_instance_id(ip: &str, port: i32) -> String {
    use uuid::Uuid;
    format!("{}#{}#DEFAULT#DEFAULT_GROUP@@{}", ip, port, Uuid::new_v4())
}

/// 查询服务列表
pub async fn get_service_list(
    app: &AppHandle,
    params: ServiceQueryParams,
) -> Result<ServiceListResponse, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let page_no = params.page_no.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(10);
    let offset = (page_no - 1) * page_size;

    // 构建查询条件
    let mut where_clauses = Vec::new();
    let mut query_params: Vec<(&str, &str)> = Vec::new();

    if let Some(ref namespace_id) = params.namespace_id {
        where_clauses.push("namespace_id = ?1");
        query_params.push(("?1", namespace_id));
    }
    if let Some(ref group_name) = params.group_name {
        where_clauses.push("group_name = ?2");
        query_params.push(("?2", group_name));
    }
    if let Some(ref service_name) = params.service_name {
        where_clauses.push("service_name LIKE ?3");
        query_params.push(("?3", &format!("%{}%", service_name)));
    }

    let where_sql = if where_clauses.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", where_clauses.join(" AND "))
    };

    // 查询总数
    let count_sql = format!("SELECT COUNT(*) FROM service_info {}", where_sql);
    let total_count: Option<(i64,)> = db
        .query_one(&count_sql, &query_params)
        .await
        .map_err(|e| format!("Failed to query service count: {}", e))?;

    let total_count = total_count.map(|(c,)| c).unwrap_or(0);
    let pages_available = (total_count + page_size - 1) / page_size;

    // 查询列表（先查询 ID，再逐个查询详情）
    let id_sql = format!(
        "SELECT id FROM service_info {} ORDER BY gmt_modified DESC LIMIT ?4 OFFSET ?5",
        where_sql
    );

    let mut list_params = query_params;
    list_params.push(("?4", &page_size.to_string()));
    list_params.push(("?5", &offset.to_string()));

    let id_results: Vec<(i64,)> = db
        .query(&id_sql, &list_params)
        .await
        .map_err(|e| format!("Failed to query service ids: {}", e))?;

    let mut page_items = Vec::new();
    for (id,) in id_results {
        let service: Option<(i64, String, String, String, Option<String>, f64, Option<String>, Option<String>, i64, i64)> = db
            .query_one(
                "SELECT id, namespace_id, group_name, service_name, metadata, protect_threshold, selector_type, selector, gmt_create, gmt_modified FROM service_info WHERE id = ?1",
                &[("?1", &id.to_string())],
            )
            .await
            .map_err(|e| format!("Failed to query service detail: {}", e))?;

        if let Some((id, namespace_id, group_name, service_name, metadata, protect_threshold, selector_type, selector, gmt_create, gmt_modified)) = service {
            page_items.push(ServiceInfo {
                id: Some(id),
                namespace_id,
                group_name,
                service_name,
                metadata,
                protect_threshold,
                selector_type,
                selector,
                gmt_create,
                gmt_modified,
            });
        }
    }

    Ok(ServiceListResponse {
        total_count,
        page_number: page_no,
        pages_available,
        page_items,
    })
}

/// 查询服务详情
pub async fn get_service_detail(
    app: &AppHandle,
    namespace_id: &str,
    group_name: &str,
    service_name: &str,
) -> Result<Option<ServiceInfo>, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let result: Option<(i64, String, String, String, Option<String>, f64, Option<String>, Option<String>, i64, i64)> = db
        .query_one(
            "SELECT id, namespace_id, group_name, service_name, metadata, protect_threshold, selector_type, selector, gmt_create, gmt_modified FROM service_info WHERE namespace_id = ?1 AND group_name = ?2 AND service_name = ?3",
            &[("?1", namespace_id), ("?2", group_name), ("?3", service_name)],
        )
        .await
        .map_err(|e| format!("Failed to query service detail: {}", e))?;

    Ok(result.map(|(id, namespace_id, group_name, service_name, metadata, protect_threshold, selector_type, selector, gmt_create, gmt_modified)| {
        ServiceInfo {
            id: Some(id),
            namespace_id,
            group_name,
            service_name,
            metadata,
            protect_threshold,
            selector_type,
            selector,
            gmt_create,
            gmt_modified,
        }
    }))
}

/// 创建服务
pub async fn create_service(
    app: &AppHandle,
    request: CreateServiceRequest,
) -> Result<ServiceInfo, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 检查服务是否已存在
    let existing: Option<(i64,)> = db
        .query_one(
            "SELECT id FROM service_info WHERE namespace_id = ?1 AND group_name = ?2 AND service_name = ?3",
            &[
                ("?1", &request.namespace_id),
                ("?2", &request.group_name),
                ("?3", &request.service_name),
            ],
        )
        .await
        .map_err(|e| format!("Failed to check existing service: {}", e))?;

    if existing.is_some() {
        return Err("Service already exists".to_string());
    }

    let now = current_timestamp();
    let protect_threshold = request.protect_threshold.unwrap_or(0.0);

    // 插入服务
    db.execute(
        "INSERT INTO service_info (namespace_id, group_name, service_name, metadata, protect_threshold, selector_type, selector, gmt_create, gmt_modified) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        &[
            ("?1", &request.namespace_id),
            ("?2", &request.group_name),
            ("?3", &request.service_name),
            ("?4", &request.metadata.as_deref().unwrap_or("")),
            ("?5", &protect_threshold.to_string()),
            ("?6", &request.selector_type.as_deref().unwrap_or("")),
            ("?7", &request.selector.as_deref().unwrap_or("")),
            ("?8", &now.to_string()),
            ("?9", &now.to_string()),
        ],
    )
    .await
    .map_err(|e| format!("Failed to create service: {}", e))?;

    // 记录历史
    db.execute(
        "INSERT INTO service_history_info (namespace_id, group_name, service_name, change_type, change_detail, gmt_create) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        &[
            ("?1", &request.namespace_id),
            ("?2", &request.group_name),
            ("?3", &request.service_name),
            ("?4", "CREATE"),
            ("?5", &format!("Service created: {}", request.service_name)),
            ("?6", &now.to_string()),
        ],
    )
    .await
    .map_err(|e| format!("Failed to insert service history: {}", e))?;

    // 返回创建的服务
    get_service_detail(app, &request.namespace_id, &request.group_name, &request.service_name)
        .await?
        .ok_or_else(|| "Failed to retrieve created service".to_string())
}

/// 更新服务
pub async fn update_service(
    app: &AppHandle,
    request: UpdateServiceRequest,
) -> Result<ServiceInfo, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 检查服务是否存在
    let existing: Option<(i64,)> = db
        .query_one(
            "SELECT id FROM service_info WHERE namespace_id = ?1 AND group_name = ?2 AND service_name = ?3",
            &[
                ("?1", &request.namespace_id),
                ("?2", &request.group_name),
                ("?3", &request.service_name),
            ],
        )
        .await
        .map_err(|e| format!("Failed to check existing service: {}", e))?;

    let service_id = existing.ok_or_else(|| "Service not found".to_string())?;

    let now = current_timestamp();
    let protect_threshold = request.protect_threshold.unwrap_or(0.0);

    // 更新服务
    db.execute(
        "UPDATE service_info SET metadata = ?1, protect_threshold = ?2, selector_type = ?3, selector = ?4, gmt_modified = ?5 WHERE id = ?6",
        &[
            ("?1", &request.metadata.as_deref().unwrap_or("")),
            ("?2", &protect_threshold.to_string()),
            ("?3", &request.selector_type.as_deref().unwrap_or("")),
            ("?4", &request.selector.as_deref().unwrap_or("")),
            ("?5", &now.to_string()),
            ("?6", &service_id.0.to_string()),
        ],
    )
    .await
    .map_err(|e| format!("Failed to update service: {}", e))?;

    // 记录历史
    db.execute(
        "INSERT INTO service_history_info (namespace_id, group_name, service_name, change_type, change_detail, gmt_create) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        &[
            ("?1", &request.namespace_id),
            ("?2", &request.group_name),
            ("?3", &request.service_name),
            ("?4", "UPDATE"),
            ("?5", &format!("Service updated: {}", request.service_name)),
            ("?6", &now.to_string()),
        ],
    )
    .await
    .map_err(|e| format!("Failed to insert service history: {}", e))?;

    // 返回更新的服务
    get_service_detail(app, &request.namespace_id, &request.group_name, &request.service_name)
        .await?
        .ok_or_else(|| "Failed to retrieve updated service".to_string())
}

/// 删除服务
pub async fn delete_service(
    app: &AppHandle,
    namespace_id: &str,
    group_name: &str,
    service_name: &str,
) -> Result<(), String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let now = current_timestamp();

    // 记录删除历史
    db.execute(
        "INSERT INTO service_history_info (namespace_id, group_name, service_name, change_type, change_detail, gmt_create) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        &[
            ("?1", namespace_id),
            ("?2", group_name),
            ("?3", service_name),
            ("?4", "DELETE"),
            ("?5", &format!("Service deleted: {}", service_name)),
            ("?6", &now.to_string()),
        ],
    )
    .await
        .map_err(|e| format!("Failed to insert delete history: {}", e))?;

    // 删除服务实例
    db.execute(
        "DELETE FROM instance_info WHERE namespace_id = ?1 AND group_name = ?2 AND service_name = ?3",
        &[("?1", namespace_id), ("?2", group_name), ("?3", service_name)],
    )
    .await
    .map_err(|e| format!("Failed to delete service instances: {}", e))?;

    // 删除服务
    db.execute(
        "DELETE FROM service_info WHERE namespace_id = ?1 AND group_name = ?2 AND service_name = ?3",
        &[("?1", namespace_id), ("?2", group_name), ("?3", service_name)],
    )
    .await
    .map_err(|e| format!("Failed to delete service: {}", e))?;

    Ok(())
}

/// 查询服务实例列表
pub async fn get_service_instances(
    app: &AppHandle,
    namespace_id: &str,
    group_name: &str,
    service_name: &str,
) -> Result<InstanceListResponse, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 查询实例 ID 列表
    let id_results: Vec<(i64,)> = db
        .query(
            "SELECT id FROM instance_info WHERE namespace_id = ?1 AND group_name = ?2 AND service_name = ?3 ORDER BY gmt_modified DESC",
            &[("?1", namespace_id), ("?2", group_name), ("?3", service_name)],
        )
        .await
        .map_err(|e| format!("Failed to query instance ids: {}", e))?;

    let mut instances = Vec::new();
    for (id,) in id_results {
        let instance: Option<(i64, String, String, String, String, String, i32, f64, bool, bool, bool, String, Option<String>, i64, i64)> = db
            .query_one(
                "SELECT id, namespace_id, group_name, service_name, instance_id, ip, port, weight, healthy, enabled, ephemeral, cluster_name, metadata, gmt_create, gmt_modified FROM instance_info WHERE id = ?1",
                &[("?1", &id.to_string())],
            )
            .await
            .map_err(|e| format!("Failed to query instance detail: {}", e))?;

        if let Some((id, namespace_id, group_name, service_name, instance_id, ip, port, weight, healthy, enabled, ephemeral, cluster_name, metadata, gmt_create, gmt_modified)) = instance {
            instances.push(InstanceInfo {
                id: Some(id),
                namespace_id,
                group_name,
                service_name,
                instance_id,
                ip,
                port,
                weight,
                healthy,
                enabled,
                ephemeral,
                cluster_name,
                metadata,
                gmt_create,
                gmt_modified,
            });
        }
    }

    Ok(InstanceListResponse { instances })
}

/// 注册实例
pub async fn register_instance(
    app: &AppHandle,
    request: RegisterInstanceRequest,
) -> Result<InstanceInfo, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 检查服务是否存在
    let service_exists: Option<(i64,)> = db
        .query_one(
            "SELECT id FROM service_info WHERE namespace_id = ?1 AND group_name = ?2 AND service_name = ?3",
            &[
                ("?1", &request.namespace_id),
                ("?2", &request.group_name),
                ("?3", &request.service_name),
            ],
        )
        .await
        .map_err(|e| format!("Failed to check service: {}", e))?;

    if service_exists.is_none() {
        return Err("Service not found".to_string());
    }

    let instance_id = generate_instance_id(&request.ip, request.port);
    let weight = request.weight.unwrap_or(1.0);
    let healthy = request.healthy.unwrap_or(true);
    let enabled = request.enabled.unwrap_or(true);
    let ephemeral = request.ephemeral.unwrap_or(true);
    let cluster_name = request.cluster_name.unwrap_or_else(|| "DEFAULT".to_string());
    let now = current_timestamp();

    // 检查实例是否已存在
    let existing: Option<(i64,)> = db
        .query_one(
            "SELECT id FROM instance_info WHERE namespace_id = ?1 AND group_name = ?2 AND service_name = ?3 AND instance_id = ?4",
            &[
                ("?1", &request.namespace_id),
                ("?2", &request.group_name),
                ("?3", &request.service_name),
                ("?4", &instance_id),
            ],
        )
        .await
        .map_err(|e| format!("Failed to check existing instance: {}", e))?;

    if let Some((id,)) = existing {
        // 更新现有实例
        db.execute(
            "UPDATE instance_info SET ip = ?1, port = ?2, weight = ?3, healthy = ?4, enabled = ?5, ephemeral = ?6, cluster_name = ?7, metadata = ?8, gmt_modified = ?9 WHERE id = ?10",
            &[
                ("?1", &request.ip),
                ("?2", &request.port.to_string()),
                ("?3", &weight.to_string()),
                ("?4", &(if healthy { "1" } else { "0" })),
                ("?5", &(if enabled { "1" } else { "0" })),
                ("?6", &(if ephemeral { "1" } else { "0" })),
                ("?7", &cluster_name),
                ("?8", &request.metadata.as_deref().unwrap_or("")),
                ("?9", &now.to_string()),
                ("?10", &id.to_string()),
            ],
        )
        .await
        .map_err(|e| format!("Failed to update instance: {}", e))?;
    } else {
        // 插入新实例
        db.execute(
            "INSERT INTO instance_info (namespace_id, group_name, service_name, instance_id, ip, port, weight, healthy, enabled, ephemeral, cluster_name, metadata, gmt_create, gmt_modified) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
            &[
                ("?1", &request.namespace_id),
                ("?2", &request.group_name),
                ("?3", &request.service_name),
                ("?4", &instance_id),
                ("?5", &request.ip),
                ("?6", &request.port.to_string()),
                ("?7", &weight.to_string()),
                ("?8", &(if healthy { "1" } else { "0" })),
                ("?9", &(if enabled { "1" } else { "0" })),
                ("?10", &(if ephemeral { "1" } else { "0" })),
                ("?11", &cluster_name),
                ("?12", &request.metadata.as_deref().unwrap_or("")),
                ("?13", &now.to_string()),
                ("?14", &now.to_string()),
            ],
        )
        .await
        .map_err(|e| format!("Failed to register instance: {}", e))?;
    }

    // 查询并返回实例
    let instance: Option<(i64, String, String, String, String, String, i32, f64, bool, bool, bool, String, Option<String>, i64, i64)> = db
        .query_one(
            "SELECT id, namespace_id, group_name, service_name, instance_id, ip, port, weight, healthy, enabled, ephemeral, cluster_name, metadata, gmt_create, gmt_modified FROM instance_info WHERE namespace_id = ?1 AND group_name = ?2 AND service_name = ?3 AND instance_id = ?4",
            &[
                ("?1", &request.namespace_id),
                ("?2", &request.group_name),
                ("?3", &request.service_name),
                ("?4", &instance_id),
            ],
        )
        .await
        .map_err(|e| format!("Failed to query instance: {}", e))?;

    instance
        .map(|(id, namespace_id, group_name, service_name, instance_id, ip, port, weight, healthy, enabled, ephemeral, cluster_name, metadata, gmt_create, gmt_modified)| {
            InstanceInfo {
                id: Some(id),
                namespace_id,
                group_name,
                service_name,
                instance_id,
                ip,
                port,
                weight,
                healthy,
                enabled,
                ephemeral,
                cluster_name,
                metadata,
                gmt_create,
                gmt_modified,
            }
        })
        .ok_or_else(|| "Failed to retrieve registered instance".to_string())
}

/// 注销实例
pub async fn deregister_instance(
    app: &AppHandle,
    namespace_id: &str,
    group_name: &str,
    service_name: &str,
    instance_id: &str,
) -> Result<(), String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 删除实例
    db.execute(
        "DELETE FROM instance_info WHERE namespace_id = ?1 AND group_name = ?2 AND service_name = ?3 AND instance_id = ?4",
        &[
            ("?1", namespace_id),
            ("?2", group_name),
            ("?3", service_name),
            ("?4", instance_id),
        ],
    )
    .await
    .map_err(|e| format!("Failed to deregister instance: {}", e))?;

    Ok(())
}



/// 更新实例健康状态
pub async fn update_instance_health(
    app: &AppHandle,
    namespace_id: &str,
    group_name: &str,
    service_name: &str,
    instance_id: &str,
    healthy: bool,
) -> Result<(), String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 检查实例是否存在
    let existing: Option<(i64,)> = db
        .query_one(
            "SELECT id FROM instance_info WHERE namespace_id = ?1 AND group_name = ?2 AND service_name = ?3 AND instance_id = ?4",
            &[
                ("?1", namespace_id),
                ("?2", group_name),
                ("?3", service_name),
                ("?4", instance_id),
            ],
        )
        .await
        .map_err(|e| format!("Failed to check instance: {}", e))?;

    if existing.is_none() {
        return Err("Instance not found".to_string());
    }

    let now = current_timestamp();

    // 更新健康状态
    db.execute(
        "UPDATE instance_info SET healthy = ?1, gmt_modified = ?2 WHERE namespace_id = ?3 AND group_name = ?4 AND service_name = ?5 AND instance_id = ?6",
        &[
            ("?1", &(if healthy { "1" } else { "0" })),
            ("?2", &now.to_string()),
            ("?3", namespace_id),
            ("?4", group_name),
            ("?5", service_name),
            ("?6", instance_id),
        ],
    )
    .await
    .map_err(|e| format!("Failed to update instance health: {}", e))?;

    Ok(())
}

/// 部分更新实例
pub async fn patch_instance(
    app: &AppHandle,
    namespace_id: &str,
    group_name: &str,
    service_name: &str,
    instance_id: &str,
    weight: Option<f64>,
    enabled: Option<bool>,
    healthy: Option<bool>,
    metadata: Option<String>,
) -> Result<(), String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 检查实例是否存在
    let existing: Option<(String, f64, bool, bool, Option<String>)> = db
        .query_one(
            "SELECT ip, weight, healthy, enabled, metadata FROM instance_info WHERE namespace_id = ?1 AND group_name = ?2 AND service_name = ?3 AND instance_id = ?4",
            &[
                ("?1", namespace_id),
                ("?2", group_name),
                ("?3", service_name),
                ("?4", instance_id),
            ],
        )
        .await
        .map_err(|e| format!("Failed to check instance: {}", e))?;

    if existing.is_none() {
        return Err("Instance not found".to_string());
    }

    let (_, current_weight, current_healthy, current_enabled, current_metadata) = existing.unwrap();
    
    // 合并元数据
    let final_metadata = if let Some(new_metadata) = metadata {
        // 解析新元数据
        let new_metadata_map: std::collections::HashMap<String, String> = serde_json::from_str(&new_metadata)
            .unwrap_or_default();
        
        // 解析现有元数据
        let mut existing_metadata_map: std::collections::HashMap<String, String> = current_metadata
            .as_ref()
            .and_then(|s| serde_json::from_str(s).ok())
            .unwrap_or_default();
        
        // 合并元数据
        existing_metadata_map.extend(new_metadata_map);
        
        // 序列化回 JSON
        serde_json::to_string(&existing_metadata_map)
            .map_err(|e| format!("Failed to serialize metadata: {}", e))?
    } else {
        current_metadata.unwrap_or_default()
    };

    let final_weight = weight.unwrap_or(current_weight);
    let final_healthy = healthy.unwrap_or(current_healthy);
    let final_enabled = enabled.unwrap_or(current_enabled);
    let now = current_timestamp();

    // 更新实例
    db.execute(
        "UPDATE instance_info SET weight = ?1, healthy = ?2, enabled = ?3, metadata = ?4, gmt_modified = ?5 WHERE namespace_id = ?6 AND group_name = ?7 AND service_name = ?8 AND instance_id = ?9",
        &[
            ("?1", &final_weight.to_string()),
            ("?2", &(if final_healthy { "1" } else { "0" })),
            ("?3", &(if final_enabled { "1" } else { "0" })),
            ("?4", &final_metadata),
            ("?5", &now.to_string()),
            ("?6", namespace_id),
            ("?7", group_name),
            ("?8", service_name),
            ("?9", instance_id),
        ],
    )
    .await
    .map_err(|e| format!("Failed to patch instance: {}", e))?;

    Ok(())
}

/// 批量更新实例元数据
pub async fn batch_update_instance_metadata(
    app: &AppHandle,
    namespace_id: &str,
    group_name: &str,
    service_name: &str,
    instance_ids: &[String],
    metadata: &std::collections::HashMap<String, String>,
) -> Result<Vec<String>, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let mut updated_instances = Vec::new();
    let now = current_timestamp();
    let metadata_json = serde_json::to_string(metadata)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?;

    for instance_id in instance_ids {
        // 获取现有元数据
        let existing: Option<(Option<String>,)> = db
            .query_one(
                "SELECT metadata FROM instance_info WHERE namespace_id = ?1 AND group_name = ?2 AND service_name = ?3 AND instance_id = ?4",
                &[
                    ("?1", namespace_id),
                    ("?2", group_name),
                    ("?3", service_name),
                    ("?4", instance_id),
                ],
            )
            .await
            .map_err(|e| format!("Failed to query instance: {}", e))?;

        if let Some((current_metadata,)) = existing {
            // 合并元数据
            let mut existing_metadata_map: std::collections::HashMap<String, String> = current_metadata
                .as_ref()
                .and_then(|s| serde_json::from_str(s).ok())
                .unwrap_or_default();
            
            // 合并新元数据（新值会覆盖旧值）
            existing_metadata_map.extend(metadata.clone());
            
            // 序列化回 JSON
            let merged_metadata = serde_json::to_string(&existing_metadata_map)
                .map_err(|e| format!("Failed to serialize metadata: {}", e))?;

            // 更新实例元数据
            db.execute(
                "UPDATE instance_info SET metadata = ?1, gmt_modified = ?2 WHERE namespace_id = ?3 AND group_name = ?4 AND service_name = ?5 AND instance_id = ?6",
                &[
                    ("?1", &merged_metadata),
                    ("?2", &now.to_string()),
                    ("?3", namespace_id),
                    ("?4", group_name),
                    ("?5", service_name),
                    ("?6", instance_id),
                ],
            )
            .await
            .map_err(|e| format!("Failed to update instance metadata: {}", e))?;

            updated_instances.push(instance_id.clone());
        }
    }

    Ok(updated_instances)
}

/// 批量删除实例元数据
pub async fn batch_delete_instance_metadata(
    app: &AppHandle,
    namespace_id: &str,
    group_name: &str,
    service_name: &str,
    instance_ids: &[String],
    metadata_keys: &[String],
) -> Result<Vec<String>, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let mut deleted_instances = Vec::new();
    let now = current_timestamp();

    for instance_id in instance_ids {
        // 获取现有元数据
        let existing: Option<(Option<String>,)> = db
            .query_one(
                "SELECT metadata FROM instance_info WHERE namespace_id = ?1 AND group_name = ?2 AND service_name = ?3 AND instance_id = ?4",
                &[
                    ("?1", namespace_id),
                    ("?2", group_name),
                    ("?3", service_name),
                    ("?4", instance_id),
                ],
            )
            .await
            .map_err(|e| format!("Failed to query instance: {}", e))?;

        if let Some((current_metadata,)) = existing {
            // 解析现有元数据
            let mut existing_metadata_map: std::collections::HashMap<String, String> = current_metadata
                .as_ref()
                .and_then(|s| serde_json::from_str(s).ok())
                .unwrap_or_default();
            
            // 删除指定的元数据键
            let mut has_deleted = false;
            for key in metadata_keys {
                if existing_metadata_map.remove(key).is_some() {
                    has_deleted = true;
                }
            }
            
            if has_deleted {
                // 序列化回 JSON
                let updated_metadata = serde_json::to_string(&existing_metadata_map)
                    .map_err(|e| format!("Failed to serialize metadata: {}", e))?;

                // 更新实例元数据
                db.execute(
                    "UPDATE instance_info SET metadata = ?1, gmt_modified = ?2 WHERE namespace_id = ?3 AND group_name = ?4 AND service_name = ?5 AND instance_id = ?6",
                    &[
                        ("?1", &updated_metadata),
                        ("?2", &now.to_string()),
                        ("?3", namespace_id),
                        ("?4", group_name),
                        ("?5", service_name),
                        ("?6", instance_id),
                    ],
                )
                .await
                .map_err(|e| format!("Failed to update instance metadata: {}", e))?;

                deleted_instances.push(instance_id.clone());
            }
        }
    }

    Ok(deleted_instances)
}
