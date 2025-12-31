-- Migration 4: 服务相关表
-- 创建服务信息表、实例信息表和服务历史表

-- 服务信息表（service_info）
CREATE TABLE IF NOT EXISTS service_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    namespace_id VARCHAR(128) NOT NULL DEFAULT '',
    group_name VARCHAR(128) NOT NULL DEFAULT 'DEFAULT_GROUP',
    service_name VARCHAR(128) NOT NULL,
    metadata TEXT DEFAULT NULL,
    protect_threshold REAL DEFAULT 0.0,
    selector_type VARCHAR(32) DEFAULT NULL,
    selector TEXT DEFAULT NULL,
    gmt_create INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    gmt_modified INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    UNIQUE(namespace_id, group_name, service_name)
);

CREATE INDEX IF NOT EXISTS idx_service_info_namespace_id ON service_info(namespace_id);
CREATE INDEX IF NOT EXISTS idx_service_info_service_name ON service_info(service_name);
CREATE INDEX IF NOT EXISTS idx_service_info_namespace_service ON service_info(namespace_id, service_name);

-- 实例信息表（instance_info）
CREATE TABLE IF NOT EXISTS instance_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    namespace_id VARCHAR(128) NOT NULL DEFAULT '',
    group_name VARCHAR(128) NOT NULL DEFAULT 'DEFAULT_GROUP',
    service_name VARCHAR(128) NOT NULL,
    instance_id VARCHAR(128) NOT NULL,
    ip VARCHAR(50) NOT NULL,
    port INTEGER NOT NULL,
    weight REAL DEFAULT 1.0,
    healthy BOOLEAN DEFAULT 1,
    enabled BOOLEAN DEFAULT 1,
    ephemeral BOOLEAN DEFAULT 1,
    cluster_name VARCHAR(128) DEFAULT 'DEFAULT',
    metadata TEXT DEFAULT NULL,
    gmt_create INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    gmt_modified INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    UNIQUE(namespace_id, group_name, service_name, instance_id)
);

CREATE INDEX IF NOT EXISTS idx_instance_info_namespace_id ON instance_info(namespace_id);
CREATE INDEX IF NOT EXISTS idx_instance_info_service_name ON instance_info(service_name);
CREATE INDEX IF NOT EXISTS idx_instance_info_ip_port ON instance_info(ip, port);
CREATE INDEX IF NOT EXISTS idx_instance_info_healthy ON instance_info(healthy);

-- 服务历史表（service_history_info）
CREATE TABLE IF NOT EXISTS service_history_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    namespace_id VARCHAR(128) NOT NULL DEFAULT '',
    group_name VARCHAR(128) NOT NULL DEFAULT 'DEFAULT_GROUP',
    service_name VARCHAR(128) NOT NULL,
    change_type VARCHAR(32) NOT NULL,
    change_detail TEXT DEFAULT NULL,
    gmt_create INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_service_history_info_service_name ON service_history_info(service_name);
CREATE INDEX IF NOT EXISTS idx_service_history_info_gmt_create ON service_history_info(gmt_create);

