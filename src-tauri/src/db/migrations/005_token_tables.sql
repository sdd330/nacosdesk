-- Migration 5: Token 管理表
-- 创建 Token 存储表

-- Token 表
CREATE TABLE IF NOT EXISTS tokens (
    token VARCHAR(500) NOT NULL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tokens_username ON tokens(username);
CREATE INDEX IF NOT EXISTS idx_tokens_expires_at ON tokens(expires_at);

