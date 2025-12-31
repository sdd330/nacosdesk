#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod auth;
mod config;
mod service;
mod tenant;
mod db;
mod server;

use auth::{
    handle_login, handle_register, has_admin_user,
    get_user_list, get_user_detail, create_user, delete_user, update_user_password, update_user_status,
    get_role_list, create_role, delete_role,
    get_permission_list, create_permission, delete_permission, check_permission,
    validate_token, refresh_token, cleanup_expired_tokens,
    LoginRequest, LoginResponse, RegisterRequest, RegisterResponse,
    UserQueryParams, UserListResponse, UserDetail, CreateUserRequest, UpdateUserPasswordRequest, UpdateUserStatusRequest,
    RoleQueryParams, RoleListResponse, CreateRoleRequest, DeleteRoleRequest,
    PermissionQueryParams, PermissionListResponse, CreatePermissionRequest, DeletePermissionRequest,
    ValidateTokenRequest, ValidateTokenResponse, RefreshTokenRequest, RefreshTokenResponse,
};
use config::{
    get_config_list, get_config_detail, create_config, update_config, delete_config,
    get_config_history, get_config_history_detail, get_history_configs,
    ConfigQueryParams, CreateConfigRequest, UpdateConfigRequest,
    ConfigInfo, ConfigListResponse, ConfigHistoryInfo,
};
use service::{
    get_service_list, get_service_detail, create_service, update_service, delete_service,
    get_service_instances, register_instance, deregister_instance, update_instance_health,
    ServiceQueryParams, CreateServiceRequest, UpdateServiceRequest, RegisterInstanceRequest,
    ServiceInfo, ServiceListResponse, InstanceInfo, InstanceListResponse,
};
use tenant::{
    get_namespace_list, create_namespace, update_namespace, delete_namespace,
    CreateTenantRequest, UpdateTenantRequest,
    TenantInfo, TenantListResponse,
};
use db::{
    backup_database,
    restore_database,
    get_database_file_path,
    cleanup_database,
};
use server::{
    start_api_server, stop_api_server, get_api_server_status, get_api_server_config, update_api_server_config,
    get_server_metrics, get_server_detailed_status,
    ServerStatus, ServerConfig, ServerMetrics, ServerDetailedStatus,
};
use tauri::Manager;

/// Tauri 命令：用户登录
#[tauri::command]
async fn login(
    username: String,
    password: String,
    app: tauri::AppHandle,
) -> Result<LoginResponse, String> {
    let request = LoginRequest { username, password };
    handle_login(&app, request).await
}

/// Tauri 命令：注册（初始化管理员）
#[tauri::command]
async fn register(
    username: String,
    password: String,
    app: tauri::AppHandle,
) -> Result<RegisterResponse, String> {
    let request = RegisterRequest { username, password };
    handle_register(&app, request).await
}

/// Tauri 命令：检查是否需要注册（是否有管理员用户）
#[tauri::command]
async fn check_admin_exists(app: tauri::AppHandle) -> Result<bool, String> {
    has_admin_user(&app).await
}

/// Tauri 命令：查询配置列表
#[tauri::command]
async fn get_config_list_cmd(
    params: ConfigQueryParams,
    app: tauri::AppHandle,
) -> Result<ConfigListResponse, String> {
    get_config_list(&app, params).await
}

/// Tauri 命令：查询配置详情
#[tauri::command]
async fn get_config_detail_cmd(
    data_id: String,
    group_id: String,
    tenant_id: String,
    app: tauri::AppHandle,
) -> Result<Option<ConfigInfo>, String> {
    get_config_detail(&app, &data_id, &group_id, &tenant_id).await
}

/// Tauri 命令：创建配置
#[tauri::command]
async fn create_config_cmd(
    request: CreateConfigRequest,
    app: tauri::AppHandle,
) -> Result<ConfigInfo, String> {
    // TODO: 从 token 中获取用户信息
    create_config(&app, request, None, None).await
}

/// Tauri 命令：更新配置
#[tauri::command]
async fn update_config_cmd(
    request: UpdateConfigRequest,
    app: tauri::AppHandle,
) -> Result<ConfigInfo, String> {
    // TODO: 从 token 中获取用户信息
    update_config(&app, request, None, None).await
}

/// Tauri 命令：删除配置
#[tauri::command]
async fn delete_config_cmd(
    data_id: String,
    group_id: String,
    tenant_id: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    // TODO: 从 token 中获取用户信息
    delete_config(&app, &data_id, &group_id, &tenant_id, None, None).await
}

/// Tauri 命令：查询配置历史
#[tauri::command]
async fn get_config_history_cmd(
    data_id: String,
    group_id: String,
    tenant_id: String,
    page_no: Option<i64>,
    page_size: Option<i64>,
    app: tauri::AppHandle,
) -> Result<ConfigListResponse, String> {
    get_config_history(&app, &data_id, &group_id, &tenant_id, page_no, page_size).await
}

