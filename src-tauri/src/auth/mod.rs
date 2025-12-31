/**
 * 认证模块
 * 负责用户认证、密码验证、Token 生成等
 */

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use bcrypt::{hash, DEFAULT_COST};

/// 登录请求
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

/// 登录响应
#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub access_token: String,
    pub token_ttl: i64,
    pub global_admin: bool,
    pub username: String,
}

/// 用户信息
#[derive(Debug)]
struct User {
    username: String,
    password: String,
    enabled: bool,
}

/// 从数据库查询用户
async fn get_user_by_username(
    app: &AppHandle,
    username: &str,
) -> Result<Option<User>, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let result: Option<(String, String, bool)> = db
        .query_one(
            "SELECT username, password, enabled FROM users WHERE username = ?1",
            &[("?1", username)],
        )
        .await
        .map_err(|e| format!("Failed to query user: {}", e))?;

    Ok(result.map(|(username, password, enabled)| User {
        username,
        password,
        enabled,
    }))
}

/// 检查是否有管理员用户
pub async fn has_admin_user(app: &AppHandle) -> Result<bool, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let result: Option<(i64,)> = db
        .query_one(
            "SELECT COUNT(*) FROM users WHERE enabled = 1",
            &[],
        )
        .await
        .map_err(|e| format!("Failed to check admin users: {}", e))?;

    Ok(result.map(|(count,)| count > 0).unwrap_or(false))
}

/// 验证密码
/// 使用 BCrypt 验证明文密码和哈希密码
fn verify_password(raw_password: &str, hashed_password: &str) -> Result<bool, String> {
    bcrypt::verify(raw_password, hashed_password)
        .map_err(|e| format!("Password verification failed: {}", e))
}

/// 生成 Token
/// 第一阶段使用简单的 UUID，后续可升级为 JWT
fn generate_token() -> String {
    uuid::Uuid::new_v4().to_string()
}

/// 获取当前时间戳（秒）
fn current_timestamp() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

/// Token 常量
const TOKEN_TTL_SECONDS: i64 = 18000; // 5小时，与 Nacos 默认值一致

/// 登录处理
/// 验证用户名和密码，返回登录响应
pub async fn handle_login(
    app: &AppHandle,
    request: LoginRequest,
) -> Result<LoginResponse, String> {
    // 验证输入
    if request.username.is_empty() || request.password.is_empty() {
        return Err("Username and password are required".to_string());
    }

    // 查询用户
    let user = get_user_by_username(app, &request.username)
        .await?
        .ok_or_else(|| "User not found".to_string())?;

    // 检查用户是否启用
    if !user.enabled {
        return Err("User is disabled".to_string());
    }

    // 验证密码
    if !verify_password(&request.password, &user.password)? {
        return Err("Invalid password".to_string());
    }

    // 生成 Token
    let token = generate_token();
    
    // 存储 Token 到数据库
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let current_time = current_timestamp();
    let expires_at = current_time + TOKEN_TTL_SECONDS;

    // 删除该用户之前的 token（可选：可以允许多个 token 同时存在）
    // 这里选择删除旧 token，确保一个用户只有一个有效 token
    db.execute(
        "DELETE FROM tokens WHERE username = ?1",
        &[("?1", &user.username)],
    )
    .await
    .map_err(|e| format!("Failed to delete old tokens: {}", e))?;

    // 插入新 token
    db.execute(
        "INSERT INTO tokens (token, username, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)",
        &[
            ("?1", &token),
            ("?2", &user.username),
            ("?3", &current_time.to_string()),
            ("?4", &expires_at.to_string()),
        ],
    )
    .await
    .map_err(|e| format!("Failed to store token: {}", e))?;
    
    // 返回登录响应
    Ok(LoginResponse {
        access_token: token,
        token_ttl: TOKEN_TTL_SECONDS,
        global_admin: true, // 默认用户为全局管理员
        username: user.username,
    })
}

