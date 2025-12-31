/**
 * 配置管理模块
 * 负责配置的 CRUD 操作和历史记录管理
 */

use serde::{Deserialize, Serialize};
use tauri::AppHandle;

/// 配置信息
#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigInfo {
    pub id: Option<i64>,
    pub data_id: String,
    pub group_id: String,
    pub tenant_id: String,
    pub app_name: Option<String>,
    pub content: String,
    pub md5: Option<String>,
    pub gmt_create: i64,
    pub gmt_modified: i64,
    pub src_user: Option<String>,
    pub src_ip: Option<String>,
    pub c_desc: Option<String>,
    pub c_use: Option<String>,
    pub effect: Option<String>,
    pub r#type: Option<String>,
    pub c_schema: Option<String>,
    pub encrypted_data_key: Option<String>,
}

/// Beta 配置信息（用于灰度发布）
#[derive(Debug, Serialize, Deserialize)]
pub struct BetaConfigInfo {
    pub id: Option<i64>,
    pub data_id: String,
    pub group_id: String,
    pub tenant_id: String,
    pub app_name: Option<String>,
    pub content: String,
    pub beta_ips: Option<String>, // 灰度发布的 IP 列表，逗号分隔
    pub md5: Option<String>,
    pub gmt_create: i64,
    pub gmt_modified: i64,
    pub src_user: Option<String>,
    pub src_ip: Option<String>,
    pub encrypted_data_key: Option<String>,
}

/// 配置查询参数
#[derive(Debug, Deserialize)]
pub struct ConfigQueryParams {
    pub data_id: Option<String>,
    pub group_id: Option<String>,
    pub tenant_id: Option<String>,
    pub page_no: Option<i64>,
    pub page_size: Option<i64>,
}

/// 配置列表响应
#[derive(Debug, Serialize)]
pub struct ConfigListResponse {
    pub total_count: i64,
    pub page_number: i64,
    pub pages_available: i64,
    pub page_items: Vec<ConfigInfo>,
}

/// 创建配置请求
#[derive(Debug, Deserialize)]
pub struct CreateConfigRequest {
    pub data_id: String,
    pub group_id: String,
    pub tenant_id: String,
    pub content: String,
    pub app_name: Option<String>,
    pub c_desc: Option<String>,
    pub c_use: Option<String>,
    pub effect: Option<String>,
    pub r#type: Option<String>,
    pub c_schema: Option<String>,
    pub encrypted_data_key: Option<String>,
}

/// 更新配置请求
#[derive(Debug, Deserialize)]
pub struct UpdateConfigRequest {
    pub data_id: String,
    pub group_id: String,
    pub tenant_id: String,
    pub content: String,
    pub app_name: Option<String>,
    pub c_desc: Option<String>,
    pub c_use: Option<String>,
    pub effect: Option<String>,
    pub r#type: Option<String>,
    pub c_schema: Option<String>,
    pub encrypted_data_key: Option<String>,
}

/// 计算 MD5 哈希
fn calculate_md5(content: &str) -> String {
    let hash = md5::compute(content.as_bytes());
    format!("{:x}", hash)
}

/// 获取当前时间戳（秒）
fn current_timestamp() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