/// Tauri 命令：查询历史版本详情
#[tauri::command]
async fn get_config_history_detail_cmd(
    data_id: String,
    group_id: String,
    tenant_id: String,
    nid: i64,
    app: tauri::AppHandle,
) -> Result<Option<ConfigHistoryInfo>, String> {
    get_config_history_detail(&app, &data_id, &group_id, &tenant_id, nid).await
}

/// Tauri 命令：获取历史配置的 Data ID 和 Group 列表
#[tauri::command]
async fn get_history_configs_cmd(
    tenant_id: String,
    app: tauri::AppHandle,
) -> Result<Vec<(String, String)>, String> {
    get_history_configs(&app, &tenant_id).await
}

/// Tauri 命令：查询服务列表
#[tauri::command]
async fn get_service_list_cmd(
    params: ServiceQueryParams,
    app: tauri::AppHandle,
) -> Result<ServiceListResponse, String> {
    get_service_list(&app, params).await
}

/// Tauri 命令：查询服务详情
#[tauri::command]
async fn get_service_detail_cmd(
    namespace_id: String,
    group_name: String,
    service_name: String,
    app: tauri::AppHandle,
) -> Result<Option<ServiceInfo>, String> {
    get_service_detail(&app, &namespace_id, &group_name, &service_name).await
}

/// Tauri 命令：创建服务
#[tauri::command]
async fn create_service_cmd(
    request: CreateServiceRequest,
    app: tauri::AppHandle,
) -> Result<ServiceInfo, String> {
    create_service(&app, request).await
}

/// Tauri 命令：更新服务
#[tauri::command]
async fn update_service_cmd(
    request: UpdateServiceRequest,
    app: tauri::AppHandle,
) -> Result<ServiceInfo, String> {
    update_service(&app, request).await
}

/// Tauri 命令：删除服务
#[tauri::command]
async fn delete_service_cmd(
    namespace_id: String,
    group_name: String,
    service_name: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    delete_service(&app, &namespace_id, &group_name, &service_name).await
}

/// Tauri 命令：查询服务实例
#[tauri::command]
async fn get_service_instances_cmd(
    namespace_id: String,
    group_name: String,
    service_name: String,
    app: tauri::AppHandle,
) -> Result<InstanceListResponse, String> {
    get_service_instances(&app, &namespace_id, &group_name, &service_name).await
}

/// Tauri 命令：注册实例
#[tauri::command]
async fn register_instance_cmd(
    request: RegisterInstanceRequest,
    app: tauri::AppHandle,
) -> Result<InstanceInfo, String> {
    register_instance(&app, request).await
}

/// Tauri 命令：注销实例
#[tauri::command]
async fn deregister_instance_cmd(
    namespace_id: String,
    group_name: String,
    service_name: String,
    instance_id: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    deregister_instance(&app, &namespace_id, &group_name, &service_name, &instance_id).await
}

/// Tauri 命令：更新实例健康状态
#[tauri::command]
async fn update_instance_health_cmd(
    namespace_id: String,
    group_name: String,
    service_name: String,
    instance_id: String,
    healthy: bool,
    app: tauri::AppHandle,
) -> Result<(), String> {
    update_instance_health(&app, &namespace_id, &group_name, &service_name, &instance_id, healthy).await
}

/// Tauri 命令：查询命名空间列表
#[tauri::command]
async fn get_namespace_list_cmd(
    app: tauri::AppHandle,
) -> Result<TenantListResponse, String> {
    get_namespace_list(&app).await
}

/// Tauri 命令：创建命名空间
#[tauri::command]
async fn create_namespace_cmd(
    request: CreateTenantRequest,
    app: tauri::AppHandle,
) -> Result<TenantInfo, String> {
    create_namespace(&app, request).await
}

/// Tauri 命令：更新命名空间
#[tauri::command]
async fn update_namespace_cmd(
    request: UpdateTenantRequest,
    app: tauri::AppHandle,
) -> Result<TenantInfo, String> {
    update_namespace(&app, request).await
}

/// Tauri 命令：删除命名空间
#[tauri::command]
async fn delete_namespace_cmd(
    tenant_id: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    delete_namespace(&app, &tenant_id).await
}

/// Tauri 命令：启动 API 服务器
#[tauri::command]
async fn start_api_server_cmd(
    port: Option<u16>,
    app: tauri::AppHandle,
) -> Result<String, String> {
    start_api_server(&app, port).await
}

/// Tauri 命令：停止 API 服务器
#[tauri::command]
async fn stop_api_server_cmd(
    app: tauri::AppHandle,
) -> Result<(), String> {
    stop_api_server(&app).await
}

