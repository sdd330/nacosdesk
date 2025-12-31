package com.example.nacos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * Spring Boot 应用主类
 * 
 * 集成 Nacos Desktop API 服务器示例
 * 
 * @author nacos-desktop
 */
@SpringBootApplication
@EnableDiscoveryClient  // 启用服务发现
@EnableFeignClients     // 启用 OpenFeign（可选）
public class ExampleApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(ExampleApplication.class, args);
    }
}