/// 查询配置列表
pub async fn get_config_list(
    app: &AppHandle,
    params: ConfigQueryParams,
) -> Result<ConfigListResponse, String> {
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

    if let Some(ref data_id) = params.data_id {
        where_clauses.push("data_id = ?1");
        query_params.push(("?1", data_id));
    }
    if let Some(ref group_id) = params.group_id {
        where_clauses.push("group_id = ?2");
        query_params.push(("?2", group_id));
    }
    if let Some(ref tenant_id) = params.tenant_id {
        where_clauses.push("tenant_id = ?3");
        query_params.push(("?3", tenant_id));
    }

    let where_sql = if where_clauses.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", where_clauses.join(" AND "))
    };

    // 查询总数
    let count_sql = format!("SELECT COUNT(*) FROM config_info {}", where_sql);
    let total_count: Option<(i64,)> = db
        .query_one(&count_sql, &query_params)
        .await
        .map_err(|e| format!("Failed to query config count: {}", e))?;

    let total_count = total_count.map(|(c,)| c).unwrap_or(0);
    let pages_available = (total_count + page_size - 1) / page_size;

    // 查询列表（先查询 ID，再逐个查询详情）
    // 注意：tauri-plugin-sql 可能不支持直接 query 多行，使用循环查询
    let id_sql = format!(
        "SELECT id FROM config_info {} ORDER BY gmt_modified DESC LIMIT ?4 OFFSET ?5",
        where_sql
    );

    let mut list_params = query_params;
    list_params.push(("?4", &page_size.to_string()));
    list_params.push(("?5", &offset.to_string()));

    // 先查询 ID 列表
    let id_results: Vec<(i64,)> = db
        .query(&id_sql, &list_params)
        .await
        .map_err(|e| format!("Failed to query config ids: {}", e))?;

    // 逐个查询详情
    let mut page_items = Vec::new();
    for (id,) in id_results {
        let config: Option<(i64, String, String, String, Option<String>, String, Option<String>, i64, i64, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>)> = db
            .query_one(
                "SELECT id, data_id, group_id, tenant_id, app_name, content, md5, gmt_create, gmt_modified, src_user, src_ip, c_desc, c_use, effect, type, c_schema, encrypted_data_key FROM config_info WHERE id = ?1",
                &[("?1", &id.to_string())],
            )
            .await
            .map_err(|e| format!("Failed to query config detail: {}", e))?;

        if let Some((id, data_id, group_id, tenant_id, app_name, content, md5, gmt_create, gmt_modified, src_user, src_ip, c_desc, c_use, effect, r#type, c_schema, encrypted_data_key)) = config {
            page_items.push(ConfigInfo {
                id: Some(id),
                data_id,
                group_id,
                tenant_id,
                app_name,
                content,
                md5,
                gmt_create,
                gmt_modified,
                src_user,
                src_ip,
                c_desc,
                c_use,
                effect,
                r#type,
                c_schema,
                encrypted_data_key,
            });
        }
    }

    Ok(ConfigListResponse {
        total_count,
        page_number: page_no,
        pages_available,
        page_items,
    })
}

/// 查询配置详情
pub async fn get_config_detail(
    app: &AppHandle,
    data_id: &str,
    group_id: &str,
    tenant_id: &str,
) -> Result<Option<ConfigInfo>, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let result: Option<(i64, String, String, String, Option<String>, String, Option<String>, i64, i64, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>)> = db
        .query_one(
            "SELECT id, data_id, group_id, tenant_id, app_name, content, md5, gmt_create, gmt_modified, src_user, src_ip, c_desc, c_use, effect, type, c_schema, encrypted_data_key FROM config_info WHERE data_id = ?1 AND group_id = ?2 AND tenant_id = ?3",
            &[("?1", data_id), ("?2", group_id), ("?3", tenant_id)],
        )
        .await
        .map_err(|e| format!("Failed to query config detail: {}", e))?;

    Ok(result.map(|(id, data_id, group_id, tenant_id, app_name, content, md5, gmt_create, gmt_modified, src_user, src_ip, c_desc, c_use, effect, r#type, c_schema, encrypted_data_key)| {
        ConfigInfo {
            id: Some(id),
            data_id,
            group_id,
            tenant_id,
            app_name,
            content,
            md5,
            gmt_create,
            gmt_modified,
            src_user,
            src_ip,
            c_desc,
            c_use,
            effect,
            r#type,
            c_schema,
            encrypted_data_key,
        }
    }))
}

