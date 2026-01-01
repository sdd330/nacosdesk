/**
 * Nacos Standalone API 服务器单元测试
 * 测试所有核心 API 端点的功能
 * 
 * 包含两类测试：
 * 1. 单元测试：验证 API 参数解析、路由和响应格式的正确性
 * 2. 集成测试：使用真实的 SQLite 数据库测试完整的 API 功能
 */

#[cfg(test)]
mod helpers;
#[cfg(test)]
mod db_setup;
#[cfg(test)]
mod config_tests;
#[cfg(test)]
mod service_tests;
#[cfg(test)]
mod instance_tests;
#[cfg(test)]
mod auth_tests;
#[cfg(test)]
mod health_tests;
#[cfg(test)]
mod integration_tests;

// 集成测试模块（按功能拆分）
#[cfg(test)]
mod config_integration_tests;
#[cfg(test)]
mod service_integration_tests;
#[cfg(test)]
mod instance_integration_tests;
#[cfg(test)]
mod auth_integration_tests;
#[cfg(test)]
mod health_integration_tests;
#[cfg(test)]
mod namespace_integration_tests;
#[cfg(test)]
mod console_api_integration_tests;

