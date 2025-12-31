/**
 * HTTP 服务器管理模块
 * 提供启动、停止、查询状态等功能
 */

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;
use tokio::task::JoinHandle;

pub mod handlers;
pub mod middleware;
mod router;

#[cfg(test)]
pub mod tests;

use router::create_router;

/// 服务器状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerStatus {
    pub running: bool,
    pub port: Option<u16>,
    pub start_time: Option<i64>,
    pub request_count: u64,
    pub error_count: u64,
    pub success_count: u64,
    pub total_response_time_ms: u64,
    pub average_response_time_ms: f64,
}

/// 服务器监控统计信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerMetrics {
    pub request_count: u64,
    pub success_count: u64,
    pub error_count: u64,
    pub total_response_time_ms: u64,
    pub average_response_time_ms: f64,
    pub min_response_time_ms: u64,
    pub max_response_time_ms: u64,
    pub memory_usage_mb: f64,
    pub cpu_usage_percent: f64,
}

/// 服务器详细状态（包含监控信息）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerDetailedStatus {
    pub running: bool,
    pub port: Option<u16>,
    pub start_time: Option<i64>,
    pub uptime_seconds: Option<u64>,
    pub metrics: ServerMetrics,
}

/// 服务器配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub port: u16,
    pub context_path: String,
    #[serde(default)]
    pub ip_whitelist_enabled: bool,
    #[serde(default)]
    pub ip_whitelist: Vec<String>, // IP 白名单列表
    #[serde(default)]
    pub rate_limit_enabled: Option<bool>, // 请求限流是否启用
    #[serde(default)]
    pub rate_limit_capacity: Option<u32>, // 令牌桶容量（默认 100）
    #[serde(default)]
    pub rate_limit_refill_rate: Option<u32>, // 每秒补充的令牌数（默认 10）
    #[serde(default)]
    pub rate_limit_tokens_per_request: Option<u32>, // 每个请求消耗的令牌数（默认 1）
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            port: 8848,
            context_path: "/nacos".to_string(),
            ip_whitelist_enabled: false,
            ip_whitelist: Vec::new(),
            rate_limit_enabled: Some(false),
            rate_limit_capacity: Some(100),
            rate_limit_refill_rate: Some(10),
            rate_limit_tokens_per_request: Some(1),
        }
    }
}

/// 服务器内部状态
struct ServerState {
    running: bool,
    port: Option<u16>,
    start_time: Option<i64>,
    request_count: u64,
    success_count: u64,
    error_count: u64,
    total_response_time_ms: u64,
    min_response_time_ms: u64,
    max_response_time_ms: u64,
    handle: Option<JoinHandle<Result<(), axum::Error>>>,
    shutdown_tx: Option<tokio::sync::oneshot::Sender<()>>,
}

impl Default for ServerState {
    fn default() -> Self {
        Self {
            running: false,
            port: None,
            start_time: None,
            request_count: 0,
            success_count: 0,
            error_count: 0,
            total_response_time_ms: 0,
            min_response_time_ms: u64::MAX,
            max_response_time_ms: 0,
            handle: None,
            shutdown_tx: None,
        }
    }
}

/// 服务器状态管理器
type ServerStateManager = Arc<Mutex<ServerState>>;

/// 获取或创建服务器状态管理器
fn get_server_state(app: &AppHandle) -> ServerStateManager {
    if let Some(state) = app.try_state::<ServerStateManager>() {
        state
    } else {
        let state = Arc::new(Mutex::new(ServerState::default()));
        app.manage(state.clone());
        state
    }
}

/// 检查端口是否可用
fn check_port_available(port: u16) -> Result<(), String> {
    use std::net::TcpListener;
    
    // 验证端口范围
    if port < 1024 || port > 65535 {
        return Err(format!("端口必须在 1024-65535 范围内，当前端口: {}", port));
    }
    
    // 尝试绑定端口来检查是否被占用
    match TcpListener::bind(format!("127.0.0.1:{}", port)) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("端口 {} 已被占用: {}", port, e)),
    }
}