/// 创建配置
pub async fn create_config(
    app: &AppHandle,
    request: CreateConfigRequest,
    src_user: Option<String>,
    src_ip: Option<String>,
) -> Result<ConfigInfo, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 检查配置是否已存在
    let existing: Option<(i64,)> = db
        .query_one(
            "SELECT id FROM config_info WHERE data_id = ?1 AND group_id = ?2 AND tenant_id = ?3",
            &[
                ("?1", &request.data_id),
                ("?2", &request.group_id),
                ("?3", &request.tenant_id),
            ],
        )
        .await
        .map_err(|e| format!("Failed to check existing config: {}", e))?;

    if existing.is_some() {
        return Err("Config already exists".to_string());
    }

    let md5 = calculate_md5(&request.content);
    let now = current_timestamp();

    // 插入配置
    db.execute(
        "INSERT INTO config_info (data_id, group_id, tenant_id, app_name, content, md5, gmt_create, gmt_modified, src_user, src_ip, c_desc, c_use, effect, type, c_schema, encrypted_data_key) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
        &[
            ("?1", &request.data_id),
            ("?2", &request.group_id),
            ("?3", &request.tenant_id),
            ("?4", &request.app_name.as_deref().unwrap_or("")),
            ("?5", &request.content),
            ("?6", &md5),
            ("?7", &now.to_string()),
            ("?8", &now.to_string()),
            ("?9", &src_user.as_deref().unwrap_or("")),
            ("?10", &src_ip.as_deref().unwrap_or("")),
            ("?11", &request.c_desc.as_deref().unwrap_or("")),
            ("?12", &request.c_use.as_deref().unwrap_or("")),
            ("?13", &request.effect.as_deref().unwrap_or("")),
            ("?14", &request.r#type.as_deref().unwrap_or("")),
            ("?15", &request.c_schema.as_deref().unwrap_or("")),
            ("?16", &request.encrypted_data_key.as_deref().unwrap_or("")),
        ],
    )
    .await
    .map_err(|e| format!("Failed to create config: {}", e))?;

    // 插入历史记录
    let config_id: Option<(i64,)> = db
        .query_one(
            "SELECT id FROM config_info WHERE data_id = ?1 AND group_id = ?2 AND tenant_id = ?3",
            &[
                ("?1", &request.data_id),
                ("?2", &request.group_id),
                ("?3", &request.tenant_id),
            ],
        )
        .await
        .map_err(|e| format!("Failed to get config id: {}", e))?;

    if let Some((id,)) = config_id {
        db.execute(
            "INSERT INTO config_history_info (nid, data_id, group_id, tenant_id, app_name, content, md5, gmt_create, gmt_modified, src_user, src_ip, op_type, encrypted_data_key) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            &[
                ("?1", &id.to_string()),
                ("?2", &request.data_id),
                ("?3", &request.group_id),
                ("?4", &request.tenant_id),
                ("?5", &request.app_name.as_deref().unwrap_or("")),
                ("?6", &request.content),
                ("?7", &md5),
                ("?8", &now.to_string()),
                ("?9", &now.to_string()),
                ("?10", &src_user.as_deref().unwrap_or("")),
                ("?11", &src_ip.as_deref().unwrap_or("")),
                ("?12", "I"), // Insert
                ("?13", &request.encrypted_data_key.as_deref().unwrap_or("")),
            ],
        )
        .await
        .map_err(|e| format!("Failed to insert config history: {}", e))?;
    }

    // 返回创建的配置
    get_config_detail(app, &request.data_id, &request.group_id, &request.tenant_id)
        .await?
        .ok_or_else(|| "Failed to retrieve created config".to_string())
}

/// 更新配置
pub async fn update_config(
    app: &AppHandle,
    request: UpdateConfigRequest,
    src_user: Option<String>,
    src_ip: Option<String>,
) -> Result<ConfigInfo, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 检查配置是否存在
    let existing: Option<(i64,)> = db
        .query_one(
            "SELECT id FROM config_info WHERE data_id = ?1 AND group_id = ?2 AND tenant_id = ?3",
            &[
                ("?1", &request.data_id),
                ("?2", &request.group_id),
                ("?3", &request.tenant_id),
            ],
        )
        .await
        .map_err(|e| format!("Failed to check existing config: {}", e))?;

    let config_id = existing.ok_or_else(|| "Config not found".to_string())?;

    let md5 = calculate_md5(&request.content);
    let now = current_timestamp();

    // 更新配置
    db.execute(
        "UPDATE config_info SET content = ?1, md5 = ?2, gmt_modified = ?3, app_name = ?4, src_user = ?5, src_ip = ?6, c_desc = ?7, c_use = ?8, effect = ?9, type = ?10, c_schema = ?11, encrypted_data_key = ?12 WHERE id = ?13",
        &[
            ("?1", &request.content),
            ("?2", &md5),
            ("?3", &now.to_string()),
            ("?4", &request.app_name.as_deref().unwrap_or("")),
            ("?5", &src_user.as_deref().unwrap_or("")),
            ("?6", &src_ip.as_deref().unwrap_or("")),
            ("?7", &request.c_desc.as_deref().unwrap_or("")),
            ("?8", &request.c_use.as_deref().unwrap_or("")),
            ("?9", &request.effect.as_deref().unwrap_or("")),
            ("?10", &request.r#type.as_deref().unwrap_or("")),
            ("?11", &request.c_schema.as_deref().unwrap_or("")),
            ("?12", &request.encrypted_data_key.as_deref().unwrap_or("")),
            ("?13", &config_id.0.to_string()),
        ],
    )
    .await
    .map_err(|e| format!("Failed to update config: {}", e))?;

    // 插入历史记录
    db.execute(
        "INSERT INTO config_history_info (nid, data_id, group_id, tenant_id, app_name, content, md5, gmt_create, gmt_modified, src_user, src_ip, op_type, encrypted_data_key) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        &[
            ("?1", &config_id.0.to_string()),
            ("?2", &request.data_id),
            ("?3", &request.group_id),
            ("?4", &request.tenant_id),
            ("?5", &request.app_name.as_deref().unwrap_or("")),
            ("?6", &request.content),
            ("?7", &md5),
            ("?8", &now.to_string()),
            ("?9", &now.to_string()),
            ("?10", &src_user.as_deref().unwrap_or("")),
            ("?11", &src_ip.as_deref().unwrap_or("")),
            ("?12", "U"), // Update
            ("?13", &request.encrypted_data_key.as_deref().unwrap_or("")),
        ],
    )
    .await
    .map_err(|e| format!("Failed to insert config history: {}", e))?;

    // 返回更新的配置
    get_config_detail(app, &request.data_id, &request.group_id, &request.tenant_id)
        .await?
        .ok_or_else(|| "Failed to retrieve updated config".to_string())
}

