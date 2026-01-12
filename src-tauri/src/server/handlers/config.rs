/**
 * 配置管理处理器
 * 实现配置管理相关 API
 */

use axum::{
    extract::{Multipart, Query, State},
    response::Response,
    Json,
};
use axum::body::Body;
use axum_extra::extract::Form;
use serde::Deserialize;
use std::sync::Arc;
use std::time::Duration;
use tauri::AppHandle;
use urlencoding::decode as url_decode;

use crate::config::{
    get_config_detail, create_config, update_config, delete_config, get_config_history,
    CreateConfigRequest, UpdateConfigRequest,
};

/// 获取配置查询参数（Nacos API 格式）
#[derive(Debug, Deserialize)]
pub struct GetConfigParams {
    #[serde(default)]
    pub dataId: Option<String>, // 可选，当 search 参数存在时
    #[serde(default)]
    pub group: Option<String>, // 可选，当 search 参数存在时
    #[serde(default)]
    pub tenant: String, // 命名空间，默认为空字符串（public）
    #[serde(default)]
    pub show: Option<String>, // show=all 时返回详细信息
    #[serde(default)]
    pub search: Option<String>, // accurate 或 blur，用于搜索
    #[serde(default)]
    pub beta: Option<String>, // beta=true 时查询 Beta 配置
    #[serde(default)]
    pub export: Option<String>, // export=true 时导出配置
    #[serde(default)]
    pub exportV2: Option<String>, // exportV2=true 时导出配置（V2 格式）
    #[serde(default)]
    pub appName: Option<String>,
    #[serde(default)]
    pub config_tags: Option<String>,
    #[serde(default)]
    pub config_detail: Option<String>, // 配置内容搜索
    #[serde(default)]
    pub pageNo: Option<i64>,
    #[serde(default)]
    pub pageSize: Option<i64>,
    #[serde(default)]
    pub types: Option<String>, // 配置类型过滤
    #[serde(default)]
    pub ids: Option<String>, // 逗号分隔的 ID 列表（用于导出）
}

/// Console API 配置查询参数（支持搜索）
#[derive(Debug, Deserialize)]
pub struct ConsoleConfigQueryParams {
    #[serde(default)]
    pub dataId: Option<String>,
    #[serde(default)]
    pub group: Option<String>,
    #[serde(default)]
    pub tenant: String, // 命名空间，默认为空字符串（public）
    #[serde(default)]
    pub appName: Option<String>,
    #[serde(default)]
    pub config_tags: Option<String>,
    #[serde(default)]
    pub config_detail: Option<String>, // 配置内容搜索
    #[serde(default)]
    pub search: Option<String>, // accurate 或 blur
    #[serde(default)]
    pub pageNo: Option<i64>,
    #[serde(default)]
    pub pageSize: Option<i64>,
    #[serde(default)]
    pub types: Option<String>, // 配置类型过滤
}

/// 导出配置查询参数
#[derive(Debug, Deserialize)]
pub struct ExportConfigParams {
    #[serde(default)]
    pub dataId: Option<String>,
    #[serde(default)]
    pub group: Option<String>,
    #[serde(default)]
    pub tenant: String,
    #[serde(default)]
    pub appName: Option<String>,
    #[serde(default)]
    pub ids: Option<String>, // 逗号分隔的 ID 列表
    #[serde(default)]
    pub exportV2: Option<String>, // exportV2=true 时使用新格式
}

/// 发布配置请求（Nacos API 格式）
#[derive(Debug, Deserialize)]
pub struct PublishConfigForm {
    pub dataId: String,
    pub group: String,
    #[serde(default)]
    pub tenant: String,
    pub content: String,
    #[serde(default)]
    pub appName: Option<String>,
    #[serde(default)]
    pub src_user: Option<String>,
    #[serde(default)]
    pub config_tags: Option<String>,
    #[serde(default)]
    pub desc: Option<String>,
    #[serde(default, rename = "use")]
    pub use_field: Option<String>,
    #[serde(default)]
    pub effect: Option<String>,
    #[serde(default)]
    pub r#type: Option<String>,
    #[serde(default)]
    pub schema: Option<String>,
    #[serde(default)]
    pub encryptedDataKey: Option<String>,
}

/// 删除配置参数
#[derive(Debug, Deserialize)]
pub struct DeleteConfigParams {
    pub dataId: String,
    pub group: String,
    #[serde(default)]
    pub tenant: String,
    #[serde(default)]
    pub beta: Option<String>, // beta=true 时删除 Beta 配置
}

/// 配置历史查询参数
#[derive(Debug, Deserialize)]
pub struct ConfigHistoryParams {
    pub dataId: String,
    pub group: String,
    #[serde(default)]
    pub tenant: String,
    #[serde(default)]
    pub pageNo: Option<i64>,
    #[serde(default)]
    pub pageSize: Option<i64>,
}

/// 监听配置参数
#[derive(Debug, Deserialize)]
pub struct ListenConfigParams {
    #[serde(rename = "Listening-Configs")]
    pub listening_configs: String, // URL 编码的配置列表
}

/// 查询监听者列表参数
#[derive(Debug, Deserialize)]
pub struct ListListenersParams {
    pub dataId: String,
    pub group: String,
    #[serde(default)]
    pub tenant: String,
    #[serde(default)]
    pub sampleTime: Option<i64>, // 采样时间，默认 1
}

/// Console API 查询监听者列表参数（按配置查询）
#[derive(Debug, Deserialize)]
pub struct ConsoleListListenersByConfigParams {
    pub dataId: String,
    pub groupName: String,
    #[serde(default)]
    pub namespaceId: String,
}

/// Console API 查询监听者列表参数（按 IP 查询）
#[derive(Debug, Deserialize)]
pub struct ConsoleListListenersByIpParams {
    pub ip: String,
    #[serde(default)]
    pub namespaceId: String,
}

/// Console API 配置回滚参数
#[derive(Debug, Deserialize)]
pub struct ConsoleRollbackConfigParams {
    pub dataId: String,
    pub groupName: String,
    pub nid: String, // 历史版本 ID
    #[serde(default)]
    pub namespaceId: String,
}

/// 配置监听状态
#[derive(Debug, Clone)]
struct ConfigListenState {
    data_id: String,
    group: String,
    tenant: String,
    md5: String,
}

/// 解析 Listening-Configs 参数
/// 格式：dataId^2group^2tenant^1md5^1dataId^2group^2tenant^1md5^1...
fn parse_listening_configs(listening_configs: &str) -> Result<Vec<ConfigListenState>, String> {
    // URL 解码
    let decoded = url_decode(listening_configs)
        .map_err(|_| "Failed to decode Listening-Configs".to_string())?;
    
    let mut configs = Vec::new();
    let parts: Vec<&str> = decoded.split('^').collect();
    
    // 每 4 个部分为一组：dataId, group, tenant, md5
    let mut i = 0;
    while i + 3 < parts.len() {
        let data_id = parts[i].to_string();
        let group = parts[i + 1].to_string();
        let tenant = parts[i + 2].to_string();
        let md5 = parts[i + 3].to_string();
        
        configs.push(ConfigListenState {
            data_id,
            group,
            tenant,
            md5,
        });
        
        i += 4;
    }
    
    Ok(configs)
}

