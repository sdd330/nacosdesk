package com.example.nacos.controller;

import com.example.nacos.config.ConfigExample;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 配置管理控制器示例
 * 
 * 演示如何从 Nacos Desktop 读取配置
 * 
 * @author nacos-desktop
 */
@RestController
@RequestMapping("/config")
@RefreshScope  // 支持配置动态刷新
public class ConfigController {
    
    /**
     * 方式一：使用 @Value 注解注入配置
     */
    @Value("${your.config.key:default-value}")
    private String configKey;
    
    @Value("${your.config.number:0}")
    private Integer configNumber;
    
    /**
     * 方式二：使用 @ConfigurationProperties 注入配置
     */
    @Autowired
    private ConfigExample configExample;
    
    /**
     * 获取配置（使用 @Value）
     */
    @GetMapping("/value")
    public String getConfigByValue() {
        return String.format("key: %s, number: %d", configKey, configNumber);
    }
    
    /**
     * 获取配置（使用 @ConfigurationProperties）
     */
    @GetMapping("/properties")
    public ConfigExample getConfigByProperties() {
        return configExample;
    }
    
    /**
     * 获取 Spring Application Name
     */
    @Value("${spring.application.name}")
    private String applicationName;
    
    @GetMapping("/app-name")
    public String getApplicationName() {
        return applicationName;
    }
}

