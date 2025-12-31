/**
 * 数据库测试辅助模块
 * 提供测试用的数据库设置和清理功能
 */

use std::path::PathBuf;
use std::sync::Arc;
use tempfile::TempDir;

/// 测试数据库管理器
pub struct TestDatabase {
    pub temp_dir: TempDir,
    pub db_path: PathBuf,
    pub app: Arc<tauri::AppHandle>,
}

impl TestDatabase {
    /// 创建测试数据库
    pub async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        // 创建临时目录
        let temp_dir = tempfile::tempdir()?;
        let db_path = temp_dir.path().join("test_nacos.db");
        
        // 初始化数据库（运行迁移）
        Self::run_migrations(&db_path).await?;
        
        // 创建测试用的 Tauri app（使用 mock_app）
        let app = tauri::test::mock_app();
        let app_handle = Arc::new(app.handle());
        
        Ok(Self {
            temp_dir,
            db_path,
            app: app_handle,
        })
    }
    
    /// 运行数据库迁移
    async fn run_migrations(
        db_path: &std::path::Path,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // 注意：这里需要手动运行迁移，因为 tauri-plugin-sql 的迁移是自动的
        // 在测试环境中，我们需要手动执行 SQL 文件
        
        // 读取所有迁移文件
        let migrations = vec![
            ("001_users_and_permissions.sql", include_str!("../../db/migrations/001_users_and_permissions.sql")),
            ("002_tenant_info.sql", include_str!("../../db/migrations/002_tenant_info.sql")),
            ("003_config_tables.sql", include_str!("../../db/migrations/003_config_tables.sql")),
            ("004_service_tables.sql", include_str!("../../db/migrations/004_service_tables.sql")),
            ("005_token_tables.sql", include_str!("../../db/migrations/005_token_tables.sql")),
            ("006_subscribers_table.sql", include_str!("../../db/migrations/006_subscribers_table.sql")),
            ("007_heartbeats_table.sql", include_str!("../../db/migrations/007_heartbeats_table.sql")),
            ("008_api_logs_table.sql", include_str!("../../db/migrations/008_api_logs_table.sql")),
            ("009_config_info_beta.sql", include_str!("../../db/migrations/009_config_info_beta.sql")),
            ("010_performance_indexes.sql", include_str!("../../db/migrations/010_performance_indexes.sql")),
        ];
        
        // 使用 sqlx 直接执行迁移
        let database_url = format!("sqlite:{}", db_path.display());
        let pool = sqlx::SqlitePool::connect(&database_url).await?;
        
        for (name, sql) in migrations {
            println!("Running migration: {}", name);
            // 分割 SQL 语句（按分号），并执行每个语句
            for statement in sql.split(';') {
                let statement = statement.trim();
                // 跳过空语句和注释
                if statement.is_empty() || statement.starts_with("--") {
                    continue;
                }
                // 执行 SQL 语句
                if let Err(e) = sqlx::query(statement).execute(&pool).await {
                    // 如果执行失败，打印错误但继续（某些语句可能已经存在）
                    eprintln!("Warning: Failed to execute statement in {}: {}", name, e);
                }
            }
        }
        
        // 插入默认用户
        let default_password_hash = "$2a$10$EuWPZHzz32dJN7jexM34MOeYirDdFAZm2kuWj7VEOJhhZkDrxfvUu";
        sqlx::query(
            "INSERT OR IGNORE INTO users (username, password, enabled) VALUES ('nacos', ?, '1')"
        )
        .bind(default_password_hash)
        .execute(&pool)
        .await?;
        
        pool.close().await;
        
        Ok(())
    }
    
    /// 清理测试数据
    pub async fn cleanup(&self) -> Result<(), Box<dyn std::error::Error>> {
        // 删除所有测试数据
        let database_url = format!("sqlite:{}", self.db_path.display());
        let pool = sqlx::SqlitePool::connect(&database_url).await?;
        
        // 清理所有表的数据（保留表结构）
        sqlx::query("DELETE FROM config_info").execute(&pool).await?;
        sqlx::query("DELETE FROM config_history_info").execute(&pool).await?;
        sqlx::query("DELETE FROM service_info").execute(&pool).await?;
        sqlx::query("DELETE FROM instance_info").execute(&pool).await?;
        sqlx::query("DELETE FROM tenant_info").execute(&pool).await?;
        sqlx::query("DELETE FROM subscribers").execute(&pool).await?;
        sqlx::query("DELETE FROM tokens").execute(&pool).await?;
        sqlx::query("DELETE FROM users WHERE username != 'nacos'").execute(&pool).await?;
        
        pool.close().await;
        Ok(())
    }
    
    /// 插入测试用户
    pub async fn insert_test_user(
        &self,
        username: &str,
        password_hash: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let database_url = format!("sqlite:{}", self.db_path.display());
        let pool = sqlx::SqlitePool::connect(&database_url).await?;
        
        sqlx::query(
            "INSERT OR REPLACE INTO users (username, password, enabled) VALUES (?, ?, ?)"
        )
        .bind(username)
        .bind(password_hash)
        .bind("1")
        .execute(&pool)
        .await?;
        
        pool.close().await;
        Ok(())
    }
    
    /// 插入测试配置
    pub async fn insert_test_config(
        &self,
        data_id: &str,
        group: &str,
        tenant: &str,
        content: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let database_url = format!("sqlite:{}", self.db_path.display());
        let pool = sqlx::SqlitePool::connect(&database_url).await?;
        
        let md5_hash = format!("{:x}", md5::compute(content));
        
        sqlx::query(
            "INSERT OR REPLACE INTO config_info (data_id, group_id, tenant_id, content, md5, type) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(data_id)
        .bind(group)
        .bind(tenant)
        .bind(content)
        .bind(&md5_hash)
        .bind("text")
        .execute(&pool)
        .await?;
        
        pool.close().await;
        Ok(())
    }
    
    /// 插入测试服务
    pub async fn insert_test_service(
        &self,
        service_name: &str,
        namespace_id: &str,
        group_name: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let database_url = format!("sqlite:{}", self.db_path.display());
        let pool = sqlx::SqlitePool::connect(&database_url).await?;
        
        sqlx::query(
            "INSERT OR REPLACE INTO service_info (service_name, namespace_id, group_name) VALUES (?, ?, ?)"
        )
        .bind(service_name)
        .bind(namespace_id)
        .bind(group_name)
        .execute(&pool)
        .await?;
        
        pool.close().await;
        Ok(())
    }
    
    /// 插入测试实例
    pub async fn insert_test_instance(
        &self,
        service_name: &str,
        namespace_id: &str,
        group_name: &str,
        ip: &str,
        port: i32,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let database_url = format!("sqlite:{}", self.db_path.display());
        let pool = sqlx::SqlitePool::connect(&database_url).await?;
        
        let instance_id = format!("{}#{}#{}#{}", ip, port, namespace_id, "DEFAULT");
        
        sqlx::query(
            "INSERT OR REPLACE INTO instance_info (instance_id, service_name, namespace_id, group_name, ip, port, healthy, enabled, ephemeral) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&instance_id)
        .bind(service_name)
        .bind(namespace_id)
        .bind(group_name)
        .bind(ip)
        .bind(port)
        .bind(1) // healthy
        .bind(1) // enabled
        .bind(1) // ephemeral
        .execute(&pool)
        .await?;
        
        pool.close().await;
        Ok(())
    }
    
    /// 插入测试命名空间
    pub async fn insert_test_namespace(
        &self,
        namespace_id: &str,
        namespace_name: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let database_url = format!("sqlite:{}", self.db_path.display());
        let pool = sqlx::SqlitePool::connect(&database_url).await?;
        
        sqlx::query(
            "INSERT OR REPLACE INTO tenant_info (kp, tenant_id, tenant_name, gmt_create, gmt_modified) VALUES ('1', ?, ?, strftime('%s', 'now'), strftime('%s', 'now'))"
        )
        .bind(namespace_id)
        .bind(namespace_name)
        .execute(&pool)
        .await?;
        
        pool.close().await;
        Ok(())
    }
}

impl Drop for TestDatabase {
    fn drop(&mut self) {
        // TempDir 会自动清理临时文件
    }
}