/// Tauri 命令：查询 API 服务器状态
#[tauri::command]
async fn get_api_server_status_cmd(
    app: tauri::AppHandle,
) -> Result<ServerStatus, String> {
    get_api_server_status(&app).await
}

/// Tauri 命令：获取 API 服务器配置
#[tauri::command]
async fn get_api_server_config_cmd(
    app: tauri::AppHandle,
) -> Result<ServerConfig, String> {
    get_api_server_config(&app).await
}

/// Tauri 命令：更新 API 服务器配置
#[tauri::command]
async fn update_api_server_config_cmd(
    config: ServerConfig,
    app: tauri::AppHandle,
) -> Result<(), String> {
    update_api_server_config(&app, config).await
}

/// Tauri 命令：获取服务器监控统计信息
#[tauri::command]
async fn get_server_metrics_cmd(
    app: tauri::AppHandle,
) -> Result<ServerMetrics, String> {
    get_server_metrics(&app).await
}

/// Tauri 命令：获取服务器详细状态（包含监控信息）
#[tauri::command]
async fn get_server_detailed_status_cmd(
    app: tauri::AppHandle,
) -> Result<ServerDetailedStatus, String> {
    get_server_detailed_status(&app).await
}

/// Tauri 命令：查询用户列表
#[tauri::command]
async fn get_user_list_cmd(
    params: UserQueryParams,
    app: tauri::AppHandle,
) -> Result<UserListResponse, String> {
    get_user_list(&app, params).await
}

/// Tauri 命令：创建用户
#[tauri::command]
async fn create_user_cmd(
    username: String,
    password: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let request = CreateUserRequest { username, password };
    create_user(&app, request).await
}

/// Tauri 命令：删除用户
#[tauri::command]
async fn delete_user_cmd(
    username: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    delete_user(&app, &username).await
}

/// Tauri 命令：重置用户密码
#[tauri::command]
async fn update_user_password_cmd(
    username: String,
    new_password: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let request = UpdateUserPasswordRequest { username, new_password };
    update_user_password(&app, request).await
}

/// Tauri 命令：更新用户状态（启用/禁用）
#[tauri::command]
async fn update_user_status_cmd(
    username: String,
    enabled: bool,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let request = UpdateUserStatusRequest { username, enabled };
    update_user_status(&app, request).await
}

/// Tauri 命令：查询用户详情
#[tauri::command]
async fn get_user_detail_cmd(
    username: String,
    app: tauri::AppHandle,
) -> Result<Option<UserDetail>, String> {
    get_user_detail(&app, &username).await
}

/// Tauri 命令：查询角色列表
#[tauri::command]
async fn get_role_list_cmd(
    params: RoleQueryParams,
    app: tauri::AppHandle,
) -> Result<RoleListResponse, String> {
    get_role_list(&app, params).await
}

/// Tauri 命令：创建角色
#[tauri::command]
async fn create_role_cmd(
    role: String,
    username: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let request = CreateRoleRequest { role, username };
    create_role(&app, request).await
}

/// Tauri 命令：删除角色
#[tauri::command]
async fn delete_role_cmd(
    role: String,
    username: Option<String>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let request = DeleteRoleRequest { role, username };
    delete_role(&app, request).await
}

/// Tauri 命令：查询权限列表
#[tauri::command]
async fn get_permission_list_cmd(
    params: PermissionQueryParams,
    app: tauri::AppHandle,
) -> Result<PermissionListResponse, String> {
    get_permission_list(&app, params).await
}

/// Tauri 命令：创建权限
#[tauri::command]
async fn create_permission_cmd(
    role: String,
    resource: String,
    action: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let request = CreatePermissionRequest { role, resource, action };
    create_permission(&app, request).await
}

/// Tauri 命令：删除权限
#[tauri::command]
async fn delete_permission_cmd(
    role: String,
    resource: String,
    action: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let request = DeletePermissionRequest { role, resource, action };
    delete_permission(&app, request).await
}

/// Tauri 命令：检查权限
#[tauri::command]
async fn check_permission_cmd(
    role: String,
    resource: String,
    action: String,
    app: tauri::AppHandle,
) -> Result<bool, String> {
    check_permission(&app, &role, &resource, &action).await
}

/// Tauri 命令：验证 Token
#[tauri::command]
async fn validate_token_cmd(
    token: String,
    app: tauri::AppHandle,
) -> Result<ValidateTokenResponse, String> {
    let request = ValidateTokenRequest { token };
    validate_token(&app, request).await
}

/// Tauri 命令：刷新 Token
#[tauri::command]
async fn refresh_token_cmd(
    token: String,
    app: tauri::AppHandle,
) -> Result<RefreshTokenResponse, String> {
    let request = RefreshTokenRequest { token };
    refresh_token(&app, request).await
}