/// 注册请求（初始化管理员）
#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
}

/// 注册响应
#[derive(Debug, Serialize)]
pub struct RegisterResponse {
    pub username: String,
    pub password: String,
}

/// 注册处理（初始化管理员账户）
/// 创建管理员用户，返回生成的密码
pub async fn handle_register(
    app: &AppHandle,
    request: RegisterRequest,
) -> Result<RegisterResponse, String> {
    // 验证输入
    if request.username.is_empty() || request.password.is_empty() {
        return Err("Username and password are required".to_string());
    }

    // 检查用户是否已存在
    let existing_user = get_user_by_username(app, &request.username).await?;
    if existing_user.is_some() {
        return Err("User already exists".to_string());
    }

    // 生成密码哈希
    let password_hash = hash(&request.password, DEFAULT_COST)
        .map_err(|e| format!("Failed to hash password: {}", e))?;

    // 插入用户
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    db.execute(
        "INSERT INTO users (username, password, enabled) VALUES (?1, ?2, ?3)",
        &[
            ("?1", &request.username),
            ("?2", &password_hash),
            ("?3", "1"), // true
        ],
    )
    .await
    .map_err(|e| format!("Failed to create user: {}", e))?;

    // 返回注册响应（包含生成的密码）
    Ok(RegisterResponse {
        username: request.username,
        password: request.password, // 返回原始密码（前端会显示给用户）
    })
}

// ============================================
// 用户管理 API
// ============================================

/// 用户信息（用于列表查询）
#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub username: String,
    pub enabled: bool,
}

/// 用户详情信息
#[derive(Debug, Serialize)]
pub struct UserDetail {
    pub username: String,
    pub enabled: bool,
}

/// 用户查询参数
#[derive(Debug, Deserialize)]
pub struct UserQueryParams {
    pub page_no: Option<i64>,
    pub page_size: Option<i64>,
    pub username: Option<String>,
    pub search: Option<String>, // "accurate" | "blur"
}

/// 用户列表响应
#[derive(Debug, Serialize)]
pub struct UserListResponse {
    pub total_count: i64,
    pub page_number: i64,
    pub pages_available: i64,
    pub page_items: Vec<UserInfo>,
}

/// 创建用户请求
#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub password: String,
}

/// 更新用户密码请求
#[derive(Debug, Deserialize)]
pub struct UpdateUserPasswordRequest {
    pub username: String,
    pub new_password: String,
}

/// 更新用户状态请求
#[derive(Debug, Deserialize)]
pub struct UpdateUserStatusRequest {
    pub username: String,
    pub enabled: bool,
}

/// 查询用户列表
pub async fn get_user_list(
    app: &AppHandle,
    params: UserQueryParams,
) -> Result<UserListResponse, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 默认分页参数
    let page_no = params.page_no.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(10);
    let offset = (page_no - 1) * page_size;

    // 构建查询条件
    let mut where_clauses = Vec::new();
    let mut query_params: Vec<(&str, &str)> = Vec::new();
    let mut param_index = 1;

    if let Some(ref username) = params.username {
        if !username.is_empty() {
            let search_mode = params.search.as_deref().unwrap_or("blur");
            if search_mode == "accurate" {
                where_clauses.push(format!("username = ?{}", param_index));
                query_params.push((&format!("?{}", param_index), username));
                param_index += 1;
            } else {
                where_clauses.push(format!("username LIKE ?{}", param_index));
                query_params.push((&format!("?{}", param_index), &format!("%{}%", username)));
                param_index += 1;
            }
        }
    }

    let where_clause = if where_clauses.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", where_clauses.join(" AND "))
    };

    // 查询总数
    let count_query = format!("SELECT COUNT(*) FROM users {}", where_clause);
    let total_count: Option<(i64,)> = db
        .query_one(&count_query, &query_params)
        .await
        .map_err(|e| format!("Failed to query user count: {}", e))?;
    let total_count = total_count.map(|(count,)| count).unwrap_or(0);

    // 查询用户列表
    let list_query = format!(
        "SELECT username, enabled FROM users {} ORDER BY username LIMIT ?{} OFFSET ?{}",
        where_clause, param_index, param_index + 1
    );
    query_params.push((&format!("?{}", param_index), &page_size.to_string()));
    query_params.push((&format!("?{}", param_index + 1), &offset.to_string()));

    let rows: Vec<(String, bool)> = db
        .query(&list_query, &query_params)
        .await
        .map_err(|e| format!("Failed to query user list: {}", e))?;

    let page_items: Vec<UserInfo> = rows
        .into_iter()
        .map(|(username, enabled)| UserInfo { username, enabled })
        .collect();

    let pages_available = (total_count + page_size - 1) / page_size;

    Ok(UserListResponse {
        total_count,
        page_number: page_no,
        pages_available,
        page_items,
    })
}