/// 删除配置
pub async fn delete_config(
    app: &AppHandle,
    data_id: &str,
    group_id: &str,
    tenant_id: &str,
    src_user: Option<String>,
    src_ip: Option<String>,
) -> Result<(), String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 获取配置信息（用于历史记录）
    let config: Option<(i64, String)> = db
        .query_one(
            "SELECT id, content FROM config_info WHERE data_id = ?1 AND group_id = ?2 AND tenant_id = ?3",
            &[("?1", data_id), ("?2", group_id), ("?3", tenant_id)],
        )
        .await
        .map_err(|e| format!("Failed to get config: {}", e))?;

    if let Some((id, content)) = config {
        let md5 = calculate_md5(&content);
        let now = current_timestamp();

        // 插入删除历史记录
        db.execute(
            "INSERT INTO config_history_info (id, data_id, group_id, tenant_id, content, md5, gmt_create, gmt_modified, src_user, src_ip, op_type) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            &[
                ("?1", &id.to_string()),
                ("?2", data_id),
                ("?3", group_id),
                ("?4", tenant_id),
                ("?5", &content),
                ("?6", &md5),
                ("?7", &now.to_string()),
                ("?8", &now.to_string()),
                ("?9", &src_user.as_deref().unwrap_or("")),
                ("?10", &src_ip.as_deref().unwrap_or("")),
                ("?11", "D"), // Delete
            ],
        )
        .await
        .map_err(|e| format!("Failed to insert delete history: {}", e))?;

        // 删除配置
        db.execute(
            "DELETE FROM config_info WHERE id = ?1",
            &[("?1", &id.to_string())],
        )
        .await
        .map_err(|e| format!("Failed to delete config: {}", e))?;
    }

    Ok(())
}

/// 查询配置历史
pub async fn get_config_history(
    app: &AppHandle,
    data_id: &str,
    group_id: &str,
    tenant_id: &str,
    page_no: Option<i64>,
    page_size: Option<i64>,
) -> Result<ConfigListResponse, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let page_no = page_no.unwrap_or(1);
    let page_size = page_size.unwrap_or(10);
    let offset = (page_no - 1) * page_size;

    // 查询总数
    let total_count: Option<(i64,)> = db
        .query_one(
            "SELECT COUNT(*) FROM config_history_info WHERE data_id = ?1 AND group_id = ?2 AND tenant_id = ?3",
            &[("?1", data_id), ("?2", group_id), ("?3", tenant_id)],
        )
        .await
        .map_err(|e| format!("Failed to query history count: {}", e))?;

    let total_count = total_count.map(|(c,)| c).unwrap_or(0);
    let pages_available = (total_count + page_size - 1) / page_size;

    // 查询历史列表
    let results: Vec<(i64, String, String, String, Option<String>, String, Option<String>, i64, i64, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>)> = db
        .query(
            "SELECT id, data_id, group_id, tenant_id, app_name, content, md5, gmt_create, gmt_modified, src_user, src_ip, c_desc, c_use, effect, type, c_schema, encrypted_data_key FROM config_history_info WHERE data_id = ?1 AND group_id = ?2 AND tenant_id = ?3 ORDER BY gmt_modified DESC LIMIT ?4 OFFSET ?5",
            &[
                ("?1", data_id),
                ("?2", group_id),
                ("?3", tenant_id),
                ("?4", &page_size.to_string()),
                ("?5", &offset.to_string()),
            ],
        )
        .await
        .map_err(|e| format!("Failed to query config history: {}", e))?;

    let page_items = results
        .into_iter()
        .map(|(id, data_id, group_id, tenant_id, app_name, content, md5, gmt_create, gmt_modified, src_user, src_ip, c_desc, c_use, effect, r#type, c_schema, encrypted_data_key)| {
            ConfigInfo {
                id: Some(id),
                data_id,
                group_id,
                tenant_id,
                app_name,
                content,
                md5,
                gmt_create,
                gmt_modified,
                src_user,
                src_ip,
                c_desc,
                c_use,
                effect,
                r#type,
                c_schema,
                encrypted_data_key,
            }
        })
        .collect();

    Ok(ConfigListResponse {
        total_count,
        page_number: page_no,
        pages_available,
        page_items,
    })
}



