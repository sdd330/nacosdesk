/**
 * 认证处理器
 * 实现登录和用户列表功能
 */

use axum::{
    extract::{Query, State},
    http::HeaderMap,
    response::Json,
};
use axum_extra::extract::Form;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::AppHandle;

use crate::auth::{handle_login, get_user_list, LoginRequest, UserQueryParams};

/// 登录请求（支持表单和 JSON）
#[derive(Debug, Deserialize)]
pub struct LoginForm {
    pub username: String,
    pub password: String,
}

/// Nacos 登录响应格式
#[derive(Debug, Serialize)]
struct NacosLoginResponse {
    #[serde(rename = "accessToken")]
    access_token: String,
    #[serde(rename = "tokenTtl")]
    token_ttl: i64,
    #[serde(rename = "globalAdmin")]
    global_admin: bool,
    username: String,
}

/// 用户登录
/// POST /nacos/v1/auth/users/login
/// 支持表单数据（application/x-www-form-urlencoded）和 JSON
pub async fn login(
    State(app): State<Arc<AppHandle>>,
    form: Option<Form<LoginForm>>,
    json: Option<axum::Json<LoginForm>>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // 优先使用表单数据，如果没有则使用 JSON
    let login_data = match (form, json) {
        (Some(Form(form_data)), _) => form_data,
        (_, Some(axum::Json(json_data))) => json_data,
        _ => {
            return Err(axum::http::StatusCode::BAD_REQUEST);
        }
    };

    // 构建登录请求
    let request = LoginRequest {
        username: login_data.username,
        password: login_data.password,
    };

    // 调用现有的登录处理函数
    match handle_login(&app, request).await {
        Ok(response) => {
            // 转换为 Nacos 格式
            let nacos_response = NacosLoginResponse {
                access_token: response.access_token,
                token_ttl: response.token_ttl,
                global_admin: response.global_admin,
                username: response.username,
            };
            Ok(Json(serde_json::to_value(nacos_response).unwrap()))
        }
        Err(e) => {
            // 登录失败，返回错误
            Err(axum::http::StatusCode::UNAUTHORIZED)
        }
    }
}

/// 查询用户列表
/// GET /nacos/v1/auth/users
/// 需要认证（通过 Token 验证）
pub async fn list_users(
    State(app): State<Arc<AppHandle>>,
    Query(params): Query<UserQueryParams>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, axum::response::Response> {
    use crate::server::middleware::auth::verify_token;
    use axum::http::header::AUTHORIZATION;
    
    // 提取并验证 Token
    let auth_header = headers
        .get(AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|s| {
            if s.starts_with("Bearer ") {
                Some(s[7..].to_string())
            } else {
                None
            }
        })
        .ok_or_else(|| {
            (
                axum::http::StatusCode::UNAUTHORIZED,
                axum::Json(serde_json::json!({
                    "error": "Missing Authorization header",
                    "status": 401
                })),
            )
                .into_response()
        })?;
    
    verify_token(&app, &auth_header).await?;
    
    match get_user_list(&app, params).await {
        Ok(response) => Ok(Json(serde_json::to_value(response).unwrap())),
        Err(_) => Err((
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            axum::Json(serde_json::json!({
                "error": "Internal server error",
                "status": 500
            })),
        )
            .into_response()),
    }
}