/// 创建用户
pub async fn create_user(
    app: &AppHandle,
    request: CreateUserRequest,
) -> Result<(), String> {
    // 验证输入
    if request.username.is_empty() || request.password.is_empty() {
        return Err("Username and password are required".to_string());
    }

    // 检查用户是否已存在
    let existing_user = get_user_by_username(app, &request.username).await?;
    if existing_user.is_some() {
        return Err(format!("User '{}' already exists", request.username));
    }

    // 生成密码哈希
    let password_hash = hash(&request.password, DEFAULT_COST)
        .map_err(|e| format!("Failed to hash password: {}", e))?;

    // 插入用户
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    db.execute(
        "INSERT INTO users (username, password, enabled) VALUES (?1, ?2, ?3)",
        &[
            ("?1", &request.username),
            ("?2", &password_hash),
            ("?3", "1"), // true
        ],
    )
    .await
    .map_err(|e| format!("Failed to create user: {}", e))?;

    Ok(())
}

/// 删除用户
pub async fn delete_user(
    app: &AppHandle,
    username: &str,
) -> Result<(), String> {
    if username.is_empty() {
        return Err("Username is required".to_string());
    }

    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 删除用户（如果不存在也不会报错）
    db.execute(
        "DELETE FROM users WHERE username = ?1",
        &[("?1", username)],
    )
    .await
    .map_err(|e| format!("Failed to delete user: {}", e))?;

    Ok(())
}

/// 更新用户密码
pub async fn update_user_password(
    app: &AppHandle,
    request: UpdateUserPasswordRequest,
) -> Result<(), String> {
    // 验证输入
    if request.username.is_empty() || request.new_password.is_empty() {
        return Err("Username and new password are required".to_string());
    }

    // 检查用户是否存在
    let existing_user = get_user_by_username(app, &request.username).await?;
    if existing_user.is_none() {
        return Err(format!("User '{}' not found", request.username));
    }

    // 生成密码哈希
    let password_hash = hash(&request.new_password, DEFAULT_COST)
        .map_err(|e| format!("Failed to hash password: {}", e))?;

    // 更新密码
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    db.execute(
        "UPDATE users SET password = ?1 WHERE username = ?2",
        &[
            ("?1", &password_hash),
            ("?2", &request.username),
        ],
    )
    .await
    .map_err(|e| format!("Failed to update user password: {}", e))?;

    Ok(())
}

/// 更新用户状态（启用/禁用）
pub async fn update_user_status(
    app: &AppHandle,
    request: UpdateUserStatusRequest,
) -> Result<(), String> {
    if request.username.is_empty() {
        return Err("Username is required".to_string());
    }

    // 检查用户是否存在
    let existing_user = get_user_by_username(app, &request.username).await?;
    if existing_user.is_none() {
        return Err(format!("User '{}' not found", request.username));
    }

    // 更新状态
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let enabled_value = if request.enabled { "1" } else { "0" };
    db.execute(
        "UPDATE users SET enabled = ?1 WHERE username = ?2",
        &[
            ("?1", enabled_value),
            ("?2", &request.username),
        ],
    )
    .await
    .map_err(|e| format!("Failed to update user status: {}", e))?;

    Ok(())
}

