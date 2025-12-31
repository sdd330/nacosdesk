/**
 * HTTP 服务器中间件模块
 * 提供 CORS、日志、错误处理等中间件
 */

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::Level;

pub mod auth;
pub mod metrics;
pub mod access_log;
pub mod ip_whitelist;
pub mod rate_limit;

/// 创建 CORS 中间件层
pub fn create_cors_layer() -> CorsLayer {
    CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any)
        .expose_headers(Any)
}

/// 创建日志中间件层
pub fn create_trace_layer() -> impl tower::Layer<axum::Router> + Clone {
    TraceLayer::new_for_http()
        .make_span_with(|request: &axum::http::Request<_>| {
            tracing::span!(
                Level::INFO,
                "http_request",
                method = %request.method(),
                uri = %request.uri(),
            )
        })
        .on_request(|_request: &axum::http::Request<_>, _span: &tracing::Span| {
            tracing::info!("请求开始");
        })
        .on_response(|_response: &axum::http::Response<_>, latency: std::time::Duration, _span: &tracing::Span| {
            tracing::info!(latency = ?latency, "请求完成");
        })
        .on_failure(|_error: tower::BoxError, _latency: std::time::Duration, _span: &tracing::Span| {
            tracing::error!("请求失败");
        })
}


/// 统一错误响应
pub struct AppError {
    pub status: StatusCode,
    pub message: String,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let body = Json(json!({
            "error": self.message,
            "status": self.status.as_u16(),
        }));
        (self.status, body).into_response()
    }
}

impl From<String> for AppError {
    fn from(message: String) -> Self {
        AppError {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            message,
        }
    }
}

impl From<&str> for AppError {
    fn from(message: &str) -> Self {
        AppError {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            message: message.to_string(),
        }
    }
}

