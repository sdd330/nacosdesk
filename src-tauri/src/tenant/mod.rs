/**
 * 命名空间管理模块
 * 负责命名空间的 CRUD 操作
 */

use serde::{Deserialize, Serialize};
use tauri::AppHandle;

/// 命名空间信息
#[derive(Debug, Serialize, Deserialize)]
pub struct TenantInfo {
    pub id: Option<i64>,
    pub kp: String,
    pub tenant_id: String,
    pub tenant_name: String,
    pub tenant_desc: Option<String>,
    pub create_source: Option<String>,
    pub gmt_create: i64,
    pub gmt_modified: i64,
}

/// 命名空间列表响应
#[derive(Debug, Serialize)]
pub struct TenantListResponse {
    pub tenants: Vec<TenantInfo>,
}

/// 创建命名空间请求
#[derive(Debug, Deserialize)]
pub struct CreateTenantRequest {
    pub tenant_id: String,
    pub tenant_name: String,
    pub tenant_desc: Option<String>,
}

/// 更新命名空间请求
#[derive(Debug, Deserialize)]
pub struct UpdateTenantRequest {
    pub tenant_id: String,
    pub tenant_name: String,
    pub tenant_desc: Option<String>,
}

/// 获取当前时间戳（秒）
fn current_timestamp() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

/// 查询命名空间列表
pub async fn get_namespace_list(
    app: &AppHandle,
) -> Result<TenantListResponse, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 查询命名空间 ID 列表
    let id_results: Vec<(i64,)> = db
        .query(
            "SELECT id FROM tenant_info ORDER BY gmt_modified DESC",
            &[],
        )
        .await
        .map_err(|e| format!("Failed to query tenant ids: {}", e))?;

    let mut tenants = Vec::new();
    for (id,) in id_results {
        let tenant: Option<(i64, String, String, String, Option<String>, Option<String>, i64, i64)> = db
            .query_one(
                "SELECT id, kp, tenant_id, tenant_name, tenant_desc, create_source, gmt_create, gmt_modified FROM tenant_info WHERE id = ?1",
                &[("?1", &id.to_string())],
            )
            .await
            .map_err(|e| format!("Failed to query tenant detail: {}", e))?;

        if let Some((id, kp, tenant_id, tenant_name, tenant_desc, create_source, gmt_create, gmt_modified)) = tenant {
            tenants.push(TenantInfo {
                id: Some(id),
                kp,
                tenant_id,
                tenant_name,
                tenant_desc,
                create_source,
                gmt_create,
                gmt_modified,
            });
        }
    }

    Ok(TenantListResponse { tenants })
}

/// 创建命名空间
pub async fn create_namespace(
    app: &AppHandle,
    request: CreateTenantRequest,
) -> Result<TenantInfo, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 检查命名空间是否已存在
    let existing: Option<(i64,)> = db
        .query_one(
            "SELECT id FROM tenant_info WHERE kp = ?1 AND tenant_id = ?2",
            &[("?1", "1"), ("?2", &request.tenant_id)],
        )
        .await
        .map_err(|e| format!("Failed to check existing tenant: {}", e))?;

    if existing.is_some() {
        return Err("Namespace already exists".to_string());
    }

    let now = current_timestamp();

    // 插入命名空间
    db.execute(
        "INSERT INTO tenant_info (kp, tenant_id, tenant_name, tenant_desc, create_source, gmt_create, gmt_modified) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        &[
            ("?1", "1"),
            ("?2", &request.tenant_id),
            ("?3", &request.tenant_name),
            ("?4", &request.tenant_desc.as_deref().unwrap_or("")),
            ("?5", "CONSOLE"),
            ("?6", &now.to_string()),
            ("?7", &now.to_string()),
        ],
    )
    .await
    .map_err(|e| format!("Failed to create namespace: {}", e))?;

    // 查询并返回创建的命名空间
    let tenant: Option<(i64, String, String, String, Option<String>, Option<String>, i64, i64)> = db
        .query_one(
            "SELECT id, kp, tenant_id, tenant_name, tenant_desc, create_source, gmt_create, gmt_modified FROM tenant_info WHERE kp = ?1 AND tenant_id = ?2",
            &[("?1", "1"), ("?2", &request.tenant_id)],
        )
        .await
        .map_err(|e| format!("Failed to query created tenant: {}", e))?;

    tenant
        .map(|(id, kp, tenant_id, tenant_name, tenant_desc, create_source, gmt_create, gmt_modified)| {
            TenantInfo {
                id: Some(id),
                kp,
                tenant_id,
                tenant_name,
                tenant_desc,
                create_source,
                gmt_create,
                gmt_modified,
            }
        })
        .ok_or_else(|| "Failed to retrieve created namespace".to_string())
}