/// 查询用户详情
pub async fn get_user_detail(
    app: &AppHandle,
    username: &str,
) -> Result<Option<UserDetail>, String> {
    if username.is_empty() {
        return Err("Username is required".to_string());
    }

    let user = get_user_by_username(app, username).await?;
    
    Ok(user.map(|u| UserDetail {
        username: u.username,
        enabled: u.enabled,
    }))
}

// ============================================
// 角色管理 API
// ============================================

/// 角色信息
#[derive(Debug, Serialize)]
pub struct RoleInfo {
    pub role: String,
    pub username: String,
}

/// 角色查询参数
#[derive(Debug, Deserialize)]
pub struct RoleQueryParams {
    pub page_no: Option<i64>,
    pub page_size: Option<i64>,
    pub username: Option<String>,
    pub role: Option<String>,
    pub search: Option<String>, // "accurate" | "blur"
}

/// 角色列表响应
#[derive(Debug, Serialize)]
pub struct RoleListResponse {
    pub total_count: i64,
    pub page_number: i64,
    pub pages_available: i64,
    pub page_items: Vec<RoleInfo>,
}

/// 创建角色请求
#[derive(Debug, Deserialize)]
pub struct CreateRoleRequest {
    pub role: String,
    pub username: String,
}

/// 删除角色请求
#[derive(Debug, Deserialize)]
pub struct DeleteRoleRequest {
    pub role: String,
    pub username: Option<String>, // 如果为空，删除整个角色
}

/// 全局管理员角色常量
const GLOBAL_ADMIN_ROLE: &str = "ROLE_ADMIN";

/// 查询角色列表
pub async fn get_role_list(
    app: &AppHandle,
    params: RoleQueryParams,
) -> Result<RoleListResponse, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 默认分页参数
    let page_no = params.page_no.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(10);
    let offset = (page_no - 1) * page_size;

    // 构建查询条件
    let mut where_clauses = Vec::new();
    let mut query_params: Vec<(&str, &str)> = Vec::new();
    let mut param_index = 1;

    if let Some(ref username) = params.username {
        if !username.is_empty() {
            let search_mode = params.search.as_deref().unwrap_or("blur");
            if search_mode == "accurate" {
                where_clauses.push(format!("username = ?{}", param_index));
                query_params.push((&format!("?{}", param_index), username));
                param_index += 1;
            } else {
                where_clauses.push(format!("username LIKE ?{}", param_index));
                query_params.push((&format!("?{}", param_index), &format!("%{}%", username)));
                param_index += 1;
            }
        }
    }

    if let Some(ref role) = params.role {
        if !role.is_empty() {
            let search_mode = params.search.as_deref().unwrap_or("blur");
            if search_mode == "accurate" {
                where_clauses.push(format!("role = ?{}", param_index));
                query_params.push((&format!("?{}", param_index), role));
                param_index += 1;
            } else {
                where_clauses.push(format!("role LIKE ?{}", param_index));
                query_params.push((&format!("?{}", param_index), &format!("%{}%", role)));
                param_index += 1;
            }
        }
    }

    let where_clause = if where_clauses.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", where_clauses.join(" AND "))
    };

    // 查询总数
    let count_query = format!("SELECT COUNT(*) FROM roles {}", where_clause);
    let total_count: Option<(i64,)> = db
        .query_one(&count_query, &query_params)
        .await
        .map_err(|e| format!("Failed to query role count: {}", e))?;
    let total_count = total_count.map(|(count,)| count).unwrap_or(0);

    // 查询角色列表
    let list_query = format!(
        "SELECT role, username FROM roles {} ORDER BY role, username LIMIT ?{} OFFSET ?{}",
        where_clause, param_index, param_index + 1
    );
    query_params.push((&format!("?{}", param_index), &page_size.to_string()));
    query_params.push((&format!("?{}", param_index + 1), &offset.to_string()));

    let rows: Vec<(String, String)> = db
        .query(&list_query, &query_params)
        .await
        .map_err(|e| format!("Failed to query role list: {}", e))?;

    let page_items: Vec<RoleInfo> = rows
        .into_iter()
        .map(|(role, username)| RoleInfo { role, username })
        .collect();

    let pages_available = (total_count + page_size - 1) / page_size;

    Ok(RoleListResponse {
        total_count,
        page_number: page_no,
        pages_available,
        page_items,
    })
}

