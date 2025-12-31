package com.example.nacos.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.stereotype.Component;

/**
 * 配置类示例
 * 
 * 从 Nacos Desktop 加载配置
 * 
 * @author nacos-desktop
 */
@Data
@Component
@RefreshScope  // 支持配置动态刷新
@ConfigurationProperties(prefix = "your.config")
public class ConfigExample {
    
    /**
     * 配置项示例
     * 对应 Nacos Desktop 中配置的 your.config.key
     */
    private String key;
    
    /**
     * 数字配置项示例
     * 对应 Nacos Desktop 中配置的 your.config.number
     */
    private Integer number;
    
    /**
     * 布尔配置项示例
     * 对应 Nacos Desktop 中配置的 your.config.enabled
     */
    private Boolean enabled = true;
}

