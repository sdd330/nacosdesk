/**
 * HTTP 服务器路由配置模块
 * 配置所有 API 路由
 */

use axum::{
    routing::{get, post, put, delete, patch},
    Router,
};
use std::sync::Arc;
use tauri::AppHandle;

use crate::server::handlers;
use crate::server::middleware;
use axum::middleware::from_fn_with_state;

/// 创建应用路由
pub fn create_router(context_path: String, app: Arc<AppHandle>) -> Router {
    // 创建基础路由（不包含 context_path）
    let api_router = Router::new()
        // 健康检查路由
        .route("/v1/cs/health", get(handlers::health::config_health))
        .route("/v1/ns/health", get(handlers::health::naming_health))
        .route("/v1/console/server/health", get(handlers::health::server_health))
        .route("/v1/console/server/metrics", get(handlers::health::server_metrics))
        
        // 配置管理路由
        .route("/v1/cs/configs", get(handlers::config::get_config))
        .route("/v1/cs/configs", post(handlers::config::publish_config))
        .route("/v1/cs/configs", delete(handlers::config::delete_config_handler))
        .route("/v1/cs/configs/listener", post(handlers::config::listen_config))
        .route("/v1/cs/configs/listener", get(handlers::config::list_listeners))
        .route("/v1/cs/history", get(handlers::config::get_history))
        // Console API：配置搜索和高级信息
        .route("/v1/cs/configs/catalog", get(handlers::config::get_config_catalog))
        // Console API：监听查询
        .route("/v3/console/cs/config/listener", get(handlers::config::console_list_listeners_by_config))
        .route("/v3/console/cs/config/listener/ip", get(handlers::config::console_list_listeners_by_ip))
        // Console API：配置回滚
        .route("/v3/console/cs/config/rollback", post(handlers::config::console_rollback_config))
        
        // 服务注册与发现路由
        .route("/v1/ns/instance", post(handlers::instance::register_instance))
        .route("/v1/ns/instance", put(handlers::instance::update_instance))
        .route("/v1/ns/instance", delete(handlers::instance::deregister_instance))
        .route("/v1/ns/instance/list", get(handlers::instance::list_instances))
        .route("/v1/ns/instance", get(handlers::instance::get_instance))
        .route("/v1/ns/instance/beat", put(handlers::instance::heartbeat))
        .route("/v1/ns/instance", patch(handlers::instance::patch_instance))
        .route("/v1/ns/instance/metadata/batch", put(handlers::instance::batch_update_metadata))
        .route("/v1/ns/instance/metadata/batch", delete(handlers::instance::batch_delete_metadata))
        .route("/v1/ns/instance/statuses", get(handlers::instance::get_instance_statuses))
        
        // 服务管理路由
        .route("/v1/ns/service/list", get(handlers::service::list_services))
        .route("/v1/ns/service", get(handlers::service::get_service))
        .route("/v1/ns/service", post(handlers::service::create_service))
        .route("/v1/ns/service", put(handlers::service::update_service))
        .route("/v1/ns/service", delete(handlers::service::delete_service))
        .route("/v1/ns/service/names", get(handlers::service::search_service_names))
        .route("/v1/ns/service/subscribers", get(handlers::service::get_subscribers))
        // Console API：服务订阅者列表
        .route("/v3/console/ns/service/subscribers", get(handlers::service::console_get_subscribers))
        
        // 命名空间管理路由
        .route("/v1/console/namespaces", get(handlers::namespace::list_namespaces))
        .route("/v1/console/namespaces", post(handlers::namespace::create_namespace))
        .route("/v1/console/namespaces", put(handlers::namespace::update_namespace))
        .route("/v1/console/namespaces", delete(handlers::namespace::delete_namespace))
        
        // 认证路由
        .route("/v1/auth/users/login", post(handlers::auth::login))
        .route("/v1/auth/users", get(handlers::auth::list_users))
        
        // 应用中间件（注意顺序：IP 白名单应该在最早应用，限流在 IP 白名单之后，metrics 和 access_log 中间件需要在 with_state 之后应用）
        .layer(middleware::create_cors_layer())
        .layer(middleware::create_trace_layer())
        // 添加 AppHandle 作为 State
        .with_state(app.clone())
        // 添加 IP 白名单中间件（最早应用，在访问日志之前）
        .layer(from_fn_with_state(app.clone(), middleware::ip_whitelist::ip_whitelist_middleware))
        // 添加请求限流中间件（在 IP 白名单之后，访问日志之前）
        .layer(from_fn_with_state(app.clone(), middleware::rate_limit::rate_limit_middleware))
        // 添加访问日志中间件
        .layer(from_fn_with_state(app.clone(), middleware::access_log::access_log_middleware))
        // 添加监控统计中间件
        .layer(from_fn_with_state(app.clone(), middleware::metrics::metrics_middleware));

    // 如果 context_path 不是 "/"，则添加前缀
    if context_path != "/" {
        Router::new()
            .nest(&context_path, api_router)
            .fallback(handlers::not_found)
    } else {
        api_router.fallback(handlers::not_found)
    }
}