/// 创建角色（绑定角色到用户）
pub async fn create_role(
    app: &AppHandle,
    request: CreateRoleRequest,
) -> Result<(), String> {
    // 验证输入
    if request.role.is_empty() || request.username.is_empty() {
        return Err("Role and username are required".to_string());
    }

    // 不能创建全局管理员角色
    if request.role == GLOBAL_ADMIN_ROLE {
        return Err(format!("Role '{}' is not permitted to create!", GLOBAL_ADMIN_ROLE));
    }

    // 检查用户是否存在
    let existing_user = get_user_by_username(app, &request.username).await?;
    if existing_user.is_none() {
        return Err(format!("User '{}' not found", request.username));
    }

    // 检查角色是否已绑定到用户
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let existing_role: Option<(String,)> = db
        .query_one(
            "SELECT role FROM roles WHERE role = ?1 AND username = ?2",
            &[("?1", &request.role), ("?2", &request.username)],
        )
        .await
        .map_err(|e| format!("Failed to check existing role: {}", e))?;

    if existing_role.is_some() {
        return Err(format!("User '{}' already bound to the role '{}'!", request.username, request.role));
    }

    // 插入角色
    db.execute(
        "INSERT INTO roles (role, username) VALUES (?1, ?2)",
        &[
            ("?1", &request.role),
            ("?2", &request.username),
        ],
    )
    .await
    .map_err(|e| format!("Failed to create role: {}", e))?;

    Ok(())
}

/// 删除角色
pub async fn delete_role(
    app: &AppHandle,
    request: DeleteRoleRequest,
) -> Result<(), String> {
    if request.role.is_empty() {
        return Err("Role is required".to_string());
    }

    // 不能删除全局管理员角色
    if request.role == GLOBAL_ADMIN_ROLE {
        return Err(format!("Role '{}' is not permitted to delete!", GLOBAL_ADMIN_ROLE));
    }

    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 如果指定了用户名，只删除该用户的角色；否则删除整个角色
    if let Some(ref username) = request.username {
        if !username.is_empty() {
            db.execute(
                "DELETE FROM roles WHERE role = ?1 AND username = ?2",
                &[
                    ("?1", &request.role),
                    ("?2", username),
                ],
            )
            .await
            .map_err(|e| format!("Failed to delete role: {}", e))?;
        } else {
            // 删除整个角色
            db.execute(
                "DELETE FROM roles WHERE role = ?1",
                &[("?1", &request.role)],
            )
            .await
            .map_err(|e| format!("Failed to delete role: {}", e))?;
        }
    } else {
        // 删除整个角色
        db.execute(
            "DELETE FROM roles WHERE role = ?1",
            &[("?1", &request.role)],
        )
        .await
        .map_err(|e| format!("Failed to delete role: {}", e))?;
    }

    Ok(())
}

// ============================================
// 权限管理 API
// ============================================

/// 权限信息
#[derive(Debug, Serialize)]
pub struct PermissionInfo {
    pub role: String,
    pub resource: String,
    pub action: String,
}

