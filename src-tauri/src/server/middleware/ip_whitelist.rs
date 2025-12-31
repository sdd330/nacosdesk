/**
 * IP 白名单中间件
 * 根据配置的 IP 白名单过滤请求
 */

use axum::extract::{Request, State};
use axum::http::{HeaderMap, StatusCode};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use std::sync::Arc;
use tauri::AppHandle;

use crate::server::get_api_server_config;

/// 获取客户端 IP 地址（与 access_log 中的实现一致）
fn get_client_ip(headers: &HeaderMap) -> String {
    // 优先从 X-Forwarded-For 获取（代理场景）
    if let Some(forwarded_for) = headers.get("X-Forwarded-For") {
        if let Ok(ip) = forwarded_for.to_str() {
            // 取第一个 IP（可能是多个 IP，逗号分隔）
            return ip.split(',').next().unwrap_or("unknown").trim().to_string();
        }
    }
    
    // 其次从 X-Real-IP 获取
    if let Some(real_ip) = headers.get("X-Real-IP") {
        if let Ok(ip) = real_ip.to_str() {
            return ip.to_string();
        }
    }
    
    "unknown".to_string()
}

/// 检查 IP 是否匹配白名单规则
/// 支持：
/// - 精确匹配：127.0.0.1
/// - CIDR 格式：192.168.1.0/24
/// - 通配符：192.168.*.*
fn is_ip_allowed(client_ip: &str, whitelist: &[String]) -> bool {
    if whitelist.is_empty() {
        return false; // 如果白名单为空，拒绝所有请求
    }
    
    for allowed_ip in whitelist {
        let allowed_ip = allowed_ip.trim();
        
        // 精确匹配
        if allowed_ip == client_ip {
            return true;
        }
        
        // CIDR 格式匹配（简化实现，支持 /24 和 /16）
        if allowed_ip.contains('/') {
            if let Some((network, prefix_len_str)) = allowed_ip.split_once('/') {
                if let Ok(prefix_len) = prefix_len_str.parse::<u8>() {
                    if match_cidr(client_ip, network, prefix_len) {
                        return true;
                    }
                }
            }
        }
        
        // 通配符匹配（支持 *）
        if allowed_ip.contains('*') {
            if match_wildcard(client_ip, allowed_ip) {
                return true;
            }
        }
    }
    
    false
}

/// CIDR 匹配（简化实现）
fn match_cidr(ip: &str, network: &str, prefix_len: u8) -> bool {
    // 解析 IP 地址
    let ip_parts: Vec<&str> = ip.split('.').collect();
    let network_parts: Vec<&str> = network.split('.').collect();
    
    if ip_parts.len() != 4 || network_parts.len() != 4 {
        return false;
    }
    
    // 将 IP 转换为 u32
    let ip_u32 = ip_to_u32(&ip_parts);
    let network_u32 = ip_to_u32(&network_parts);
    
    // 计算掩码
    let mask = if prefix_len == 0 {
        0
    } else {
        u32::MAX << (32 - prefix_len)
    };
    
    (ip_u32 & mask) == (network_u32 & mask)
}

/// 将 IP 地址转换为 u32
fn ip_to_u32(parts: &[&str]) -> u32 {
    let mut result = 0u32;
    for (i, part) in parts.iter().enumerate() {
        if let Ok(octet) = part.parse::<u32>() {
            result |= (octet & 0xFF) << (24 - i * 8);
        }
    }
    result
}

/// 通配符匹配
fn match_wildcard(ip: &str, pattern: &str) -> bool {
    let ip_parts: Vec<&str> = ip.split('.').collect();
    let pattern_parts: Vec<&str> = pattern.split('.').collect();
    
    if ip_parts.len() != 4 || pattern_parts.len() != 4 {
        return false;
    }
    
    for (ip_part, pattern_part) in ip_parts.iter().zip(pattern_parts.iter()) {
        if pattern_part != "*" && pattern_part != ip_part {
            return false;
        }
    }
    
    true
}

/// IP 白名单中间件
pub async fn ip_whitelist_middleware(
    State(app): State<Arc<AppHandle>>,
    request: Request,
    next: Next,
) -> Response {
    // 获取服务器配置
    let config = match get_api_server_config(&app).await {
        Ok(config) => config,
        Err(_) => {
            // 如果获取配置失败，允许请求通过（避免配置问题导致服务不可用）
            return next.run(request).await;
        }
    };
    
    // 如果 IP 白名单未启用，直接通过
    if !config.ip_whitelist_enabled {
        return next.run(request).await;
    }
    
    // 获取客户端 IP
    let client_ip = get_client_ip(request.headers());
    
    // 如果 IP 为 unknown，拒绝请求
    if client_ip == "unknown" {
        return (
            StatusCode::FORBIDDEN,
            "无法识别客户端 IP 地址",
        ).into_response();
    }
    
    // 检查 IP 是否在白名单中
    if !is_ip_allowed(&client_ip, &config.ip_whitelist) {
        return (
            StatusCode::FORBIDDEN,
            format!("IP 地址 {} 不在白名单中", client_ip),
        ).into_response();
    }
    
    // IP 在白名单中，允许请求通过
    next.run(request).await
}

