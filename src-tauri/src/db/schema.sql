-- Nacos Desktop Console Database Schema
-- 参考 nacos-develop/distribution/conf/derby-schema.sql
-- 适配 SQLite 语法

-- ============================================
-- 用户和权限相关表
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(50) NOT NULL PRIMARY KEY,
    password VARCHAR(500) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT 1
);

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    username VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL,
    UNIQUE(username, role)
);

-- 权限表
CREATE TABLE IF NOT EXISTS permissions (
    role VARCHAR(50) NOT NULL,
    resource VARCHAR(512) NOT NULL,
    action VARCHAR(8) NOT NULL,
    UNIQUE(role, resource, action)
);

-- ============================================
-- 命名空间相关表
-- ============================================

-- 命名空间表（tenant_info）
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

-- ============================================
-- 配置相关表
-- ============================================

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

-- ============================================
-- 服务相关表
-- ============================================

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
