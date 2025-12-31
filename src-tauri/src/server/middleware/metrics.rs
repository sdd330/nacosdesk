/**
 * 监控统计中间件
 * 记录请求统计信息（总请求数、成功/错误数、响应时间）
 */

use axum::extract::{Request, State};
use axum::middleware::Next;
use axum::response::Response;
use std::sync::Arc;
use std::time::Instant;
use tauri::AppHandle;

use crate::server::record_request;

/// 监控统计中间件
pub async fn metrics_middleware(
    State(app): State<Arc<AppHandle>>,
    request: Request,
    next: Next,
) -> Response {
    let start_time = Instant::now();
    
    // 执行请求
    let response = next.run(request).await;
    
    // 计算响应时间（毫秒）
    let elapsed = start_time.elapsed();
    let response_time_ms = elapsed.as_millis() as u64;
    
    // 判断是否为错误响应（4xx 或 5xx）
    let is_error = response.status().is_client_error() || response.status().is_server_error();
    
    // 记录统计信息（异步执行，不阻塞响应）
    let app_clone = app.clone();
    tokio::spawn(async move {
        record_request(&app_clone, is_error, response_time_ms).await;
    });
    
    response
}

