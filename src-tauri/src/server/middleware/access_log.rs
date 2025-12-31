/**
 * 访问日志中间件
 * 记录 HTTP 请求访问日志到文件
 */

use axum::extract::{Request, State};
use axum::http::HeaderMap;
use axum::middleware::Next;
use axum::response::Response;
use std::sync::Arc;
use std::time::Instant;
use tauri::AppHandle;
use std::path::PathBuf;
use chrono::Local;

/// 访问日志配置
pub struct AccessLogConfig {
    pub enabled: bool,
    pub log_dir: PathBuf,
    pub max_file_size: u64, // 最大文件大小（字节），默认 10MB
    pub max_files: usize,   // 保留的最大文件数，默认 7
}

impl Default for AccessLogConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            log_dir: PathBuf::from("logs"),
            max_file_size: 10 * 1024 * 1024, // 10MB
            max_files: 7,
        }
    }
}

/// 获取访问日志文件路径
fn get_access_log_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    let log_dir = app_data_dir.join("logs");
    std::fs::create_dir_all(&log_dir)
        .map_err(|e| format!("Failed to create log directory: {}", e))?;
    
    let today = Local::now().format("%Y-%m-%d");
    Ok(log_dir.join(format!("access-{}.log", today)))
}

/// 获取客户端 IP 地址
fn get_client_ip(headers: &HeaderMap) -> String {
    // 优先从 X-Forwarded-For 获取（代理场景）
    if let Some(forwarded_for) = headers.get("X-Forwarded-For") {
        if let Ok(ip) = forwarded_for.to_str() {
            // 取第一个 IP（可能是多个 IP，逗号分隔）
            return ip.split(',').next().unwrap_or("unknown").trim().to_string();
        }
    }
    
    // 其次从 X-Real-IP 获取
    if let Some(real_ip) = headers.get("X-Real-IP") {
        if let Ok(ip) = real_ip.to_str() {
            return ip.to_string();
        }
    }
    
    "unknown".to_string()
}

/// 获取 User-Agent
fn get_user_agent(headers: &HeaderMap) -> String {
    headers.get("User-Agent")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string())
        .unwrap_or_else(|| "unknown".to_string())
}

/// 写入访问日志
async fn write_access_log(
    app: &AppHandle,
    method: &str,
    path: &str,
    status_code: u16,
    response_time_ms: u64,
    client_ip: &str,
    user_agent: &str,
) {
    let log_path = match get_access_log_path(app) {
        Ok(path) => path,
        Err(e) => {
            tracing::error!("Failed to get access log path: {}", e);
            return;
        }
    };
    
    let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S%.3f").to_string();
    let log_line = format!(
        "{} {} {} {} {} {}ms {}\n",
        timestamp,
        client_ip,
        method,
        path,
        status_code,
        response_time_ms,
        user_agent
    );
    
    // 异步写入文件（使用 tokio::fs）
    match tokio::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .await
    {
        Ok(mut file) => {
            use tokio::io::AsyncWriteExt;
            if let Err(e) = file.write_all(log_line.as_bytes()).await {
                tracing::error!("Failed to write access log: {}", e);
            }
        }
        Err(e) => {
            tracing::error!("Failed to open access log file: {}", e);
        }
    }
    
    // 检查文件大小，如果超过限制则轮转
    if let Ok(metadata) = tokio::fs::metadata(&log_path).await {
        if metadata.len() > 10 * 1024 * 1024 { // 10MB
            // 轮转日志文件
            let timestamp = Local::now().format("%Y%m%d-%H%M%S");
            let rotated_path = log_path.parent()
                .map(|p| p.join(format!("access-{}.log.{}", Local::now().format("%Y-%m-%d"), timestamp)))
                .unwrap_or_else(|| log_path.with_file_name(format!("access-{}.log.{}", Local::now().format("%Y-%m-%d"), timestamp)));
            if let Err(e) = tokio::fs::rename(&log_path, &rotated_path).await {
                tracing::error!("Failed to rotate access log: {}", e);
            }
        }
    }
}

/// 访问日志中间件
pub async fn access_log_middleware(
    State(app): State<Arc<AppHandle>>,
    request: Request,
    next: Next,
) -> Response {
    let start_time = Instant::now();
    
    // 提取请求信息
    let method = request.method().to_string();
    let path = request.uri().path().to_string();
    let query = request.uri().query().map(|q| format!("?{}", q)).unwrap_or_default();
    let full_path = format!("{}{}", path, query);
    let headers = request.headers().clone();
    
    // 执行请求
    let response = next.run(request).await;
    
    // 计算响应时间（毫秒）
    let elapsed = start_time.elapsed();
    let response_time_ms = elapsed.as_millis() as u64;
    
    // 提取响应信息
    let status_code = response.status().as_u16();
    let client_ip = get_client_ip(&headers);
    let user_agent = get_user_agent(&headers);
    
    // 异步写入访问日志（不阻塞响应）
    let app_clone = app.clone();
    tokio::spawn(async move {
        write_access_log(
            &app_clone,
            &method,
            &full_path,
            status_code,
            response_time_ms,
            &client_ip,
            &user_agent,
        ).await;
    });
    
    response
}

