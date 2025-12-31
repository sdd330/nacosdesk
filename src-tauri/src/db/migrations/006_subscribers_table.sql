-- Migration 6: 订阅者表（subscribers）
-- 用于配置监听和长轮询功能

CREATE TABLE subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_id TEXT NOT NULL,
    group_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT '',
    client_ip TEXT NOT NULL,
    client_port INTEGER,
    user_agent TEXT,
    app_name TEXT,
    md5 TEXT,
    last_poll_time INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(data_id, group_id, tenant_id, client_ip, client_port)
);

CREATE INDEX idx_subscribers_data_id ON subscribers(data_id, group_id, tenant_id);
CREATE INDEX idx_subscribers_last_poll ON subscribers(last_poll_time);