/// 启动 API 服务器
pub async fn start_api_server(
    app: &AppHandle,
    port: Option<u16>,
) -> Result<String, String> {
    let state_manager = get_server_state(app);
    let mut state = state_manager.lock().await;
    
    // 检查服务器是否已在运行
    if state.running {
        return Err(format!(
            "服务器已在运行，端口: {}",
            state.port.unwrap_or(0)
        ));
    }
    
    // 获取配置
    let config = get_api_server_config(app).await?;
    let port = port.unwrap_or(config.port);
    
    // 检查端口是否可用
    check_port_available(port)?;
    
    // 初始化 tracing
    tracing_subscriber::fmt::init();
    
    // 创建路由，传递 AppHandle
    let app_handle = Arc::new(app.clone());
    let router = create_router(config.context_path.clone(), app_handle);
    
    // 创建服务器地址
    let addr = format!("127.0.0.1:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .map_err(|e| format!("无法绑定端口 {}: {}", port, e))?;
    
    // 创建优雅关闭通道
    let (shutdown_tx, shutdown_rx) = tokio::sync::oneshot::channel::<()>();
    
    // 启动服务器（axum 0.7 使用 axum::serve）
    let server = axum::serve(listener, router)
        .with_graceful_shutdown(async {
            shutdown_rx.await.ok();
        });
    
    // 记录启动时间
    let start_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;
    
    // 启动服务器任务
    let handle = tokio::spawn(async move {
        server.await
    });
    
    // 更新状态
    state.running = true;
    state.port = Some(port);
    state.start_time = Some(start_time);
    state.handle = Some(handle);
    state.shutdown_tx = Some(shutdown_tx);
    
    // 保存配置
    let config = ServerConfig {
        port,
        ..config
    };
    update_api_server_config(app, config).await?;
    
    Ok(format!("API server started on port {}", port))
}

/// 停止 API 服务器
pub async fn stop_api_server(app: &AppHandle) -> Result<(), String> {
    let state_manager = get_server_state(app);
    let mut state = state_manager.lock().await;
    
    if !state.running {
        return Err("服务器未运行".to_string());
    }
    
    // 发送停止信号
    if let Some(shutdown_tx) = state.shutdown_tx.take() {
        shutdown_tx.send(()).map_err(|_| "无法发送停止信号".to_string())?;
    }
    
    // 等待服务器停止
    if let Some(handle) = state.handle.take() {
        tokio::time::timeout(tokio::time::Duration::from_secs(5), handle)
            .await
            .map_err(|_| "等待服务器停止超时".to_string())?
            .map_err(|e| format!("服务器停止错误: {}", e))?;
    }
    
    // 重置状态
    state.running = false;
    state.port = None;
    state.start_time = None;
    state.request_count = 0;
    state.success_count = 0;
    state.error_count = 0;
    state.total_response_time_ms = 0;
    state.min_response_time_ms = u64::MAX;
    state.max_response_time_ms = 0;
    
    Ok(())
}

/// 获取 API 服务器状态
pub async fn get_api_server_status(
    app: &AppHandle,
) -> Result<ServerStatus, String> {
    let state_manager = get_server_state(app);
    let state = state_manager.lock().await;
    
    let average_response_time_ms = if state.request_count > 0 {
        state.total_response_time_ms as f64 / state.request_count as f64
    } else {
        0.0
    };
    
    Ok(ServerStatus {
        running: state.running,
        port: state.port,
        start_time: state.start_time,
        request_count: state.request_count,
        success_count: state.success_count,
        error_count: state.error_count,
        total_response_time_ms: state.total_response_time_ms,
        average_response_time_ms,
    })
}

/// 记录请求统计信息
pub async fn record_request(
    app: &AppHandle,
    is_error: bool,
    response_time_ms: u64,
) {
    let state_manager = get_server_state(app);
    let mut state = state_manager.lock().await;
    
    state.request_count += 1;
    if is_error {
        state.error_count += 1;
    } else {
        state.success_count += 1;
    }
    
    state.total_response_time_ms += response_time_ms;
    if response_time_ms < state.min_response_time_ms {
        state.min_response_time_ms = response_time_ms;
    }
    if response_time_ms > state.max_response_time_ms {
        state.max_response_time_ms = response_time_ms;
    }
}

/// 获取服务器监控统计信息
pub async fn get_server_metrics(
    app: &AppHandle,
) -> Result<ServerMetrics, String> {
    let state_manager = get_server_state(app);
    let state = state_manager.lock().await;
    
    let average_response_time_ms = if state.request_count > 0 {
        state.total_response_time_ms as f64 / state.request_count as f64
    } else {
        0.0
    };
    
    // 获取内存使用情况（MB）
    let memory_usage_mb = get_memory_usage_mb();
    
    // 获取 CPU 使用率（简化实现，返回 0.0）
    let cpu_usage_percent = get_cpu_usage_percent();
    
    Ok(ServerMetrics {
        request_count: state.request_count,
        success_count: state.success_count,
        error_count: state.error_count,
        total_response_time_ms: state.total_response_time_ms,
        average_response_time_ms,
        min_response_time_ms: if state.min_response_time_ms == u64::MAX {
            0
        } else {
            state.min_response_time_ms
        },
        max_response_time_ms: state.max_response_time_ms,
        memory_usage_mb,
        cpu_usage_percent,
    })
}

/// 获取服务器详细状态（包含监控信息）
pub async fn get_server_detailed_status(
    app: &AppHandle,
) -> Result<ServerDetailedStatus, String> {
    let state_manager = get_server_state(app);
    let state = state_manager.lock().await;
    
    let uptime_seconds = if let Some(start_time) = state.start_time {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;
        Some((now - start_time) as u64)
    } else {
        None
    };
    
    let metrics = get_server_metrics(app).await?;
    
    Ok(ServerDetailedStatus {
        running: state.running,
        port: state.port,
        start_time: state.start_time,
        uptime_seconds,
        metrics,
    })
}

/// 获取内存使用情况（MB）
fn get_memory_usage_mb() -> f64 {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        if let Ok(output) = Command::new("ps")
            .args(&["-o", "rss=", "-p"])
            .arg(std::process::id().to_string())
            .output()
        {
            if let Ok(mem_kb_str) = String::from_utf8(output.stdout) {
                if let Ok(mem_kb) = mem_kb_str.trim().parse::<f64>() {
                    return mem_kb / 1024.0; // KB to MB
                }
            }
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        use std::fs;
        if let Ok(status) = fs::read_to_string("/proc/self/status") {
            for line in status.lines() {
                if line.starts_with("VmRSS:") {
                    if let Some(kb_str) = line.split_whitespace().nth(1) {
                        if let Ok(mem_kb) = kb_str.parse::<f64>() {
                            return mem_kb / 1024.0; // KB to MB
                        }
                    }
                }
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        // Windows 实现可以使用 winapi 或返回 0.0
        return 0.0;
    }
    
    0.0
}

/// 获取 CPU 使用率（简化实现）
fn get_cpu_usage_percent() -> f64 {
    // 简化实现，返回 0.0
    // 实际实现可以使用系统 API 或第三方库
    0.0
}

/// 获取 API 服务器配置
pub async fn get_api_server_config(
    app: &AppHandle,
) -> Result<ServerConfig, String> {
    use tauri_plugin_store::StoreBuilder;
    
    let store = StoreBuilder::new(app, "api-server-config.json")
        .build();
    
    match store.get("config") {
        Some(value) => {
            serde_json::from_value(value.clone())
                .map_err(|e| format!("无法解析配置: {}", e))
        }
        None => Ok(ServerConfig::default()),
    }
}

/// 更新 API 服务器配置
pub async fn update_api_server_config(
    app: &AppHandle,
    config: ServerConfig,
) -> Result<(), String> {
    use tauri_plugin_store::StoreBuilder;
    
    let store = StoreBuilder::new(app, "api-server-config.json")
        .build();
    
    let config_value = serde_json::to_value(&config)
        .map_err(|e| format!("无法序列化配置: {}", e))?;
    
    store.insert("config", config_value)
        .map_err(|e| format!("无法保存配置: {}", e))?;
    
    store.save()
        .map_err(|e| format!("无法保存配置文件: {}", e))?;
    
    Ok(())
}
