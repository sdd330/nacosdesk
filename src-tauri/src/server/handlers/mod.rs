/**
 * HTTP 服务器处理器模块
 * 提供各个 API 端点的处理器
 */

pub mod auth;
pub mod config;
pub mod health;
pub mod instance;
pub mod namespace;
pub mod operator;
pub mod service;

use axum::http::StatusCode;
use axum::response::Response;

/// 404 处理器
pub async fn not_found() -> Response {
    (StatusCode::NOT_FOUND, "Not Found").into_response()
}

