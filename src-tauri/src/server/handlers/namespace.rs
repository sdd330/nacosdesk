/**
 * 命名空间管理处理器
 * 实现命名空间管理相关 API
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

use crate::tenant::{
    get_namespace_list as get_namespace_list_impl,
    create_namespace as create_namespace_impl,
    update_namespace as update_namespace_impl,
    delete_namespace as delete_namespace_impl,
    CreateTenantRequest, UpdateTenantRequest,
};

/// 查询命名空间列表参数
#[derive(Debug, Deserialize)]
pub struct ListNamespacesParams {
    #[serde(default)]
    pub show: Option<String>, // "all" 表示查询详情
}

/// 创建命名空间请求（Nacos API 格式）
#[derive(Debug, Deserialize)]
pub struct CreateNamespaceForm {
    pub customNamespaceId: String,
    pub namespaceName: String,
    #[serde(default)]
    pub namespaceDesc: Option<String>,
}

/// 更新命名空间请求（Nacos API 格式）
#[derive(Debug, Deserialize)]
pub struct UpdateNamespaceForm {
    pub namespace: String, // 命名空间 ID
    pub namespaceShowName: String,
    #[serde(default)]
    pub namespaceDesc: Option<String>,
}

/// 删除命名空间参数
#[derive(Debug, Deserialize)]
pub struct DeleteNamespaceParams {
    pub namespaceId: String,
}

/// 检查命名空间 ID 是否存在参数
#[derive(Debug, Deserialize)]
pub struct CheckNamespaceParams {
    pub customNamespaceId: String,
}

/// 查询命名空间列表
/// GET /nacos/v1/console/namespaces
/// 响应: RestResult<List<Namespace>>（JSON 格式）
pub async fn list_namespaces(
    State(app): State<Arc<AppHandle>>,
    Query(_params): Query<ListNamespacesParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    match get_namespace_list_impl(&app).await {
        Ok(response) => {
            // 转换为 Nacos 格式
            let nacos_response = serde_json::json!({
                "code": 200,
                "message": "success",
                "data": response.tenants
            });
            Ok(Json(nacos_response))
        }
        Err(_) => Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 创建命名空间
/// POST /nacos/v1/console/namespaces
/// 必需参数: customNamespaceId, namespaceName
/// 可选参数: namespaceDesc
/// 响应: true（成功）或 false（失败）
pub async fn create_namespace(
    State(app): State<Arc<AppHandle>>,
    Form(form): Form<CreateNamespaceForm>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // 构建创建请求
    let request = CreateTenantRequest {
        tenant_id: form.customNamespaceId,
        tenant_name: form.namespaceName,
        tenant_desc: form.namespaceDesc,
    };

    match create_namespace_impl(&app, request).await {
        Ok(_) => Ok(Json(serde_json::json!(true))),
        Err(_) => Ok(Json(serde_json::json!(false))),
    }
}

/// 更新命名空间
/// PUT /nacos/v1/console/namespaces
/// 必需参数: namespace, namespaceShowName
/// 可选参数: namespaceDesc
/// 响应: true（成功）或 false（失败）
pub async fn update_namespace(
    State(app): State<Arc<AppHandle>>,
    Form(form): Form<UpdateNamespaceForm>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // 构建更新请求
    let request = UpdateTenantRequest {
        tenant_id: form.namespace,
        tenant_name: form.namespaceShowName,
        tenant_desc: form.namespaceDesc,
    };

    match update_namespace_impl(&app, request).await {
        Ok(_) => Ok(Json(serde_json::json!(true))),
        Err(_) => Ok(Json(serde_json::json!(false))),
    }
}

/// 删除命名空间
/// DELETE /nacos/v1/console/namespaces
/// 必需参数: namespaceId
/// 响应: true（成功）或 false（失败）
pub async fn delete_namespace(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<DeleteNamespaceParams>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    match delete_namespace_impl(&app, &params.namespaceId).await {
        Ok(_) => Ok(Json(serde_json::json!(true))),
        Err(_) => Ok(Json(serde_json::json!(false))),
    }
}