/// 历史版本信息（包含操作类型和发布类型）
#[derive(Debug, Serialize)]
pub struct ConfigHistoryInfo {
    pub id: i64,
    pub nid: i64,
    pub data_id: String,
    pub group_id: String,
    pub tenant_id: String,
    pub app_name: Option<String>,
    pub content: String,
    pub md5: String,
    pub gmt_create: i64,
    pub gmt_modified: i64,
    pub src_user: Option<String>,
    pub src_ip: Option<String>,
    pub publish_type: Option<String>,
    pub gray_name: Option<String>,
    pub ext_info: Option<String>,
    pub op_type: Option<String>,
    pub encrypted_data_key: Option<String>,
}

/// 查询历史版本详情
pub async fn get_config_history_detail(
    app: &AppHandle,
    data_id: &str,
    group_id: &str,
    tenant_id: &str,
    nid: i64,
) -> Result<Option<ConfigHistoryInfo>, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let result: Option<(i64, i64, String, String, String, Option<String>, String, String, i64, i64, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>)> = db
        .query_one(
            "SELECT id, nid, data_id, group_id, tenant_id, app_name, content, md5, gmt_create, gmt_modified, src_user, src_ip, publish_type, gray_name, ext_info, op_type, encrypted_data_key FROM config_history_info WHERE data_id = ?1 AND group_id = ?2 AND tenant_id = ?3 AND nid = ?4",
            &[
                ("?1", data_id),
                ("?2", group_id),
                ("?3", tenant_id),
                ("?4", &nid.to_string()),
            ],
        )
        .await
        .map_err(|e| format!("Failed to query history detail: {}", e))?;

    Ok(result.map(|(id, nid, data_id, group_id, tenant_id, app_name, content, md5, gmt_create, gmt_modified, src_user, src_ip, publish_type, gray_name, ext_info, op_type, encrypted_data_key)| {
        ConfigHistoryInfo {
            id,
            nid,
            data_id,
            group_id,
            tenant_id,
            app_name,
            content,
            md5,
            gmt_create,
            gmt_modified,
            src_user,
            src_ip,
            publish_type,
            gray_name,
            ext_info,
            op_type,
            encrypted_data_key,
        }
    }))
}