/// 权限查询参数
#[derive(Debug, Deserialize)]
pub struct PermissionQueryParams {
    pub page_no: Option<i64>,
    pub page_size: Option<i64>,
    pub role: Option<String>,
    pub resource: Option<String>,
    pub action: Option<String>,
    pub search: Option<String>, // "accurate" | "blur"
}

/// 权限列表响应
#[derive(Debug, Serialize)]
pub struct PermissionListResponse {
    pub total_count: i64,
    pub page_number: i64,
    pub pages_available: i64,
    pub page_items: Vec<PermissionInfo>,
}

/// 创建权限请求
#[derive(Debug, Deserialize)]
pub struct CreatePermissionRequest {
    pub role: String,
    pub resource: String,
    pub action: String,
}

/// 删除权限请求
#[derive(Debug, Deserialize)]
pub struct DeletePermissionRequest {
    pub role: String,
    pub resource: String,
    pub action: String,
}

/// 查询权限列表
pub async fn get_permission_list(
    app: &AppHandle,
    params: PermissionQueryParams,
) -> Result<PermissionListResponse, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 默认分页参数
    let page_no = params.page_no.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(10);
    let offset = (page_no - 1) * page_size;

    // 构建查询条件
    let mut where_clauses = Vec::new();
    let mut query_params: Vec<(&str, &str)> = Vec::new();
    let mut param_index = 1;

    if let Some(ref role) = params.role {
        if !role.is_empty() {
            let search_mode = params.search.as_deref().unwrap_or("blur");
            if search_mode == "accurate" {
                where_clauses.push(format!("role = ?{}", param_index));
                query_params.push((&format!("?{}", param_index), role));
                param_index += 1;
            } else {
                where_clauses.push(format!("role LIKE ?{}", param_index));
                query_params.push((&format!("?{}", param_index), &format!("%{}%", role)));
                param_index += 1;
            }
        }
    }

    if let Some(ref resource) = params.resource {
        if !resource.is_empty() {
            let search_mode = params.search.as_deref().unwrap_or("blur");
            if search_mode == "accurate" {
                where_clauses.push(format!("resource = ?{}", param_index));
                query_params.push((&format!("?{}", param_index), resource));
                param_index += 1;
            } else {
                where_clauses.push(format!("resource LIKE ?{}", param_index));
                query_params.push((&format!("?{}", param_index), &format!("%{}%", resource)));
                param_index += 1;
            }
        }
    }

    if let Some(ref action) = params.action {
        if !action.is_empty() {
            let search_mode = params.search.as_deref().unwrap_or("blur");
            if search_mode == "accurate" {
                where_clauses.push(format!("action = ?{}", param_index));
                query_params.push((&format!("?{}", param_index), action));
                param_index += 1;
            } else {
                where_clauses.push(format!("action LIKE ?{}", param_index));
                query_params.push((&format!("?{}", param_index), &format!("%{}%", action)));
                param_index += 1;
            }
        }
    }

    let where_clause = if where_clauses.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", where_clauses.join(" AND "))
    };

    // 查询总数
    let count_query = format!("SELECT COUNT(*) FROM permissions {}", where_clause);
    let total_count: Option<(i64,)> = db
        .query_one(&count_query, &query_params)
        .await
        .map_err(|e| format!("Failed to query permission count: {}", e))?;
    let total_count = total_count.map(|(count,)| count).unwrap_or(0);

    // 查询权限列表
    let list_query = format!(
        "SELECT role, resource, action FROM permissions {} ORDER BY role, resource, action LIMIT ?{} OFFSET ?{}",
        where_clause, param_index, param_index + 1
    );
    query_params.push((&format!("?{}", param_index), &page_size.to_string()));
    query_params.push((&format!("?{}", param_index + 1), &offset.to_string()));

    let rows: Vec<(String, String, String)> = db
        .query(&list_query, &query_params)
        .await
        .map_err(|e| format!("Failed to query permission list: {}", e))?;

    let page_items: Vec<PermissionInfo> = rows
        .into_iter()
        .map(|(role, resource, action)| PermissionInfo { role, resource, action })
        .collect();

    let pages_available = (total_count + page_size - 1) / page_size;

    Ok(PermissionListResponse {
        total_count,
        page_number: page_no,
        pages_available,
        page_items,
    })
}