/// 更新命名空间
pub async fn update_namespace(
    app: &AppHandle,
    request: UpdateTenantRequest,
) -> Result<TenantInfo, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 检查命名空间是否存在
    let existing: Option<(i64,)> = db
        .query_one(
            "SELECT id FROM tenant_info WHERE kp = ?1 AND tenant_id = ?2",
            &[("?1", "1"), ("?2", &request.tenant_id)],
        )
        .await
        .map_err(|e| format!("Failed to check existing tenant: {}", e))?;

    let tenant_id = existing.ok_or_else(|| "Namespace not found".to_string())?;

    let now = current_timestamp();

    // 更新命名空间
    db.execute(
        "UPDATE tenant_info SET tenant_name = ?1, tenant_desc = ?2, gmt_modified = ?3 WHERE id = ?4",
        &[
            ("?1", &request.tenant_name),
            ("?2", &request.tenant_desc.as_deref().unwrap_or("")),
            ("?3", &now.to_string()),
            ("?4", &tenant_id.0.to_string()),
        ],
    )
    .await
    .map_err(|e| format!("Failed to update namespace: {}", e))?;

    // 查询并返回更新的命名空间
    let tenant: Option<(i64, String, String, String, Option<String>, Option<String>, i64, i64)> = db
        .query_one(
            "SELECT id, kp, tenant_id, tenant_name, tenant_desc, create_source, gmt_create, gmt_modified FROM tenant_info WHERE kp = ?1 AND tenant_id = ?2",
            &[("?1", "1"), ("?2", &request.tenant_id)],
        )
        .await
        .map_err(|e| format!("Failed to query updated tenant: {}", e))?;

    tenant
        .map(|(id, kp, tenant_id, tenant_name, tenant_desc, create_source, gmt_create, gmt_modified)| {
            TenantInfo {
                id: Some(id),
                kp,
                tenant_id,
                tenant_name,
                tenant_desc,
                create_source,
                gmt_create,
                gmt_modified,
            }
        })
        .ok_or_else(|| "Failed to retrieve updated namespace".to_string())
}

/// 删除命名空间
pub async fn delete_namespace(
    app: &AppHandle,
    tenant_id: &str,
) -> Result<(), String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 检查命名空间是否存在
    let existing: Option<(i64,)> = db
        .query_one(
            "SELECT id FROM tenant_info WHERE kp = ?1 AND tenant_id = ?2",
            &[("?1", "1"), ("?2", tenant_id)],
        )
        .await
        .map_err(|e| format!("Failed to check existing tenant: {}", e))?;

    if existing.is_none() {
        return Err("Namespace not found".to_string());
    }

    // 删除命名空间下的所有配置
    db.execute(
        "DELETE FROM config_info WHERE tenant_id = ?1",
        &[("?1", tenant_id)],
    )
    .await
    .map_err(|e| format!("Failed to delete configs: {}", e))?;

    // 删除命名空间下的所有服务
    db.execute(
        "DELETE FROM service_info WHERE namespace_id = ?1",
        &[("?1", tenant_id)],
    )
    .await
    .map_err(|e| format!("Failed to delete services: {}", e))?;

    // 删除命名空间下的所有实例
    db.execute(
        "DELETE FROM instance_info WHERE namespace_id = ?1",
        &[("?1", tenant_id)],
    )
    .await
    .map_err(|e| format!("Failed to delete instances: {}", e))?;

    // 删除命名空间
    db.execute(
        "DELETE FROM tenant_info WHERE kp = ?1 AND tenant_id = ?2",
        &[("?1", "1"), ("?2", tenant_id)],
    )
    .await
    .map_err(|e| format!("Failed to delete namespace: {}", e))?;

    Ok(())
}