/// 回滚配置到指定历史版本
pub async fn rollback_config(
    app: &AppHandle,
    data_id: &str,
    group_id: &str,
    tenant_id: &str,
    nid: i64,
    src_user: Option<String>,
    src_ip: Option<String>,
) -> Result<ConfigInfo, String> {
    // 获取历史版本详情
    let history = get_config_history_detail(app, data_id, group_id, tenant_id, nid)
        .await?
        .ok_or_else(|| "History version not found".to_string())?;

    // 根据操作类型执行回滚
    match history.op_type.as_deref() {
        Some("I") => {
            // 插入操作：回滚就是删除配置
            delete_config(app, data_id, group_id, tenant_id, src_user, src_ip).await?;
            // 返回一个特殊的配置信息表示已删除
            return Ok(ConfigInfo {
                id: Some(history.nid),
                data_id: history.data_id.clone(),
                group_id: history.group_id.clone(),
                tenant_id: history.tenant_id.clone(),
                app_name: history.app_name.clone(),
                content: "".to_string(), // 已删除，内容为空
                md5: Some("".to_string()),
                gmt_create: history.gmt_create,
                gmt_modified: history.gmt_modified,
                src_user: src_user.clone(),
                src_ip: src_ip.clone(),
                c_desc: None,
                c_use: None,
                effect: None,
                r#type: None,
                c_schema: None,
                encrypted_data_key: None,
            });
        }
        Some("U") | Some("D") | None => {
            // 更新或删除操作：回滚就是恢复配置内容
            let update_request = UpdateConfigRequest {
                data_id: history.data_id.clone(),
                group_id: history.group_id.clone(),
                tenant_id: history.tenant_id.clone(),
                content: history.content.clone(),
                app_name: history.app_name.clone(),
                c_desc: history.ext_info.as_ref().and_then(|ext| {
                    serde_json::from_str::<serde_json::Value>(ext)
                        .ok()
                        .and_then(|v| v.get("c_desc").and_then(|d| d.as_str().map(|s| s.to_string())))
                }),
                c_use: history.ext_info.as_ref().and_then(|ext| {
                    serde_json::from_str::<serde_json::Value>(ext)
                        .ok()
                        .and_then(|v| v.get("c_use").and_then(|u| u.as_str().map(|s| s.to_string())))
                }),
                effect: history.ext_info.as_ref().and_then(|ext| {
                    serde_json::from_str::<serde_json::Value>(ext)
                        .ok()
                        .and_then(|v| v.get("effect").and_then(|e| e.as_str().map(|s| s.to_string())))
                }),
                r#type: history.ext_info.as_ref().and_then(|ext| {
                    serde_json::from_str::<serde_json::Value>(ext)
                        .ok()
                        .and_then(|v| v.get("type").and_then(|t| t.as_str().map(|s| s.to_string())))
                }),
                c_schema: history.ext_info.as_ref().and_then(|ext| {
                    serde_json::from_str::<serde_json::Value>(ext)
                        .ok()
                        .and_then(|v| v.get("c_schema").and_then(|s| s.as_str().map(|s| s.to_string())))
                }),
                encrypted_data_key: history.encrypted_data_key.clone(),
            };

            update_config(app, update_request, src_user, src_ip).await
        }
        _ => Err("Unknown operation type".to_string()),
    }
}

/// 获取历史配置的 Data ID 和 Group 列表
pub async fn get_history_configs(
    app: &AppHandle,
    tenant_id: &str,
) -> Result<Vec<(String, String)>, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let results: Vec<(String, String)> = if tenant_id.is_empty() {
        db.query(
            "SELECT DISTINCT data_id, group_id FROM config_history_info ORDER BY data_id, group_id",
            &[],
        )
        .await
        .map_err(|e| format!("Failed to query history configs: {}", e))?
    } else {
        db.query(
            "SELECT DISTINCT data_id, group_id FROM config_history_info WHERE tenant_id = ?1 ORDER BY data_id, group_id",
            &[("?1", tenant_id)],
        )
        .await
        .map_err(|e| format!("Failed to query history configs: {}", e))?
    };

    Ok(results)
}

/// 查询 Beta 配置
pub async fn get_beta_config(
    app: &AppHandle,
    data_id: &str,
    group_id: &str,
    tenant_id: &str,
) -> Result<Option<BetaConfigInfo>, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let result: Option<(i64, String, String, String, Option<String>, String, Option<String>, Option<String>, Option<String>, i64, i64, Option<String>, Option<String>, Option<String>)> = db
        .query_one(
            "SELECT id, data_id, group_id, tenant_id, app_name, content, beta_ips, md5, encrypted_data_key, gmt_create, gmt_modified, src_user, src_ip FROM config_info_beta WHERE data_id = ?1 AND group_id = ?2 AND tenant_id = ?3",
            &[("?1", data_id), ("?2", group_id), ("?3", tenant_id)],
        )
        .await
        .map_err(|e| format!("Failed to query beta config: {}", e))?;

    Ok(result.map(|(id, data_id, group_id, tenant_id, app_name, content, beta_ips, md5, encrypted_data_key, gmt_create, gmt_modified, src_user, src_ip)| {
        BetaConfigInfo {
            id: Some(id),
            data_id,
            group_id,
            tenant_id,
            app_name,
            content,
            beta_ips,
            md5,
            gmt_create,
            gmt_modified,
            src_user,
            src_ip,
            encrypted_data_key,
        }
    }))
}

