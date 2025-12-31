package com.example.nacos.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

/**
 * 服务调用控制器示例
 * 
 * 演示如何使用 RestTemplate 调用其他服务
 * 
 * @author nacos-desktop
 */
@RestController
@RequestMapping("/call")
public class ServiceCallController {
    
    @Autowired
    private RestTemplate restTemplate;
    
    /**
     * 配置 RestTemplate，启用负载均衡
     */
    @Bean
    @LoadBalanced
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
    
    /**
     * 调用其他服务
     * 
     * @param serviceName 服务名称（在 Nacos Desktop 中注册的服务名）
     * @param endpoint 服务端点
     */
    @GetMapping("/{serviceName}/{endpoint}")
    public String callService(
            @PathVariable String serviceName,
            @PathVariable String endpoint) {
        // 使用服务名进行调用，Nacos 会自动进行负载均衡
        String url = String.format("http://%s/%s", serviceName, endpoint);
        return restTemplate.getForObject(url, String.class);
    }
    
    /**
     * 调用示例服务的 echo 接口
     */
    @GetMapping("/echo/{str}")
    public String echo(@PathVariable String str) {
        return restTemplate.getForObject(
            "http://example-service/echo/" + str,
            String.class
        );
    }
}