/// 创建权限
pub async fn create_permission(
    app: &AppHandle,
    request: CreatePermissionRequest,
) -> Result<(), String> {
    // 验证输入
    if request.role.is_empty() || request.resource.is_empty() || request.action.is_empty() {
        return Err("Role, resource and action are required".to_string());
    }

    // 验证 action 只能是 "r" 或 "w"
    if request.action != "r" && request.action != "w" {
        return Err("Action must be 'r' (read) or 'w' (write)".to_string());
    }

    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 检查权限是否已存在
    let existing_permission: Option<(String,)> = db
        .query_one(
            "SELECT role FROM permissions WHERE role = ?1 AND resource = ?2 AND action = ?3",
            &[
                ("?1", &request.role),
                ("?2", &request.resource),
                ("?3", &request.action),
            ],
        )
        .await
        .map_err(|e| format!("Failed to check existing permission: {}", e))?;

    if existing_permission.is_some() {
        return Err(format!(
            "Permission already exists: role='{}', resource='{}', action='{}'",
            request.role, request.resource, request.action
        ));
    }

    // 插入权限
    db.execute(
        "INSERT INTO permissions (role, resource, action) VALUES (?1, ?2, ?3)",
        &[
            ("?1", &request.role),
            ("?2", &request.resource),
            ("?3", &request.action),
        ],
    )
    .await
    .map_err(|e| format!("Failed to create permission: {}", e))?;

    Ok(())
}

/// 删除权限
pub async fn delete_permission(
    app: &AppHandle,
    request: DeletePermissionRequest,
) -> Result<(), String> {
    if request.role.is_empty() || request.resource.is_empty() || request.action.is_empty() {
        return Err("Role, resource and action are required".to_string());
    }

    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    db.execute(
        "DELETE FROM permissions WHERE role = ?1 AND resource = ?2 AND action = ?3",
        &[
            ("?1", &request.role),
            ("?2", &request.resource),
            ("?3", &request.action),
        ],
    )
    .await
    .map_err(|e| format!("Failed to delete permission: {}", e))?;

    Ok(())
}

/// 检查权限
/// 注意：这里的 role 参数应该是角色名，不是用户名
/// 如果需要检查用户的权限，应该先通过用户名获取角色列表，然后检查每个角色的权限
pub async fn check_permission(
    app: &AppHandle,
    role: &str,
    resource: &str,
    action: &str,
) -> Result<bool, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 如果角色是全局管理员，直接返回 true
    if role == GLOBAL_ADMIN_ROLE {
        return Ok(true);
    }

    // 检查具体权限
    let permission: Option<(String,)> = db
        .query_one(
            "SELECT role FROM permissions WHERE role = ?1 AND resource = ?2 AND action = ?3",
            &[
                ("?1", role),
                ("?2", resource),
                ("?3", action),
            ],
        )
        .await
        .map_err(|e| format!("Failed to check permission: {}", e))?;

    Ok(permission.is_some())
}

// ============================================
// Token 管理 API
// ============================================

/// Token 验证请求
#[derive(Debug, Deserialize)]
pub struct ValidateTokenRequest {
    pub token: String,
}

/// Token 验证响应
#[derive(Debug, Serialize)]
pub struct ValidateTokenResponse {
    pub valid: bool,
    pub username: Option<String>,
    pub expires_at: Option<i64>,
    pub remaining_ttl: Option<i64>,
}

/// Token 刷新请求
#[derive(Debug, Deserialize)]
pub struct RefreshTokenRequest {
    pub token: String,
}

/// Token 刷新响应
#[derive(Debug, Serialize)]
pub struct RefreshTokenResponse {
    pub token: String,
    pub token_ttl: i64,
    pub expires_at: i64,
}

