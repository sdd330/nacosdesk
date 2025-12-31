/**
 * 数据库备份和恢复模块
 * 负责 SQLite 数据库的备份和恢复功能
 */

use tauri::AppHandle;
use std::path::PathBuf;
use std::fs;

/// 获取数据库文件路径
/// 注意：tauri-plugin-sql 使用 "sqlite:nacos.db" 作为连接标识
/// 实际文件路径可能在应用数据目录或当前工作目录
fn get_database_path(app: &AppHandle) -> Result<PathBuf, String> {
    // 尝试多个可能的位置
    let possible_paths = vec![
        // 应用数据目录
        app.path()
            .app_data_dir()
            .ok()
            .map(|p| p.join("nacos.db")),
        // 应用本地数据目录
        app.path()
            .app_local_data_dir()
            .ok()
            .map(|p| p.join("nacos.db")),
        // 当前工作目录（开发环境）
        Some(PathBuf::from("nacos.db")),
    ];
    
    // 查找存在的数据库文件
    for path in possible_paths.into_iter().flatten() {
        if path.exists() {
            return Ok(path);
        }
    }
    
    // 如果都不存在，返回应用数据目录的路径（用于创建新文件）
    let app_data_dir = app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    // 确保目录存在
    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    
    Ok(app_data_dir.join("nacos.db"))
}

/// 备份数据库
/// 将数据库文件复制到指定路径
pub async fn backup_database(
    app: &AppHandle,
    backup_path: &str,
) -> Result<String, String> {
    let db_path = get_database_path(app)?;
    
    // 检查数据库文件是否存在
    if !db_path.exists() {
        return Err("Database file does not exist".to_string());
    }
    
    let backup_path_buf = PathBuf::from(backup_path);
    
    // 确保备份目录存在
    if let Some(parent) = backup_path_buf.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create backup directory: {}", e))?;
    }
    
    // 复制数据库文件
    fs::copy(&db_path, &backup_path_buf)
        .map_err(|e| format!("Failed to copy database file: {}", e))?;
    
    Ok(format!("Database backed up to: {}", backup_path))
}

/// 恢复数据库
/// 从备份文件恢复数据库
pub async fn restore_database(
    app: &AppHandle,
    backup_path: &str,
) -> Result<String, String> {
    let backup_path_buf = PathBuf::from(backup_path);
    
    // 检查备份文件是否存在
    if !backup_path_buf.exists() {
        return Err("Backup file does not exist".to_string());
    }
    
    let db_path = get_database_path(app)?;
    
    // 如果数据库文件存在，先备份当前数据库（以防万一）
    if db_path.exists() {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let old_backup_path = db_path.parent()
            .unwrap()
            .join(format!("nacos.db.backup.{}", timestamp));
        fs::copy(&db_path, &old_backup_path)
            .map_err(|e| format!("Failed to backup current database: {}", e))?;
    }
    
    // 确保数据库目录存在
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create database directory: {}", e))?;
    }
    
    // 复制备份文件到数据库位置
    fs::copy(&backup_path_buf, &db_path)
        .map_err(|e| format!("Failed to restore database file: {}", e))?;
    
    Ok(format!("Database restored from: {}", backup_path))
}

/// 获取数据库文件路径
pub async fn get_database_file_path(app: &AppHandle) -> Result<String, String> {
    let db_path = get_database_path(app)?;
    Ok(db_path.to_string_lossy().to_string())
}

/// 清理数据库
/// 删除所有数据（危险操作，仅用于测试或重置）
pub async fn cleanup_database(app: &AppHandle) -> Result<String, String> {
    let db = app
        .sqlite_plugin()
        .get_connection("sqlite:nacos.db")
        .await
        .map_err(|e| format!("Failed to get database connection: {}", e))?;
    
    // 删除所有表的数据（保留表结构）
    let tables = vec![
        "tokens",
        "permissions",
        "roles",
        "users",
        "config_history_info",
        "config_info",
        "instance_info",
        "service_history_info",
        "service_info",
        "tenant_info",
    ];
    
    for table in tables {
        let _ = db.execute(
            &format!("DELETE FROM {}", table),
            &[],
        ).await;
    }
    
    Ok("Database cleaned up successfully".to_string())
}

