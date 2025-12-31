/**
 * 数据库模块
 * 负责 SQLite 数据库的初始化和连接管理
 */

mod backup;

use tauri::AppHandle;
pub use backup::{
    backup_database,
    restore_database,
    get_database_file_path,
    cleanup_database,
};

/// 数据库初始化
/// 初始化默认用户数据
/// 注意：schema 迁移由 tauri-plugin-sql 在插件初始化时自动处理
pub async fn init_database(app: &AppHandle) -> Result<(), String> {
    // 初始化默认用户数据
    init_default_user(app).await?;

    Ok(())
}

/// 初始化默认用户
/// 如果用户不存在，则插入默认的 nacos/nacos 用户
async fn init_default_user(app: &AppHandle) -> Result<(), String> {
    // 使用 tauri-plugin-sql 的 API
    // 注意：需要等待数据库迁移完成后再插入数据
    // 这里使用 app.state() 获取数据库连接池
    
    // 获取数据库连接
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // 查询用户是否存在
    let result: Option<(String,)> = db
        .query_one(
            "SELECT username FROM users WHERE username = ?1",
            &[("?1", "nacos")],
        )
        .await
        .map_err(|e| format!("Failed to query user: {}", e))?;

    match result {
        Some(_) => {
            println!("Default user 'nacos' already exists");
        }
        None => {
            // 默认密码 nacos 的 BCrypt 哈希值
            // 使用 bcrypt 库生成：$2a$10$EuWPZHzz32dJN7jexM34MOeYirDdFAZm2kuWj7VEOJhhZkDrxfvUu
            // 对应明文密码：nacos
            let default_password_hash = "$2a$10$EuWPZHzz32dJN7jexM34MOeYirDdFAZm2kuWj7VEOJhhZkDrxfvUu";

            db.execute(
                "INSERT INTO users (username, password, enabled) VALUES (?1, ?2, ?3)",
                &[
                    ("?1", "nacos"),
                    ("?2", default_password_hash),
                    ("?3", "1"), // true
                ],
            )
            .await
            .map_err(|e| format!("Failed to insert default user: {}", e))?;

            println!("Default user 'nacos' created successfully");
        }
    }

    Ok(())
}
