-- Migration 7: 心跳记录表（heartbeats）
-- 用于实例健康检查和心跳管理

CREATE TABLE heartbeats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    namespace_id TEXT NOT NULL,
    group_name TEXT NOT NULL,
    service_name TEXT NOT NULL,
    instance_id TEXT NOT NULL,
    ip TEXT NOT NULL,
    port INTEGER NOT NULL,
    cluster_name TEXT NOT NULL DEFAULT 'DEFAULT',
    last_beat_time INTEGER NOT NULL,
    beat_interval INTEGER NOT NULL DEFAULT 5000,
    created_at INTEGER NOT NULL,
    UNIQUE(namespace_id, group_name, service_name, instance_id)
);

CREATE INDEX idx_heartbeats_service ON heartbeats(namespace_id, group_name, service_name);
CREATE INDEX idx_heartbeats_last_beat ON heartbeats(last_beat_time);

