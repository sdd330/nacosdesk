-- Migration 10: 性能优化索引
-- 为常用查询添加复合索引以提升查询性能

-- 配置信息表性能优化索引
-- 优化按命名空间查询并按修改时间排序的查询
CREATE INDEX IF NOT EXISTS idx_config_info_tenant_modified ON config_info(tenant_id, gmt_modified DESC);

-- 优化按应用名称查询
CREATE INDEX IF NOT EXISTS idx_config_info_app_name ON config_info(app_name);

-- 优化按命名空间、组、数据ID的查询（虽然已有 UNIQUE 约束，但添加索引可以提升查询性能）
CREATE INDEX IF NOT EXISTS idx_config_info_tenant_group_data ON config_info(tenant_id, group_id, data_id);

-- 配置历史表性能优化索引
-- 优化按配置查询历史记录并按修改时间排序
CREATE INDEX IF NOT EXISTS idx_config_history_info_data_group_tenant_modified ON config_history_info(data_id, group_id, tenant_id, gmt_modified DESC);

-- 优化按命名空间查询历史记录
CREATE INDEX IF NOT EXISTS idx_config_history_info_tenant_modified ON config_history_info(tenant_id, gmt_modified DESC);

-- 实例信息表性能优化索引
-- 优化按命名空间、组、服务名查询实例（这是最常见的查询模式）
CREATE INDEX IF NOT EXISTS idx_instance_info_namespace_group_service ON instance_info(namespace_id, group_name, service_name);

-- 优化按服务名和健康状态查询
CREATE INDEX IF NOT EXISTS idx_instance_info_service_healthy ON instance_info(service_name, healthy);

-- 优化按命名空间和服务名查询
CREATE INDEX IF NOT EXISTS idx_instance_info_namespace_service ON instance_info(namespace_id, service_name);

-- 服务信息表性能优化索引
-- 优化按命名空间和组查询服务
CREATE INDEX IF NOT EXISTS idx_service_info_namespace_group ON service_info(namespace_id, group_name);

-- 订阅者表性能优化索引
-- 优化按客户端IP查询订阅者
CREATE INDEX IF NOT EXISTS idx_subscribers_client_ip ON subscribers(client_ip);

-- 优化按配置和客户端查询
CREATE INDEX IF NOT EXISTS idx_subscribers_config_client ON subscribers(data_id, group_id, tenant_id, client_ip, client_port);

-- 心跳表性能优化索引
-- 优化按实例查询心跳记录
CREATE INDEX IF NOT EXISTS idx_heartbeats_instance ON heartbeats(namespace_id, group_name, service_name, instance_id);

-- 优化按最后心跳时间查询（用于清理过期心跳）
CREATE INDEX IF NOT EXISTS idx_heartbeats_last_beat_time ON heartbeats(last_beat_time);

