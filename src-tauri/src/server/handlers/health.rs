/**
 * 健康检查处理器
 */

use axum::extract::State;
use axum::response::Json;
use serde_json::json;
use std::sync::Arc;
use tauri::AppHandle;

use crate::server::{get_server_detailed_status, get_server_metrics};

/// 配置服务健康检查
pub async fn config_health() -> Json<serde_json::Value> {
    Json(json!({
        "status": "UP",
        "service": "config"
    }))
}

/// 命名服务健康检查
pub async fn naming_health() -> Json<serde_json::Value> {
    Json(json!({
        "status": "UP",
        "service": "naming"
    }))
}

/// 服务器详细健康检查（包含监控信息）
pub async fn server_health(
    State(app): State<Arc<AppHandle>>,
) -> Json<serde_json::Value> {
    match get_server_detailed_status(&app).await {
        Ok(status) => {
            Json(json!({
                "status": if status.running { "UP" } else { "DOWN" },
                "running": status.running,
                "port": status.port,
                "start_time": status.start_time,
                "uptime_seconds": status.uptime_seconds,
                "metrics": {
                    "request_count": status.metrics.request_count,
                    "success_count": status.metrics.success_count,
                    "error_count": status.metrics.error_count,
                    "average_response_time_ms": status.metrics.average_response_time_ms,
                    "min_response_time_ms": status.metrics.min_response_time_ms,
                    "max_response_time_ms": status.metrics.max_response_time_ms,
                    "memory_usage_mb": status.metrics.memory_usage_mb,
                    "cpu_usage_percent": status.metrics.cpu_usage_percent,
                }
            }))
        }
        Err(e) => {
            Json(json!({
                "status": "DOWN",
                "error": e
            }))
        }
    }
}

/// 获取服务器监控统计信息
pub async fn server_metrics(
    State(app): State<Arc<AppHandle>>,
) -> Json<serde_json::Value> {
    match get_server_metrics(&app).await {
        Ok(metrics) => {
            Json(json!({
                "request_count": metrics.request_count,
                "success_count": metrics.success_count,
                "error_count": metrics.error_count,
                "total_response_time_ms": metrics.total_response_time_ms,
                "average_response_time_ms": metrics.average_response_time_ms,
                "min_response_time_ms": metrics.min_response_time_ms,
                "max_response_time_ms": metrics.max_response_time_ms,
                "memory_usage_mb": metrics.memory_usage_mb,
                "cpu_usage_percent": metrics.cpu_usage_percent,
            }))
        }
        Err(e) => {
            Json(json!({
                "error": e
            }))
        }
    }
}