/// 删除 Beta 配置
pub async fn delete_beta_config(
    app: &AppHandle,
    data_id: &str,
    group_id: &str,
    tenant_id: &str,
) -> Result<(), String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    db.execute(
        "DELETE FROM config_info_beta WHERE data_id = ?1 AND group_id = ?2 AND tenant_id = ?3",
        &[("?1", data_id), ("?2", group_id), ("?3", tenant_id)],
    )
    .await
    .map_err(|e| format!("Failed to delete beta config: {}", e))?;

    Ok(())
}

/// 查询配置用于导出（不分页，返回所有匹配的配置）
pub async fn get_configs_for_export(
    app: &AppHandle,
    data_id: Option<&str>,
    group_id: Option<&str>,
    tenant_id: Option<&str>,
    app_name: Option<&str>,
    ids: Option<&[i64]>,
) -> Result<Vec<ConfigInfo>, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 构建查询条件
    let mut where_clauses = Vec::new();
    let mut query_params: Vec<(&str, &str)> = Vec::new();
    let mut param_index = 1;

    if let Some(data_id) = data_id {
        where_clauses.push(format!("data_id = ?{}", param_index));
        query_params.push((&format!("?{}", param_index), data_id));
        param_index += 1;
    }
    if let Some(group_id) = group_id {
        where_clauses.push(format!("group_id = ?{}", param_index));
        query_params.push((&format!("?{}", param_index), group_id));
        param_index += 1;
    }
    if let Some(tenant_id) = tenant_id {
        where_clauses.push(format!("tenant_id = ?{}", param_index));
        query_params.push((&format!("?{}", param_index), tenant_id));
        param_index += 1;
    }
    if let Some(app_name) = app_name {
        where_clauses.push(format!("app_name = ?{}", param_index));
        query_params.push((&format!("?{}", param_index), app_name));
        param_index += 1;
    }
    if let Some(ids) = ids {
        if !ids.is_empty() {
            let placeholders: Vec<String> = (param_index..param_index + ids.len())
                .map(|i| format!("?{}", i))
                .collect();
            where_clauses.push(format!("id IN ({})", placeholders.join(",")));
            for (idx, id) in ids.iter().enumerate() {
                query_params.push((&format!("?{}", param_index + idx), &id.to_string()));
            }
        }
    }

    let where_sql = if where_clauses.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", where_clauses.join(" AND "))
    };

    // 查询所有配置（不分页）
    let sql = format!(
        "SELECT id, data_id, group_id, tenant_id, app_name, content, md5, gmt_create, gmt_modified, src_user, src_ip, c_desc, c_use, effect, type, c_schema, encrypted_data_key FROM config_info {} ORDER BY gmt_modified DESC",
        where_sql
    );

    // 先查询 ID 列表
    let id_results: Vec<(i64,)> = db
        .query(&format!("SELECT id FROM config_info {} ORDER BY gmt_modified DESC", where_sql), &query_params)
        .await
        .map_err(|e| format!("Failed to query config ids: {}", e))?;

    // 逐个查询详情
    let mut configs = Vec::new();
    for (id,) in id_results {
        let config: Option<(i64, String, String, String, Option<String>, String, Option<String>, i64, i64, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>)> = db
            .query_one(
                "SELECT id, data_id, group_id, tenant_id, app_name, content, md5, gmt_create, gmt_modified, src_user, src_ip, c_desc, c_use, effect, type, c_schema, encrypted_data_key FROM config_info WHERE id = ?1",
                &[("?1", &id.to_string())],
            )
            .await
            .map_err(|e| format!("Failed to query config detail: {}", e))?;

        if let Some((id, data_id, group_id, tenant_id, app_name, content, md5, gmt_create, gmt_modified, src_user, src_ip, c_desc, c_use, effect, r#type, c_schema, encrypted_data_key)) = config {
            configs.push(ConfigInfo {
                id: Some(id),
                data_id,
                group_id,
                tenant_id,
                app_name,
                content,
                md5,
                gmt_create,
                gmt_modified,
                src_user,
                src_ip,
                c_desc,
                c_use,
                effect,
                r#type,
                c_schema,
                encrypted_data_key,
            });
        }
    }

    Ok(configs)
}