/// Tauri 命令：清理过期 Token
#[tauri::command]
async fn cleanup_expired_tokens_cmd(
    app: tauri::AppHandle,
) -> Result<u64, String> {
    cleanup_expired_tokens(&app).await
}

/// Tauri 命令：备份数据库
#[tauri::command]
async fn backup_database_cmd(
    backup_path: String,
    app: tauri::AppHandle,
) -> Result<String, String> {
    backup_database(&app, &backup_path).await
}

/// Tauri 命令：恢复数据库
#[tauri::command]
async fn restore_database_cmd(
    backup_path: String,
    app: tauri::AppHandle,
) -> Result<String, String> {
    restore_database(&app, &backup_path).await
}

/// Tauri 命令：获取数据库文件路径
#[tauri::command]
async fn get_database_file_path_cmd(
    app: tauri::AppHandle,
) -> Result<String, String> {
    get_database_file_path(&app).await
}

/// Tauri 命令：清理数据库（危险操作）
#[tauri::command]
async fn cleanup_database_cmd(
    app: tauri::AppHandle,
) -> Result<String, String> {
    cleanup_database(&app).await
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:nacos.db",
                    vec![
                        // Migration 1: 用户和权限表
                        tauri_plugin_sql::Migration {
                            version: 1,
                            description: "create users, roles, permissions tables",
                            sql: include_str!("db/migrations/001_users_and_permissions.sql"),
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                        // Migration 2: 命名空间表
                        tauri_plugin_sql::Migration {
                            version: 2,
                            description: "create tenant_info table",
                            sql: include_str!("db/migrations/002_tenant_info.sql"),
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                        // Migration 3: 配置相关表
                        tauri_plugin_sql::Migration {
                            version: 3,
                            description: "create config_info and config_history_info tables",
                            sql: include_str!("db/migrations/003_config_tables.sql"),
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                        // Migration 4: 服务相关表
                        tauri_plugin_sql::Migration {
                            version: 4,
                            description: "create service_info, instance_info, service_history_info tables",
                            sql: include_str!("db/migrations/004_service_tables.sql"),
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                        // Migration 5: Token 管理表
                        tauri_plugin_sql::Migration {
                            version: 5,
                            description: "create tokens table",
                            sql: include_str!("db/migrations/005_token_tables.sql"),
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                        // Migration 6: 订阅者表
                        tauri_plugin_sql::Migration {
                            version: 6,
                            description: "create subscribers table",
                            sql: include_str!("db/migrations/006_subscribers_table.sql"),
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                    ],
                )
                .build(),
        )
        .setup(|app| {
            // 初始化数据库（延迟执行，确保迁移完成）
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                // 等待一小段时间，确保迁移完成
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                
                if let Err(e) = db::init_database(&app_handle).await {
                    eprintln!("Failed to initialize database: {}", e);
                } else {
                    println!("Database initialized successfully");
                }

                // 清理过期 token
                if let Err(e) = cleanup_expired_tokens(&app_handle).await {
                    eprintln!("Failed to cleanup expired tokens: {}", e);
                } else {
                    println!("Expired tokens cleaned up");
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            login,
            register,
            check_admin_exists,
            // 用户管理 API
            get_user_list_cmd,
            get_user_detail_cmd,
            create_user_cmd,
            delete_user_cmd,
            update_user_password_cmd,
            update_user_status_cmd,
            // 角色管理 API
            get_role_list_cmd,
            create_role_cmd,
            delete_role_cmd,
            // 权限管理 API
            get_permission_list_cmd,
            create_permission_cmd,
            delete_permission_cmd,
            check_permission_cmd,
            // Token 管理 API
            validate_token_cmd,
            refresh_token_cmd,
            cleanup_expired_tokens_cmd,
            // 数据库管理 API
            backup_database_cmd,
            restore_database_cmd,
            get_database_file_path_cmd,
            cleanup_database_cmd,
            // 配置管理 API
            get_config_list_cmd,
            get_config_detail_cmd,
            create_config_cmd,
            update_config_cmd,
            delete_config_cmd,
            get_config_history_cmd,
            get_config_history_detail_cmd,
            get_history_configs_cmd,
            // 服务管理 API
            get_service_list_cmd,
            get_service_detail_cmd,
            create_service_cmd,
            update_service_cmd,
            delete_service_cmd,
            get_service_instances_cmd,
            register_instance_cmd,
            deregister_instance_cmd,
            update_instance_health_cmd,
            // 命名空间管理 API
            get_namespace_list_cmd,
            create_namespace_cmd,
            update_namespace_cmd,
            delete_namespace_cmd,
            // API 服务器管理 API
            start_api_server_cmd,
            stop_api_server_cmd,
            get_api_server_status_cmd,
            get_api_server_config_cmd,
            update_api_server_config_cmd,
            get_server_metrics_cmd,
            get_server_detailed_status_cmd,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
