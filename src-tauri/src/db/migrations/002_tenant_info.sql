-- Migration 2: 命名空间表
-- 创建命名空间（tenant_info）表

CREATE TABLE IF NOT EXISTS tenant_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kp VARCHAR(128) NOT NULL DEFAULT '1',
    tenant_id VARCHAR(128) NOT NULL DEFAULT '',
    tenant_name VARCHAR(128) DEFAULT '',
    tenant_desc VARCHAR(256) DEFAULT NULL,
    create_source VARCHAR(32) DEFAULT NULL,
    gmt_create INTEGER NOT NULL,
    gmt_modified INTEGER NOT NULL,
    UNIQUE(kp, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_info_tenant_id ON tenant_info(tenant_id);

