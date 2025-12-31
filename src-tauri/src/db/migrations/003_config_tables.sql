-- Migration 3: 配置相关表
-- 创建配置信息表和配置历史表

-- 配置信息表（config_info）
CREATE TABLE IF NOT EXISTS config_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_id VARCHAR(255) NOT NULL,
    group_id VARCHAR(128) NOT NULL DEFAULT 'DEFAULT_GROUP',
    tenant_id VARCHAR(128) DEFAULT '',
    app_name VARCHAR(128) DEFAULT NULL,
    content TEXT NOT NULL,
    md5 VARCHAR(32) DEFAULT NULL,
    gmt_create INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    gmt_modified INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    src_user VARCHAR(128) DEFAULT NULL,
    src_ip VARCHAR(50) DEFAULT NULL,
    c_desc VARCHAR(256) DEFAULT NULL,
    c_use VARCHAR(64) DEFAULT NULL,
    effect VARCHAR(64) DEFAULT NULL,
    type VARCHAR(64) DEFAULT NULL,
    c_schema TEXT DEFAULT NULL,
    encrypted_data_key TEXT DEFAULT NULL,
    UNIQUE(data_id, group_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_config_info_data_id ON config_info(data_id);
CREATE INDEX IF NOT EXISTS idx_config_info_group_id ON config_info(group_id);
CREATE INDEX IF NOT EXISTS idx_config_info_tenant_id ON config_info(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_info_data_group ON config_info(data_id, group_id);

-- 配置历史表（config_history_info）
CREATE TABLE IF NOT EXISTS config_history_info (
    id INTEGER NOT NULL,
    nid INTEGER PRIMARY KEY AUTOINCREMENT,
    data_id VARCHAR(255) NOT NULL,
    group_id VARCHAR(128) NOT NULL DEFAULT 'DEFAULT_GROUP',
    tenant_id VARCHAR(128) DEFAULT '',
    app_name VARCHAR(128) DEFAULT NULL,
    content TEXT,
    md5 VARCHAR(32) DEFAULT NULL,
    gmt_create INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    gmt_modified INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    src_user VARCHAR(128) DEFAULT NULL,
    src_ip VARCHAR(50) DEFAULT NULL,
    publish_type VARCHAR(50) DEFAULT 'formal',
    gray_name VARCHAR(128) DEFAULT NULL,
    ext_info TEXT DEFAULT NULL,
    op_type CHAR(10) DEFAULT NULL,
    encrypted_data_key TEXT DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_config_history_info_data_id ON config_history_info(data_id);
CREATE INDEX IF NOT EXISTS idx_config_history_info_gmt_create ON config_history_info(gmt_create);
CREATE INDEX IF NOT EXISTS idx_config_history_info_gmt_modified ON config_history_info(gmt_modified);

