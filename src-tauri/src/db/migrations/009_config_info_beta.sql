-- Migration 9: Beta 配置表
-- 创建 Beta 配置表（用于灰度发布）

-- Beta 配置信息表（config_info_beta）
CREATE TABLE IF NOT EXISTS config_info_beta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_id VARCHAR(255) NOT NULL,
    group_id VARCHAR(128) NOT NULL DEFAULT 'DEFAULT_GROUP',
    tenant_id VARCHAR(128) DEFAULT '',
    app_name VARCHAR(128) DEFAULT NULL,
    content TEXT NOT NULL,
    beta_ips VARCHAR(1024) DEFAULT NULL,
    md5 VARCHAR(32) DEFAULT NULL,
    gmt_create INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    gmt_modified INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    src_user VARCHAR(128) DEFAULT NULL,
    src_ip VARCHAR(50) DEFAULT NULL,
    encrypted_data_key TEXT DEFAULT NULL,
    UNIQUE(data_id, group_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_config_info_beta_data_id ON config_info_beta(data_id);
CREATE INDEX IF NOT EXISTS idx_config_info_beta_group_id ON config_info_beta(group_id);
CREATE INDEX IF NOT EXISTS idx_config_info_beta_tenant_id ON config_info_beta(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_info_beta_data_group ON config_info_beta(data_id, group_id);