/// 比较配置 MD5，返回变更的配置列表
async fn compare_config_md5(
    app: &Arc<AppHandle>,
    client_configs: &[ConfigListenState],
) -> Vec<ConfigListenState> {
    let mut changed_configs = Vec::new();
    
    for client_config in client_configs {
        // 处理命名空间
        let tenant_id = if client_config.tenant.is_empty() {
            "public".to_string()
        } else {
            client_config.tenant.clone()
        };
        
        // 查询服务端配置
        if let Ok(Some(server_config)) = get_config_detail(
            app,
            &client_config.data_id,
            &client_config.group,
            &tenant_id,
        ).await {
            // 比较 MD5
            if let Some(server_md5) = &server_config.md5 {
                if server_md5 != &client_config.md5 {
                    // MD5 不匹配，配置已变更
                    changed_configs.push(client_config.clone());
                }
            } else {
                // 服务端没有 MD5，可能配置不存在或已删除
                if !client_config.md5.is_empty() {
                    changed_configs.push(client_config.clone());
                }
            }
        } else {
            // 配置不存在，如果客户端有 MD5，说明配置被删除了
            if !client_config.md5.is_empty() {
                changed_configs.push(client_config.clone());
            }
        }
    }
    
    changed_configs
}

/// 格式化配置变更响应
/// 格式：dataId^2group^2tenant^1md5^1...
fn format_changed_configs(changed_configs: &[ConfigListenState]) -> String {
    let mut result = String::new();
    for config in changed_configs {
        if !result.is_empty() {
            result.push('^');
        }
        result.push_str(&format!("{}^2{}^2{}^1{}^1", 
            config.data_id, 
            config.group, 
            config.tenant,
            config.md5
        ));
    }
    result
}

/// 记录订阅者信息
async fn record_subscriber(
    app: &Arc<AppHandle>,
    data_id: &str,
    group_id: &str,
    tenant_id: &str,
    client_ip: &str,
    client_port: Option<i32>,
    user_agent: Option<&str>,
    app_name: Option<&str>,
    md5: &str,
) -> Result<(), String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let current_time = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    // 使用 INSERT OR REPLACE 来更新或插入订阅者信息
    db.execute(
        "INSERT OR REPLACE INTO subscribers (data_id, group_id, tenant_id, client_ip, client_port, user_agent, app_name, md5, last_poll_time, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, COALESCE((SELECT created_at FROM subscribers WHERE data_id = ?1 AND group_id = ?2 AND tenant_id = ?3 AND client_ip = ?4 AND client_port = ?5), ?9))",
        &[
            ("?1", data_id),
            ("?2", group_id),
            ("?3", tenant_id),
            ("?4", client_ip),
            ("?5", &client_port.map(|p| p.to_string()).unwrap_or_default()),
            ("?6", user_agent.unwrap_or("")),
            ("?7", app_name.unwrap_or("")),
            ("?8", md5),
            ("?9", &current_time.to_string()),
        ],
    )
    .await
    .map_err(|e| format!("Failed to record subscriber: {}", e))?;

    Ok(())
}

