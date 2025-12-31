-- Migration 8: API 请求日志表（api_logs）
-- 可选，用于 API 请求审计和监控

CREATE TABLE api_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    query_params TEXT,
    request_body TEXT,
    response_status INTEGER NOT NULL,
    response_time INTEGER NOT NULL,
    client_ip TEXT NOT NULL,
    user_agent TEXT,
    username TEXT,
    created_at INTEGER NOT NULL
);

CREATE INDEX idx_api_logs_path ON api_logs(path);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at);

