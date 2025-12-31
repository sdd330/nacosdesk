-- Migration 1: 用户和权限表
-- 创建用户、角色、权限表

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

