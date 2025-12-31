/**
 * Token 验证辅助函数
 * 从 Authorization header 中提取 Bearer Token 并验证
 */

use axum::{
    extract::Request,
    http::{header::AUTHORIZATION, StatusCode},
    response::{IntoResponse, Response},
};
use serde_json::json;
use std::sync::Arc;
use tauri::AppHandle;

use crate::auth::validate_token;

/// 从请求中提取 Token
pub fn extract_token_from_request(request: &Request) -> Option<String> {
    request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|s| {
            if s.starts_with("Bearer ") {
                Some(s[7..].to_string())
            } else {
                None
            }
        })
}

/// 验证 Token 并返回用户名
pub async fn verify_token(
    app: &Arc<AppHandle>,
    token: &str,
) -> Result<String, Response> {
    let validation = validate_token(
        app,
        crate::auth::ValidateTokenRequest {
            token: token.to_string(),
        },
    )
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            axum::Json(json!({
                "error": "Internal server error",
                "status": 500
            })),
        )
            .into_response()
    })?;

    if validation.valid {
        validation.username.ok_or_else(|| {
            (
                StatusCode::UNAUTHORIZED,
                axum::Json(json!({
                    "error": "Invalid token",
                    "status": 401
                })),
            )
                .into_response()
        })
    } else {
        Err((
            StatusCode::UNAUTHORIZED,
            axum::Json(json!({
                "error": "Token expired or invalid",
                "status": 401
            })),
        )
            .into_response())
    }
}

/// 检查路径是否需要认证
pub fn requires_auth(path: &str) -> bool {
    !path.contains("/health") && !path.contains("/login")
}