/// 验证 Token
pub async fn validate_token(
    app: &AppHandle,
    request: ValidateTokenRequest,
) -> Result<ValidateTokenResponse, String> {
    if request.token.is_empty() {
        return Ok(ValidateTokenResponse {
            valid: false,
            username: None,
            expires_at: None,
            remaining_ttl: None,
        });
    }

    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 查询 token
    let token_info: Option<(String, i64)> = db
        .query_one(
            "SELECT username, expires_at FROM tokens WHERE token = ?1",
            &[("?1", &request.token)],
        )
        .await
        .map_err(|e| format!("Failed to query token: {}", e))?;

    match token_info {
        Some((username, expires_at)) => {
            let current_time = current_timestamp();
            let valid = expires_at > current_time;
            let remaining_ttl = if valid {
                Some(expires_at - current_time)
            } else {
                // Token 已过期，删除它
                let _ = db
                    .execute(
                        "DELETE FROM tokens WHERE token = ?1",
                        &[("?1", &request.token)],
                    )
                    .await;
                None
            };

            Ok(ValidateTokenResponse {
                valid,
                username: if valid { Some(username) } else { None },
                expires_at: if valid { Some(expires_at) } else { None },
                remaining_ttl,
            })
        }
        None => Ok(ValidateTokenResponse {
            valid: false,
            username: None,
            expires_at: None,
            remaining_ttl: None,
        }),
    }
}

/// 刷新 Token
pub async fn refresh_token(
    app: &AppHandle,
    request: RefreshTokenRequest,
) -> Result<RefreshTokenResponse, String> {
    if request.token.is_empty() {
        return Err("Token is required".to_string());
    }

    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 查询 token 信息
    let token_info: Option<(String, i64)> = db
        .query_one(
            "SELECT username, expires_at FROM tokens WHERE token = ?1",
            &[("?1", &request.token)],
        )
        .await
        .map_err(|e| format!("Failed to query token: {}", e))?;

    let (username, old_expires_at) = token_info.ok_or_else(|| "Token not found".to_string())?;

    let current_time = current_timestamp();
    if old_expires_at <= current_time {
        // Token 已过期，删除它
        let _ = db
            .execute(
                "DELETE FROM tokens WHERE token = ?1",
                &[("?1", &request.token)],
            )
            .await;
        return Err("Token has expired".to_string());
    }

    // 生成新 token
    let new_token = generate_token();
    let new_expires_at = current_time + TOKEN_TTL_SECONDS;

    // 删除旧 token
    db.execute(
        "DELETE FROM tokens WHERE token = ?1",
        &[("?1", &request.token)],
    )
    .await
    .map_err(|e| format!("Failed to delete old token: {}", e))?;

    // 插入新 token
    db.execute(
        "INSERT INTO tokens (token, username, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)",
        &[
            ("?1", &new_token),
            ("?2", &username),
            ("?3", &current_time.to_string()),
            ("?4", &new_expires_at.to_string()),
        ],
    )
    .await
    .map_err(|e| format!("Failed to store new token: {}", e))?;

    Ok(RefreshTokenResponse {
        token: new_token,
        token_ttl: TOKEN_TTL_SECONDS,
        expires_at: new_expires_at,
    })
}

/// 清理过期 Token
/// 定期清理过期的 token，可以在应用启动时或定期任务中调用
pub async fn cleanup_expired_tokens(app: &AppHandle) -> Result<u64, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let current_time = current_timestamp();
    db.execute(
        "DELETE FROM tokens WHERE expires_at <= ?1",
        &[("?1", &current_time.to_string())],
    )
    .await
    .map_err(|e| format!("Failed to cleanup expired tokens: {}", e))?;

    // 注意：tauri-plugin-sql 的 execute 方法不返回受影响的行数
    // 这里返回 0 作为占位符
    Ok(0)
}