/// 获取配置
/// GET /nacos/v1/cs/configs
/// 必需参数: dataId, group（当 search 参数不存在时）
/// 可选参数: tenant（命名空间，默认空字符串）、show（show=all 时返回详细信息）、search（accurate/blur）
/// 响应: 
///   - 默认：直接返回配置内容（text/plain）
///   - show=all：返回 JSON 格式的配置详细信息
///   - search=accurate/blur：返回配置列表（JSON 格式）
pub async fn get_config(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<GetConfigParams>,
) -> Result<Response, axum::http::StatusCode> {
    // 如果存在 export=true 或 exportV2=true 参数，执行导出
    if params.export.as_deref() == Some("true") || params.exportV2.as_deref() == Some("true") {
        use crate::config::get_configs_for_export;
        
        // 处理命名空间
        let tenant_id = if params.tenant.is_empty() {
            Some("public")
        } else {
            Some(params.tenant.as_str())
        };

        // 解析 IDs
        let ids: Option<Vec<i64>> = params.ids.as_ref().map(|ids_str| {
            ids_str
                .split(',')
                .filter_map(|s| s.trim().parse::<i64>().ok())
                .collect()
        });

        match get_configs_for_export(
            &app,
            params.dataId.as_deref(),
            params.group.as_deref(),
            tenant_id,
            params.appName.as_deref(),
            ids.as_deref(),
        )
        .await
        {
            Ok(configs) => {
                // 创建 ZIP 文件
                let mut zip_buffer = Vec::new();
                {
                    use std::io::Write;
                    use zip::write::{FileOptions, ZipWriter};
                    use zip::CompressionMethod;
                    
                    let mut zip = ZipWriter::new(std::io::Cursor::new(&mut zip_buffer));
                    let options = FileOptions::default()
                        .compression_method(CompressionMethod::Deflated);

                    // 添加配置文件
                    for config in &configs {
                        let file_name = format!("{}+{}", config.group_id, config.data_id);
                        if let Err(_) = zip.start_file(&file_name, options) {
                            return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
                        }
                        if let Err(_) = zip.write_all(config.content.as_bytes()) {
                            return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
                        }
                    }

                    // 添加元数据文件
                    let is_v2 = params.exportV2.as_deref() == Some("true");
                    if is_v2 {
                        // V2 格式：使用 YAML 格式的 metadata.yml
                        use yaml_rust::{Yaml, YamlEmitter};
                        let mut metadata = yaml_rust::yaml::Hash::new();
                        let mut metadata_items = Vec::new();
                        
                        for config in &configs {
                            let mut item = yaml_rust::yaml::Hash::new();
                            item.insert(
                                Yaml::String("dataId".to_string()),
                                Yaml::String(config.data_id.clone()),
                            );
                            item.insert(
                                Yaml::String("group".to_string()),
                                Yaml::String(config.group_id.clone()),
                            );
                            if let Some(ref app_name) = config.app_name {
                                item.insert(
                                    Yaml::String("appName".to_string()),
                                    Yaml::String(app_name.clone()),
                                );
                            }
                            if let Some(ref desc) = config.c_desc {
                                item.insert(
                                    Yaml::String("desc".to_string()),
                                    Yaml::String(desc.clone()),
                                );
                            }
                            if let Some(ref r#type) = config.r#type {
                                item.insert(
                                    Yaml::String("type".to_string()),
                                    Yaml::String(r#type.clone()),
                                );
                            }
                            metadata_items.push(Yaml::Hash(item));
                        }
                        metadata.insert(
                            Yaml::String("metadata".to_string()),
                            Yaml::Array(metadata_items),
                        );
                        
                        let mut yaml_string = String::new();
                        let mut emitter = YamlEmitter::new(&mut yaml_string);
                        if emitter.dump(&Yaml::Hash(metadata)).is_err() {
                            return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
                        }
                        
                        if let Err(_) = zip.start_file("metadata.yml", options) {
                            return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
                        }
                        if let Err(_) = zip.write_all(yaml_string.as_bytes()) {
                            return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
                        }
                    } else {
                        // V1 格式：使用简单的 metadata 文件
                        let mut metadata_content = String::new();
                        for config in &configs {
                            if let Some(ref app_name) = config.app_name {
                                let mut meta_data_id = config.data_id.clone();
                                if meta_data_id.contains('.') {
                                    if let Some(last_dot) = meta_data_id.rfind('.') {
                                        meta_data_id = format!(
                                            "{}~{}",
                                            &meta_data_id[..last_dot],
                                            &meta_data_id[last_dot + 1..]
                                        );
                                    }
                                }
                                metadata_content.push_str(&format!(
                                    "{}.{}.app={}\r\n",
                                    config.group_id, meta_data_id, app_name
                                ));
                            }
                        }
                        if !metadata_content.is_empty() {
                            if let Err(_) = zip.start_file("metadata", options) {
                                return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
                            }
                            if let Err(_) = zip.write_all(metadata_content.as_bytes()) {
                                return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
                            }
                        }
                    }

                    if zip.finish().is_err() {
                        return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
                    }
                }

                // 生成文件名
                use chrono::Local;
                let timestamp = Local::now().format("%Y%m%d_%H%M%S");
                let file_name = format!("nacos_config_export_{}.zip", timestamp);

                Ok(Response::builder()
                    .status(axum::http::StatusCode::OK)
                    .header("Content-Type", "application/zip")
                    .header("Content-Disposition", format!("attachment;filename={}", file_name))
                    .body(axum::body::Body::from(zip_buffer))
                    .unwrap())
            }
            Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
        }
    }
    // 如果存在 beta=true 参数，查询 Beta 配置
    else if params.beta.as_deref() == Some("true") {
        use crate::config::get_beta_config;
        
        // 需要 dataId 和 group
        let data_id = params.dataId.ok_or(axum::http::StatusCode::BAD_REQUEST)?;
        let group = params.group.ok_or(axum::http::StatusCode::BAD_REQUEST)?;
        
        // 处理命名空间
        let tenant_id = if params.tenant.is_empty() {
            "public".to_string()
        } else {
            params.tenant
        };

        match get_beta_config(&app, &data_id, &group, &tenant_id).await {
            Ok(Some(beta_config)) => {
                use serde_json::json;
                let json_body = json!({
                    "id": beta_config.id,
                    "dataId": beta_config.data_id,
                    "group": beta_config.group_id,
                    "tenant": beta_config.tenant_id,
                    "appName": beta_config.app_name,
                    "content": beta_config.content,
                    "betaIps": beta_config.beta_ips,
                    "md5": beta_config.md5,
                    "gmtCreate": beta_config.gmt_create,
                    "gmtModified": beta_config.gmt_modified,
                    "srcUser": beta_config.src_user,
                    "srcIp": beta_config.src_ip,
                    "encryptedDataKey": beta_config.encrypted_data_key,
                });
                Ok(Response::builder()
                    .status(axum::http::StatusCode::OK)
                    .header("Content-Type", "application/json;charset=UTF-8")
                    .body(axum::body::Body::from(serde_json::to_string(&json_body).unwrap()))
                    .unwrap())
            }
            Ok(None) => Err(axum::http::StatusCode::NOT_FOUND),
            Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
        }
    }
    // 如果存在 search 参数，执行搜索
    else if let Some(search_type) = &params.search {
        use crate::config::{ConfigQueryParams, get_config_list};
        
        // 处理命名空间
        let tenant_id = if params.tenant.is_empty() {
            "public".to_string()
        } else {
            params.tenant
        };

        // 构建查询参数
        let query_params = ConfigQueryParams {
            data_id: params.dataId,
            group_id: params.group,
            tenant_id: Some(tenant_id),
            page_no: params.pageNo,
            page_size: params.pageSize,
        };

        match get_config_list(&app, query_params).await {
            Ok(result) => {
                let json_body = serde_json::to_string(&result).unwrap();
                Ok(Response::builder()
                    .status(axum::http::StatusCode::OK)
                    .header("Content-Type", "application/json;charset=UTF-8")
                    .body(axum::body::Body::from(json_body))
                    .unwrap())
            }
            Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
        }
    } else {
        // 默认行为：获取单个配置
        // 需要 dataId 和 group
        let data_id = params.dataId.ok_or(axum::http::StatusCode::BAD_REQUEST)?;
        let group = params.group.ok_or(axum::http::StatusCode::BAD_REQUEST)?;
        
        // 处理命名空间（空字符串表示 public）
        let tenant_id = if params.tenant.is_empty() {
            "public".to_string()
        } else {
            params.tenant
        };

        match get_config_detail(&app, &data_id, &group, &tenant_id).await {
        Ok(Some(config)) => {
            // 如果 show=all，返回 JSON 格式的详细信息
            if params.show.as_deref() == Some("all") {
                use serde_json::json;
                let json_body = json!({
                    "id": config.id,
                    "dataId": config.data_id,
                    "group": config.group_id,
                    "tenant": config.tenant_id,
                    "appName": config.app_name,
                    "content": config.content,
                    "md5": config.md5,
                    "gmtCreate": config.gmt_create,
                    "gmtModified": config.gmt_modified,
                    "srcUser": config.src_user,
                    "srcIp": config.src_ip,
                    "cDesc": config.c_desc,
                    "cUse": config.c_use,
                    "effect": config.effect,
                    "type": config.r#type,
                    "cSchema": config.c_schema,
                    "encryptedDataKey": config.encrypted_data_key,
                });
                Ok(Response::builder()
                    .status(axum::http::StatusCode::OK)
                    .header("Content-Type", "application/json;charset=UTF-8")
                    .body(axum::body::Body::from(serde_json::to_string(&json_body).unwrap()))
                    .unwrap())
            } else {
                // 默认返回配置内容（text/plain）
                Ok(Response::builder()
                    .status(axum::http::StatusCode::OK)
                    .header("Content-Type", "text/plain;charset=UTF-8")
                    .body(axum::body::Body::from(config.content))
                    .unwrap())
            }
        }
        Ok(None) => Err(axum::http::StatusCode::NOT_FOUND),
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 发布配置
/// POST /nacos/v1/cs/configs
/// 必需参数: dataId, group, content
/// 可选参数: tenant, appName, src_user, config_tags, desc, use, effect, type, schema, encryptedDataKey
/// 响应: true（成功）或 false（失败）
/// 注意：Nacos Client 使用表单数据（application/x-www-form-urlencoded）
pub async fn publish_config(
    State(app): State<Arc<AppHandle>>,
    Form(config_data): Form<PublishConfigForm>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // 处理命名空间
    let tenant_id = if config_data.tenant.is_empty() {
        "public".to_string()
    } else {
        config_data.tenant
    };

    // 构建创建/更新请求
    let request = CreateConfigRequest {
        data_id: config_data.dataId,
        group_id: config_data.group,
        tenant_id,
        content: config_data.content,
        app_name: config_data.appName,
        c_desc: config_data.desc,
        c_use: config_data.use_field,
        effect: config_data.effect,
        r#type: config_data.r#type,
        c_schema: config_data.schema,
        encrypted_data_key: config_data.encryptedDataKey,
    };

    // 先尝试获取现有配置
    let existing = get_config_detail(
        &app,
        &request.data_id,
        &request.group_id,
        &request.tenant_id,
    )
    .await
    .ok()
    .flatten();

    let result = if existing.is_some() {
        // 更新现有配置
        let update_request = UpdateConfigRequest {
            data_id: request.data_id.clone(),
            group_id: request.group_id.clone(),
            tenant_id: request.tenant_id.clone(),
            content: request.content.clone(),
            app_name: request.app_name.clone(),
            c_desc: request.c_desc.clone(),
            c_use: request.c_use.clone(),
            effect: request.effect.clone(),
            r#type: request.r#type.clone(),
            c_schema: request.c_schema.clone(),
            encrypted_data_key: request.encrypted_data_key.clone(),
        };
        update_config(&app, update_request, config_data.src_user.clone(), None).await
    } else {
        // 创建新配置
        create_config(&app, request, config_data.src_user.clone(), None).await
    };

    match result {
        Ok(_) => Ok(Json(serde_json::json!(true))),
        Err(_) => Ok(Json(serde_json::json!(false))),
    }
}

/// 删除配置
/// DELETE /nacos/v1/cs/configs
/// 必需参数: dataId, group
/// 可选参数: tenant
/// 响应: true（成功）或 false（失败）
pub async fn delete_config_handler(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<DeleteConfigParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // 如果存在 beta=true 参数，删除 Beta 配置
    if params.beta.as_deref() == Some("true") {
        use crate::config::delete_beta_config;
        
        // 处理命名空间
        let tenant_id = if params.tenant.is_empty() {
            "public".to_string()
        } else {
            params.tenant
        };

        match delete_beta_config(&app, &params.dataId, &params.group, &tenant_id).await {
            Ok(_) => Ok(Json(serde_json::json!(true))),
            Err(_) => Ok(Json(serde_json::json!(false))),
        }
    } else {
        // 默认行为：删除普通配置
        // 处理命名空间
        let tenant_id = if params.tenant.is_empty() {
            "public".to_string()
        } else {
            params.tenant
        };

        match delete_config(&app, &params.dataId, &params.group, &tenant_id, None, None).await {
            Ok(_) => Ok(Json(serde_json::json!(true))),
            Err(_) => Ok(Json(serde_json::json!(false))),
        }
    }
}

/// 监听配置变更（长轮询）
/// POST /nacos/v1/cs/configs/listener
/// 必需参数: Listening-Configs（URL 编码的配置列表）
/// 请求头: Long-Pulling-Timeout（可选，默认 30000ms）
/// 响应: 配置变更列表（文本格式）或空响应（无变更）
pub async fn listen_config(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<ListenConfigParams>,
    headers: axum::http::HeaderMap,
) -> Result<Response, axum::http::StatusCode> {
    // 解析 Listening-Configs 参数
    let client_configs = parse_listening_configs(&params.listening_configs)
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
    
    if client_configs.is_empty() {
        return Err(axum::http::StatusCode::BAD_REQUEST);
    }
    
    // 获取客户端 IP（从请求头）
    let client_ip = headers
        .get("X-Forwarded-For")
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.split(',').next())
        .unwrap_or("127.0.0.1")
        .trim()
        .to_string();
    
    let user_agent = headers
        .get("User-Agent")
        .and_then(|h| h.to_str().ok());
    
    // 记录订阅者信息
    for config in &client_configs {
        let tenant_id = if config.tenant.is_empty() {
            "public".to_string()
        } else {
            config.tenant.clone()
        };
        
        let _ = record_subscriber(
            &app,
            &config.data_id,
            &config.group,
            &tenant_id,
            &client_ip,
            None,
            user_agent,
            None,
            &config.md5,
        ).await;
    }
    
    // 获取超时时间（默认 30 秒）
    let timeout_ms = headers
        .get("Long-Pulling-Timeout")
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(30000);
    
    let timeout = Duration::from_millis(timeout_ms.min(30000)); // 最多 30 秒
    
    // 立即检查一次配置变更
    let changed_configs = compare_config_md5(&app, &client_configs).await;
    
    if !changed_configs.is_empty() {
        // 有变更，立即返回
        let response_text = format_changed_configs(&changed_configs);
        return Ok(Response::builder()
            .status(axum::http::StatusCode::OK)
            .header("Pragma", "no-cache")
            .header("Expires", "0")
            .header("Cache-Control", "no-cache,no-store")
            .header("Content-Type", "text/plain;charset=UTF-8")
            .body(axum::body::Body::from(response_text))
            .unwrap());
    }
    
    // 没有变更，进行长轮询
    let start_time = std::time::Instant::now();
    let check_interval = Duration::from_millis(500); // 每 500ms 检查一次
    
    while start_time.elapsed() < timeout {
        tokio::time::sleep(check_interval).await;
        
        // 再次检查配置变更
        let changed_configs = compare_config_md5(&app, &client_configs).await;
        
        if !changed_configs.is_empty() {
            // 有变更，立即返回
            let response_text = format_changed_configs(&changed_configs);
            return Ok(Response::builder()
                .status(axum::http::StatusCode::OK)
                .header("Pragma", "no-cache")
                .header("Expires", "0")
                .header("Cache-Control", "no-cache,no-store")
                .header("Content-Type", "text/plain;charset=UTF-8")
                .body(axum::body::Body::from(response_text))
                .unwrap());
        }
        
        // 检查是否超时
        if start_time.elapsed() >= timeout {
            break;
        }
    }
    
    // 超时，返回空响应
    Ok(Response::builder()
        .status(axum::http::StatusCode::OK)
        .header("Pragma", "no-cache")
        .header("Expires", "0")
        .header("Cache-Control", "no-cache,no-store")
        .body(axum::body::Body::from(""))
        .unwrap())
}

/// 查询配置监听者列表
/// GET /nacos/v1/cs/configs/listener
/// 必需参数: dataId, group
/// 可选参数: tenant, sampleTime
/// 响应: 监听者状态信息（JSON 格式）
pub async fn list_listeners(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<ListListenersParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // 处理命名空间
    let tenant_id = if params.tenant.is_empty() {
        "public".to_string()
    } else {
        params.tenant
    };

    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    // 查询订阅者 ID 列表
    let subscriber_ids: Vec<(i64,)> = db
        .query(
            "SELECT id FROM subscribers WHERE data_id = ?1 AND group_id = ?2 AND tenant_id = ?3 ORDER BY last_poll_time DESC",
            &[
                ("?1", &params.dataId),
                ("?2", &params.group),
                ("?3", &tenant_id),
            ],
        )
        .await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    // 逐个查询订阅者详情
    let mut listeners = Vec::new();
    for (id,) in subscriber_ids {
        let subscriber: Option<(String, Option<i32>, Option<String>, Option<String>, Option<String>, i64)> = db
            .query_one(
                "SELECT client_ip, client_port, user_agent, app_name, md5, last_poll_time FROM subscribers WHERE id = ?1",
                &[("?1", &id.to_string())],
            )
            .await
            .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

        if let Some((ip, port, user_agent, app_name, md5, last_poll_time)) = subscriber {
            listeners.push(serde_json::json!({
                "ip": ip,
                "port": port.unwrap_or(0),
                "userAgent": user_agent.as_deref().unwrap_or(""),
                "appName": app_name.as_deref().unwrap_or(""),
                "md5": md5.as_deref().unwrap_or(""),
                "lastPollTime": last_poll_time
            }));
        }
    }

    Ok(Json(serde_json::json!({
        "collectors": [],
        "listeners": listeners
    })))
}

/// Console API：按配置查询监听者列表
/// GET /nacos/v3/console/cs/config/listener
/// 必需参数: dataId, groupName
/// 可选参数: namespaceId
/// 响应: { listenersStatus: { [ip]: md5 } }
pub async fn console_list_listeners_by_config(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<ConsoleListListenersByConfigParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // 处理命名空间
    let tenant_id = if params.namespaceId.is_empty() {
        "public".to_string()
    } else {
        params.namespaceId
    };

    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    // 查询订阅者列表
    let subscribers: Vec<(String, Option<String>)> = db
        .query(
            "SELECT client_ip, md5 FROM subscribers WHERE data_id = ?1 AND group_id = ?2 AND tenant_id = ?3 ORDER BY last_poll_time DESC",
            &[
                ("?1", &params.dataId),
                ("?2", &params.groupName),
                ("?3", &tenant_id),
            ],
        )
        .await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    // 构建 listenersStatus 对象：{ [ip]: md5 }
    let mut listeners_status = serde_json::Map::new();
    for (ip, md5) in subscribers {
        if let Some(md5_value) = md5 {
            listeners_status.insert(ip, serde_json::Value::String(md5_value));
        }
    }

    Ok(Json(serde_json::json!({
        "listenersStatus": listeners_status
    })))
}

/// Console API：按 IP 查询监听者列表
/// GET /nacos/v3/console/cs/config/listener/ip
/// 必需参数: ip
/// 可选参数: namespaceId
/// 响应: { listenersStatus: { [dataId+group]: md5 } }
pub async fn console_list_listeners_by_ip(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<ConsoleListListenersByIpParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // 处理命名空间
    let tenant_id = if params.namespaceId.is_empty() {
        "public".to_string()
    } else {
        params.namespaceId
    };

    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    // 查询订阅者列表
    let subscribers: Vec<(String, String, Option<String>)> = db
        .query(
            "SELECT data_id, group_id, md5 FROM subscribers WHERE client_ip = ?1 AND tenant_id = ?2 ORDER BY last_poll_time DESC",
            &[
                ("?1", &params.ip),
                ("?2", &tenant_id),
            ],
        )
        .await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    // 构建 listenersStatus 对象：{ [dataId+group]: md5 }
    let mut listeners_status = serde_json::Map::new();
    for (data_id, group_id, md5) in subscribers {
        let key = format!("{}+{}", data_id, group_id);
        if let Some(md5_value) = md5 {
            listeners_status.insert(key, serde_json::Value::String(md5_value));
        }
    }

    Ok(Json(serde_json::json!({
        "listenersStatus": listeners_status
    })))
}

/// Console API：回滚配置到指定历史版本
/// POST /nacos/v3/console/cs/config/rollback
/// 必需参数: dataId, groupName, nid
/// 可选参数: namespaceId
/// 响应: { code: 0, message: "Rollback successful" } 或错误信息
pub async fn console_rollback_config(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<ConsoleRollbackConfigParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    use crate::config::rollback_config;
    
    // 处理命名空间
    let tenant_id = if params.namespaceId.is_empty() {
        "public".to_string()
    } else {
        params.namespaceId
    };

    // 解析历史版本 ID
    let nid = params.nid.parse::<i64>()
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;

    // 获取当前用户（从请求头或使用默认值）
    let src_user = None; // 可以从请求头获取
    let src_ip = None; // 可以从请求头获取

    // 执行回滚
    match rollback_config(&app, &params.dataId, &params.groupName, &tenant_id, nid, src_user, src_ip).await {
        Ok(config_info) => {
            // 检查是否是删除操作的回滚（内容为空）
            if config_info.content.is_empty() {
                Ok(Json(serde_json::json!({
                    "code": 0,
                    "message": "Rollback successful (config deleted)"
                })))
            } else {
                Ok(Json(serde_json::json!({
                    "code": 0,
                    "message": "Rollback successful"
                })))
            }
        }
        Err(e) => {
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// 查询配置历史记录
/// GET /nacos/v1/cs/history
/// 必需参数: dataId, group
/// 可选参数: tenant, pageNo, pageSize
/// 响应: 历史记录列表（JSON 格式）
pub async fn get_history(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<ConfigHistoryParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // 处理命名空间
    let tenant_id = if params.tenant.is_empty() {
        "public".to_string()
    } else {
        params.tenant
    };

    match get_config_history(
        &app,
        &params.dataId,
        &params.group,
        &tenant_id,
        params.pageNo,
        params.pageSize,
    )
    .await
    {
        Ok(history) => Ok(Json(serde_json::to_value(history).unwrap())),
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 查询配置历史上一版本参数
#[derive(Debug, Deserialize)]
pub struct ConfigHistoryPreviousParams {
    pub id: String, // 当前历史版本 ID (nid)
    pub dataId: String,
    pub group: String,
    #[serde(default)]
    pub tenant: String,
}

/// 查询配置上一版本信息
/// GET /nacos/v1/cs/history/previous
/// 必需参数: id, dataId, group
/// 可选参数: tenant
/// 响应: 上一版本历史记录（JSON 格式）
pub async fn get_history_previous(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<ConfigHistoryPreviousParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    use crate::config::get_config_history_previous;
    
    // 处理命名空间
    let tenant_id = if params.tenant.is_empty() {
        "public".to_string()
    } else {
        params.tenant
    };

    // 解析历史版本 ID
    let current_id = params.id.parse::<i64>()
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;

    match get_config_history_previous(
        &app,
        &params.dataId,
        &params.group,
        &tenant_id,
        current_id,
    )
    .await
    {
        Ok(Some(history)) => {
            // 转换为 Nacos API 格式
            // SQLite 存储的是秒级时间戳，需要转换为毫秒
            let created_time = chrono::DateTime::from_timestamp(history.gmt_create, 0)
                .unwrap_or_default()
                .format("%Y-%m-%dT%H:%M:%S%.3f%z")
                .to_string();
            let modified_time = chrono::DateTime::from_timestamp(history.gmt_modified, 0)
                .unwrap_or_default()
                .format("%Y-%m-%dT%H:%M:%S%.3f%z")
                .to_string();
            
            let response = serde_json::json!({
                "id": history.nid.to_string(),
                "lastId": -1, // Nacos 标准格式，上一版本没有 lastId
                "dataId": history.data_id,
                "group": history.group_id,
                "tenant": history.tenant_id,
                "appName": history.app_name.unwrap_or_default(),
                "md5": history.md5,
                "content": history.content,
                "srcIp": history.src_ip.unwrap_or_default(),
                "srcUser": history.src_user,
                "opType": history.op_type.unwrap_or_default(),
                "createdTime": created_time,
                "lastModifiedTime": modified_time,
            });
            Ok(Json(response))
        }
        Ok(None) => Err(axum::http::StatusCode::NOT_FOUND),
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 精确搜索配置
/// GET /nacos/v1/cs/configs?search=accurate
/// 参数: dataId, group, tenant, appName, config_tags, pageNo, pageSize
/// 响应: 配置列表（JSON 格式）
pub async fn search_config_accurate(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<ConsoleConfigQueryParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    use crate::config::{ConfigQueryParams, get_config_list};
    
    // 处理命名空间
    let tenant_id = if params.tenant.is_empty() {
        "public".to_string()
    } else {
        params.tenant
    };

    // 构建查询参数
    let query_params = ConfigQueryParams {
        data_id: params.dataId,
        group_id: params.group,
        tenant_id: Some(tenant_id),
        page_no: params.pageNo,
        page_size: params.pageSize,
    };

    match get_config_list(&app, query_params).await {
        Ok(result) => Ok(Json(serde_json::to_value(result).unwrap())),
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 模糊搜索配置
/// GET /nacos/v1/cs/configs?search=blur
/// 参数: dataId, group, tenant, appName, config_tags, config_detail, types, pageNo, pageSize
/// 响应: 配置列表（JSON 格式）
pub async fn search_config_blur(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<ConsoleConfigQueryParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    use crate::config::{ConfigQueryParams, get_config_list};
    
    // 处理命名空间
    let tenant_id = if params.tenant.is_empty() {
        "public".to_string()
    } else {
        params.tenant
    };

    // 构建查询参数（模糊搜索使用 LIKE 查询）
    // 注意：当前实现使用精确匹配，实际应该使用 LIKE 进行模糊匹配
    // 这里先使用精确匹配，后续可以优化为真正的模糊搜索
    let query_params = ConfigQueryParams {
        data_id: params.dataId,
        group_id: params.group,
        tenant_id: Some(tenant_id),
        page_no: params.pageNo,
        page_size: params.pageSize,
    };

    match get_config_list(&app, query_params).await {
        Ok(result) => Ok(Json(serde_json::to_value(result).unwrap())),
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 获取配置高级信息（Catalog）
/// GET /nacos/v1/cs/configs/catalog
/// 参数: dataId, group, tenant
/// 响应: 配置的高级信息（JSON 格式）
pub async fn get_config_catalog(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<GetConfigParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // 处理命名空间
    let tenant_id = if params.tenant.is_empty() {
        "public".to_string()
    } else {
        params.tenant
    };

    match get_config_detail(&app, &params.dataId.as_ref().unwrap(), &params.group.as_ref().unwrap(), &tenant_id).await {
        Ok(Some(config)) => {
            use serde_json::json;
            Ok(Json(json!({
                "dataId": config.data_id,
                "group": config.group_id,
                "tenant": config.tenant_id,
                "appName": config.app_name,
                "md5": config.md5,
                "gmtCreate": config.gmt_create,
                "gmtModified": config.gmt_modified,
                "cDesc": config.c_desc,
                "cUse": config.c_use,
                "effect": config.effect,
                "type": config.r#type,
                "cSchema": config.c_schema,
            })))
        }
        Ok(None) => Err(axum::http::StatusCode::NOT_FOUND),
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}


/// 导入配置查询参数
#[derive(Debug, Deserialize)]
pub struct ImportConfigParams {
    #[serde(default)]
    pub tenant: String,
    #[serde(default)]
    pub src_user: Option<String>,
    #[serde(default)]
    pub policy: Option<String>, // ABORT, SKIP, OVERWRITE
}

/// 导入配置
/// POST /nacos/v1/cs/configs?import=true
/// 参数: tenant, src_user, policy（ABORT/SKIP/OVERWRITE）
/// 请求体: multipart/form-data，包含 file 字段（ZIP 文件）
/// 响应: 导入结果（JSON 格式）
pub async fn import_config_handler(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<ImportConfigParams>,
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    use crate::config::{CreateConfigRequest, create_config, get_config_detail, update_config, UpdateConfigRequest};
    
    // 处理命名空间
    let tenant_id = if params.tenant.is_empty() {
        "public".to_string()
    } else {
        params.tenant
    };

    // 解析策略
    let policy = params.policy.as_deref().unwrap_or("ABORT");
    
    // 查找文件字段
    let mut file_data: Option<Vec<u8>> = None;
    while let Some(field) = multipart.next_field().await
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)? {
        if field.name() == Some("file") {
            let data = field.bytes().await
                .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
            file_data = Some(data.to_vec());
            break;
        }
    }

    let zip_data = file_data.ok_or(axum::http::StatusCode::BAD_REQUEST)?;

    // 解析 ZIP 文件
    use std::io::{Cursor, Read};
    use zip::ZipArchive;
    
    let cursor = Cursor::new(zip_data);
    let mut archive = ZipArchive::new(cursor)
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;

    // 查找元数据文件
    let mut metadata_content: Option<String> = None;
    let mut is_v2 = false;
    
    for i in 0..archive.len() {
        let mut file = archive.by_index(i)
            .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
        let file_name = file.name().to_string();
        
        if file_name == "metadata.yml" {
            is_v2 = true;
            let mut content = String::new();
            file.read_to_string(&mut content)
                .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
            metadata_content = Some(content);
            break;
        } else if file_name == "metadata" {
            let mut content = String::new();
            file.read_to_string(&mut content)
                .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
            metadata_content = Some(content);
            break;
        }
    }

    let metadata = metadata_content.ok_or(axum::http::StatusCode::BAD_REQUEST)?;

    // 解析元数据
    let mut configs_to_import = Vec::new();
    
    if is_v2 {
        // V2 格式：YAML 格式的 metadata.yml
        use yaml_rust::YamlLoader;
        let docs = YamlLoader::load_from_str(&metadata)
            .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
        
        if docs.is_empty() {
            return Err(axum::http::StatusCode::BAD_REQUEST);
        }
        
        let doc = &docs[0];
        if let Some(metadata_array) = doc["metadata"].as_vec() {
            for item in metadata_array {
                let data_id = item["dataId"].as_str()
                    .ok_or(axum::http::StatusCode::BAD_REQUEST)?;
                let group = item["group"].as_str()
                    .ok_or(axum::http::StatusCode::BAD_REQUEST)?;
                let app_name = item["appName"].as_str().map(|s| s.to_string());
                let desc = item["desc"].as_str().map(|s| s.to_string());
                let r#type = item["type"].as_str().map(|s| s.to_string());
                
                // 从 ZIP 文件中读取配置内容
                let file_name = format!("{}+{}", group, data_id);
                let mut content = String::new();
                let mut config_file = archive.by_name(&file_name)
                    .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
                config_file.read_to_string(&mut content)
                    .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
                
                configs_to_import.push((data_id.to_string(), group.to_string(), content, app_name, desc, r#type));
            }
        }
    } else {
        // V1 格式：简单的 metadata 文件
        // 解析 metadata 文件，提取 appName 映射
        let mut app_name_map = std::collections::HashMap::new();
        for line in metadata.lines() {
            if let Some((key, value)) = line.split_once(".app=") {
                let parts: Vec<&str> = key.split('.').collect();
                if parts.len() >= 2 {
                    let group = parts[0];
                    let mut data_id = parts[1..].join(".");
                    // 处理 ~ 替换为 .
                    data_id = data_id.replace('~', ".");
                    app_name_map.insert(format!("{}+{}", group, data_id), value.to_string());
                }
            }
        }
        
        // 遍历 ZIP 文件中的所有配置文件
        for i in 0..archive.len() {
            let mut file = archive.by_index(i)
                .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
            let file_name = file.name().to_string();
            
            // 跳过元数据文件
            if file_name == "metadata" || file_name == "metadata.yml" {
                continue;
            }
            
            // 解析文件名：{group}+{dataId}
            if let Some((group, data_id)) = file_name.split_once('+') {
                let mut content = String::new();
                file.read_to_string(&mut content)
                    .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
                
                let app_name = app_name_map.get(&file_name).cloned();
                configs_to_import.push((data_id.to_string(), group.to_string(), content, app_name, None, None));
            }
        }
    }

    if configs_to_import.is_empty() {
        return Ok(Json(serde_json::json!({
            "succCount": 0,
            "skipCount": 0,
            "failCount": 0,
            "failData": []
        })));
    }

    // 批量导入配置
    let mut succ_count = 0;
    let mut skip_count = 0;
    let mut fail_count = 0;
    let mut fail_data = Vec::new();

    for (data_id, group, content, app_name, desc, r#type) in configs_to_import {
        // 检查配置是否已存在
        let existing = get_config_detail(&app, &data_id, &group, &tenant_id).await.ok().flatten();
        
        match policy {
            "ABORT" => {
                if existing.is_some() {
                    // 终止导入
                    return Ok(Json(serde_json::json!({
                        "succCount": succ_count,
                        "skipCount": skip_count,
                        "failCount": fail_count + 1,
                        "failData": vec![serde_json::json!({
                            "dataId": data_id,
                            "group": group,
                            "reason": "配置已存在"
                        })]
                    })));
                }
            }
            "SKIP" => {
                if existing.is_some() {
                    skip_count += 1;
                    continue;
                }
            }
            "OVERWRITE" => {
                // 继续，会覆盖现有配置
            }
            _ => {
                fail_count += 1;
                fail_data.push(serde_json::json!({
                    "dataId": data_id,
                    "group": group,
                    "reason": format!("未知的策略: {}", policy)
                }));
                continue;
            }
        }

        // 创建或更新配置
        let request = CreateConfigRequest {
            data_id: data_id.clone(),
            group_id: group.clone(),
            tenant_id: tenant_id.clone(),
            content,
            app_name: app_name.clone(),
            c_desc: desc,
            c_use: None,
            effect: None,
            r#type,
            c_schema: None,
            encrypted_data_key: None,
        };

        let result = if existing.is_some() {
            // 更新现有配置
            let update_request = UpdateConfigRequest {
                data_id: request.data_id.clone(),
                group_id: request.group_id.clone(),
                tenant_id: request.tenant_id.clone(),
                content: request.content.clone(),
                app_name: request.app_name.clone(),
                c_desc: request.c_desc.clone(),
                c_use: request.c_use.clone(),
                effect: request.effect.clone(),
                r#type: request.r#type.clone(),
                c_schema: request.c_schema.clone(),
                encrypted_data_key: request.encrypted_data_key.clone(),
            };
            update_config(&app, update_request, params.src_user.clone(), None).await
        } else {
            // 创建新配置
            create_config(&app, request, params.src_user.clone(), None).await
        };

        match result {
            Ok(_) => {
                succ_count += 1;
            }
            Err(e) => {
                fail_count += 1;
                fail_data.push(serde_json::json!({
                    "dataId": data_id,
                    "group": group,
                    "reason": e
                }));
            }
        }
    }

    Ok(Json(serde_json::json!({
        "succCount": succ_count,
        "skipCount": skip_count,
        "failCount": fail_count,
        "failData": fail_data
    })))
}

/// 克隆配置请求体
#[derive(Debug, Deserialize)]
pub struct CloneConfigBean {
    pub cfgId: i64,
    pub dataId: Option<String>,
    pub group: Option<String>,
}

/// 克隆配置查询参数
#[derive(Debug, Deserialize)]
pub struct CloneConfigParams {
    pub tenant: String,
    #[serde(default)]
    pub src_user: Option<String>,
    #[serde(default)]
    pub policy: Option<String>, // ABORT, SKIP, OVERWRITE
}

/// 克隆配置
/// POST /nacos/v1/cs/configs?clone=true
/// 参数: tenant, src_user, policy（ABORT/SKIP/OVERWRITE）
/// 请求体: JSON 数组，包含 CloneConfigBean 列表
/// 响应: 克隆结果（JSON 格式）
pub async fn clone_config_handler(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<CloneConfigParams>,
    Json(config_beans): Json<Vec<CloneConfigBean>>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    use crate::config::{CreateConfigRequest, create_config, get_config_detail, update_config, UpdateConfigRequest, get_configs_for_export};
    
    // 处理命名空间
    let tenant_id = if params.tenant.is_empty() {
        "public".to_string()
    } else {
        params.tenant
    };

    // 解析策略
    let policy = params.policy.as_deref().unwrap_or("ABORT");
    
    if config_beans.is_empty() {
        return Ok(Json(serde_json::json!({
            "succCount": 0,
            "skipCount": 0,
            "failCount": 0,
            "failData": []
        })));
    }

    // 提取配置 ID 列表
    let ids: Vec<i64> = config_beans.iter().map(|b| b.cfgId).collect();
    
    // 创建 ID 到 Bean 的映射
    let mut config_beans_map = std::collections::HashMap::new();
    for bean in &config_beans {
        config_beans_map.insert(bean.cfgId, bean);
    }

    // 查询原始配置
    let original_configs = get_configs_for_export(
        &app,
        None,
        None,
        None,
        None,
        Some(&ids),
    )
    .await
    .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    if original_configs.is_empty() {
        return Ok(Json(serde_json::json!({
            "succCount": 0,
            "skipCount": 0,
            "failCount": 0,
            "failData": []
        })));
    }

    // 批量克隆配置
    let mut succ_count = 0;
    let mut skip_count = 0;
    let mut fail_count = 0;
    let mut fail_data = Vec::new();

    for original_config in original_configs {
        if let Some(id) = original_config.id {
            if let Some(bean) = config_beans_map.get(&id) {
                // 使用目标 dataId 和 group，如果没有提供则使用原始的
                let target_data_id = bean.dataId.as_deref()
                    .unwrap_or(&original_config.data_id)
                    .to_string();
                let target_group = bean.group.as_deref()
                    .unwrap_or(&original_config.group_id)
                    .to_string();

                // 检查目标配置是否已存在
                let existing = get_config_detail(&app, &target_data_id, &target_group, &tenant_id).await.ok().flatten();
                
                match policy {
                    "ABORT" => {
                        if existing.is_some() {
                            // 终止克隆
                            return Ok(Json(serde_json::json!({
                                "succCount": succ_count,
                                "skipCount": skip_count,
                                "failCount": fail_count + 1,
                                "failData": vec![serde_json::json!({
                                    "dataId": target_data_id,
                                    "group": target_group,
                                    "reason": "配置已存在"
                                })]
                            })));
                        }
                    }
                    "SKIP" => {
                        if existing.is_some() {
                            skip_count += 1;
                            continue;
                        }
                    }
                    "OVERWRITE" => {
                        // 继续，会覆盖现有配置
                    }
                    _ => {
                        fail_count += 1;
                        fail_data.push(serde_json::json!({
                            "dataId": target_data_id,
                            "group": target_group,
                            "reason": format!("未知的策略: {}", policy)
                        }));
                        continue;
                    }
                }

                // 创建或更新配置
                let request = CreateConfigRequest {
                    data_id: target_data_id.clone(),
                    group_id: target_group.clone(),
                    tenant_id: tenant_id.clone(),
                    content: original_config.content.clone(),
                    app_name: original_config.app_name.clone(),
                    c_desc: original_config.c_desc.clone(),
                    c_use: original_config.c_use.clone(),
                    effect: original_config.effect.clone(),
                    r#type: original_config.r#type.clone(),
                    c_schema: original_config.c_schema.clone(),
                    encrypted_data_key: original_config.encrypted_data_key.clone(),
                };

                let result = if existing.is_some() {
                    // 更新现有配置
                    let update_request = UpdateConfigRequest {
                        data_id: request.data_id.clone(),
                        group_id: request.group_id.clone(),
                        tenant_id: request.tenant_id.clone(),
                        content: request.content.clone(),
                        app_name: request.app_name.clone(),
                        c_desc: request.c_desc.clone(),
                        c_use: request.c_use.clone(),
                        effect: request.effect.clone(),
                        r#type: request.r#type.clone(),
                        c_schema: request.c_schema.clone(),
                        encrypted_data_key: request.encrypted_data_key.clone(),
                    };
                    update_config(&app, update_request, params.src_user.clone(), None).await
                } else {
                    // 创建新配置
                    create_config(&app, request, params.src_user.clone(), None).await
                };

                match result {
                    Ok(_) => {
                        succ_count += 1;
                    }
                    Err(e) => {
                        fail_count += 1;
                        fail_data.push(serde_json::json!({
                            "dataId": target_data_id,
                            "group": target_group,
                            "reason": e
                        }));
                    }
                }
            }
        }
    }

    Ok(Json(serde_json::json!({
        "succCount": succ_count,
        "skipCount": skip_count,
        "failCount": fail_count,
        "failData": fail_data
    })))
}

/// 处理导入或克隆配置（根据查询参数）
/// POST /nacos/v1/cs/configs?import=true 或 POST /nacos/v1/cs/configs?clone=true
/// 这个函数根据查询参数和 Content-Type 选择调用导入或克隆处理器
pub async fn import_or_clone_config(
    State(app): State<Arc<AppHandle>>,
    Query(query_params): Query<std::collections::HashMap<String, String>>,
    request: axum::http::Request<axum::body::Body>,
) -> Result<Response, axum::http::StatusCode> {
    // 检查是否是导入或克隆请求
    let is_import = query_params.get("import").map(|s| s == "true").unwrap_or(false);
    let is_clone = query_params.get("clone").map(|s| s == "true").unwrap_or(false);
    
    if is_import {
        // 处理导入请求
        let params = ImportConfigParams {
            tenant: query_params.get("tenant").cloned().unwrap_or_default(),
            src_user: query_params.get("src_user").cloned(),
            policy: query_params.get("policy").cloned(),
        };
        
        let mut multipart = Multipart::from_request(request).await
            .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
        
        let result = import_config_handler(State(app), Query(params), multipart).await?;
        Ok(Response::builder()
            .status(axum::http::StatusCode::OK)
            .header("Content-Type", "application/json;charset=UTF-8")
            .body(axum::body::Body::from(serde_json::to_string(&result).unwrap()))
            .unwrap())
    } else if is_clone {
        // 处理克隆请求
        let params = CloneConfigParams {
            tenant: query_params.get("tenant").cloned().unwrap_or_default(),
            src_user: query_params.get("src_user").cloned(),
            policy: query_params.get("policy").cloned(),
        };
        
        // 读取请求体
        let body = axum::body::to_bytes(request.into_body(), usize::MAX).await
            .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
        let config_beans: Vec<CloneConfigBean> = serde_json::from_slice(&body)
            .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
        
        let result = clone_config_handler(State(app), Query(params), Json(config_beans)).await?;
        Ok(Response::builder()
            .status(axum::http::StatusCode::OK)
            .header("Content-Type", "application/json;charset=UTF-8")
            .body(axum::body::Body::from(serde_json::to_string(&result).unwrap()))
            .unwrap())
    } else {
        // 既不是导入也不是克隆，返回错误
        Err(axum::http::StatusCode::BAD_REQUEST)
    }
}

/// 发布、导入或克隆配置（根据查询参数和 Content-Type）
/// POST /nacos/v1/cs/configs
/// - 普通发布：application/x-www-form-urlencoded（无 import/clone 参数）
/// - 导入：multipart/form-data，?import=true
/// - 克隆：application/json，?clone=true
pub async fn publish_or_import_or_clone_config(
    State(app): State<Arc<AppHandle>>,
    Query(query_params): Query<std::collections::HashMap<String, String>>,
    request: axum::http::Request<axum::body::Body>,
) -> Result<Response, axum::http::StatusCode> {
    // 检查是否是导入或克隆请求
    let is_import = query_params.get("import").map(|s| s == "true").unwrap_or(false);
    let is_clone = query_params.get("clone").map(|s| s == "true").unwrap_or(false);
    
    if is_import {
        // 处理导入请求
        let params = ImportConfigParams {
            tenant: query_params.get("tenant").cloned().unwrap_or_default(),
            src_user: query_params.get("src_user").cloned(),
            policy: query_params.get("policy").cloned(),
        };
        
        let mut multipart = Multipart::from_request(request).await
            .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
        
        let result = import_config_handler(State(app), Query(params), multipart).await?;
        Ok(Response::builder()
            .status(axum::http::StatusCode::OK)
            .header("Content-Type", "application/json;charset=UTF-8")
            .body(axum::body::Body::from(serde_json::to_string(&result).unwrap()))
            .unwrap())
    } else if is_clone {
        // 处理克隆请求
        let params = CloneConfigParams {
            tenant: query_params.get("tenant").cloned().unwrap_or_default(),
            src_user: query_params.get("src_user").cloned(),
            policy: query_params.get("policy").cloned(),
        };
        
        // 读取请求体
        let body = axum::body::to_bytes(request.into_body(), usize::MAX).await
            .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
        let config_beans: Vec<CloneConfigBean> = serde_json::from_slice(&body)
            .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
        
        let result = clone_config_handler(State(app), Query(params), Json(config_beans)).await?;
        Ok(Response::builder()
            .status(axum::http::StatusCode::OK)
            .header("Content-Type", "application/json;charset=UTF-8")
            .body(axum::body::Body::from(serde_json::to_string(&result).unwrap()))
            .unwrap())
    } else {
        // 普通发布配置
        // 由于 axum 的限制，我们需要手动解析表单数据
        // 这里先尝试使用 Form 提取器，如果失败则返回错误
        // 实际上，这需要重新构建请求，但 axum 不支持
        // 所以我们暂时返回错误，建议客户端使用标准的表单格式
        Err(axum::http::StatusCode::BAD_REQUEST)
    }
}
