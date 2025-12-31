/**
 * 请求限流中间件
 * 基于令牌桶算法实现请求限流
 */

use axum::extract::{Request, State};
use axum::http::{HeaderMap, StatusCode};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::Mutex;
use tauri::AppHandle;

use crate::server::get_api_server_config;

/// 令牌桶结构
struct TokenBucket {
    tokens: f64,
    capacity: f64,
    refill_rate: f64, // 每秒补充的令牌数
    last_refill: Instant,
}

impl TokenBucket {
    fn new(capacity: f64, refill_rate: f64) -> Self {
        Self {
            tokens: capacity,
            capacity,
            refill_rate,
            last_refill: Instant::now(),
        }
    }

    /// 尝试获取令牌
    fn try_acquire(&mut self, tokens: f64) -> bool {
        // 补充令牌
        self.refill();
        
        if self.tokens >= tokens {
            self.tokens -= tokens;
            true
        } else {
            false
        }
    }

    /// 补充令牌
    fn refill(&mut self) {
        let now = Instant::now();
        let elapsed = now.duration_since(self.last_refill);
        
        if elapsed.as_secs() > 0 || elapsed.subsec_nanos() > 0 {
            let tokens_to_add = self.refill_rate * elapsed.as_secs_f64();
            self.tokens = (self.tokens + tokens_to_add).min(self.capacity);
            self.last_refill = now;
        }
    }

    /// 获取剩余令牌数
    fn available_tokens(&mut self) -> f64 {
        self.refill();
        self.tokens
    }
}

/// 限流器管理器（按 IP 地址管理）
struct RateLimiter {
    buckets: HashMap<String, Arc<Mutex<TokenBucket>>>,
    capacity: f64,
    refill_rate: f64,
    cleanup_interval: Duration,
    last_cleanup: Instant,
}

impl RateLimiter {
    fn new(capacity: f64, refill_rate: f64) -> Self {
        Self {
            buckets: HashMap::new(),
            capacity,
            refill_rate,
            cleanup_interval: Duration::from_secs(300), // 5 分钟清理一次
            last_cleanup: Instant::now(),
        }
    }

    /// 获取或创建令牌桶
    fn get_bucket(&mut self, key: &str) -> Arc<Mutex<TokenBucket>> {
        // 定期清理长时间未使用的桶
        if self.last_cleanup.elapsed() >= self.cleanup_interval {
            self.cleanup();
            self.last_cleanup = Instant::now();
        }

        self.buckets
            .entry(key.to_string())
            .or_insert_with(|| {
                Arc::new(Mutex::new(TokenBucket::new(
                    self.capacity,
                    self.refill_rate,
                )))
            })
            .clone()
    }

    /// 清理长时间未使用的桶（简化实现，实际可以更智能）
    fn cleanup(&mut self) {
        // 简单实现：如果桶数量超过 1000，清理一半
        if self.buckets.len() > 1000 {
            let keys_to_remove: Vec<String> = self
                .buckets
                .keys()
                .take(self.buckets.len() / 2)
                .cloned()
                .collect();
            for key in keys_to_remove {
                self.buckets.remove(&key);
            }
        }
    }

    /// 尝试获取令牌
    async fn try_acquire(&mut self, key: &str, tokens: f64) -> bool {
        let bucket = self.get_bucket(key);
        let mut bucket = bucket.lock().await;
        bucket.try_acquire(tokens)
    }
}

/// 全局限流器（使用 Arc<Mutex<>> 共享）
type GlobalRateLimiter = Arc<Mutex<RateLimiter>>;

/// 获取或创建全局限流器
async fn get_rate_limiter(app: &AppHandle) -> Option<GlobalRateLimiter> {
    use tauri::Manager;
    
    if let Some(limiter) = app.try_state::<GlobalRateLimiter>() {
        Some(limiter)
    } else {
        // 从配置获取限流参数
        let config = get_api_server_config(app).await.ok();

        let capacity = config
            .as_ref()
            .and_then(|c| c.rate_limit_capacity)
            .unwrap_or(100) as f64;
        let refill_rate = config
            .as_ref()
            .and_then(|c| c.rate_limit_refill_rate)
            .unwrap_or(10) as f64;

        let limiter = Arc::new(Mutex::new(RateLimiter::new(capacity, refill_rate)));
        app.manage(limiter.clone());
        Some(limiter)
    }
}

/// 获取客户端 IP 地址（与 ip_whitelist 中的实现一致）
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

/// 请求限流中间件
pub async fn rate_limit_middleware(
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
    
    // 如果限流未启用，直接通过
    if !config.rate_limit_enabled.unwrap_or(false) {
        return next.run(request).await;
    }

    // 获取限流参数
    let capacity = config.rate_limit_capacity.unwrap_or(100) as f64;
    let refill_rate = config.rate_limit_refill_rate.unwrap_or(10) as f64;
    let tokens_per_request = config.rate_limit_tokens_per_request.unwrap_or(1) as f64;

    // 获取或创建限流器
    let limiter = match get_rate_limiter(&app).await {
        Some(limiter) => limiter,
        None => {
            // 如果无法创建限流器，允许请求通过
            return next.run(request).await;
        }
    };

    // 获取客户端 IP
    let client_ip = get_client_ip(request.headers());
    
    // 如果 IP 为 unknown，使用请求路径作为限流键（避免所有 unknown IP 共享一个桶）
    let rate_limit_key = if client_ip == "unknown" {
        format!("unknown:{}", request.uri().path())
    } else {
        client_ip
    };

    // 尝试获取令牌
    let mut limiter_guard = limiter.lock().await;
    let allowed = limiter_guard.try_acquire(&rate_limit_key, tokens_per_request).await;

    if !allowed {
        // 返回 429 Too Many Requests
        return (
            StatusCode::TOO_MANY_REQUESTS,
            "请求过于频繁，请稍后再试",
        ).into_response();
    }

    // 释放锁后再执行请求
    drop(limiter_guard);
    
    // 允许请求通过
    next.run(request).await
}

