package com.example.nacos.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 服务发现控制器示例
 * 
 * 演示如何使用 Nacos Desktop 进行服务发现
 * 
 * @author nacos-desktop
 */
@RestController
@RequestMapping("/discovery")
public class ServiceDiscoveryController {
    
    @Autowired
    private DiscoveryClient discoveryClient;
    
    /**
     * 获取所有服务名称
     */
    @GetMapping("/services")
    public List<String> getServices() {
        return discoveryClient.getServices();
    }
    
    /**
     * 获取指定服务的所有实例
     */
    @GetMapping("/instances/{serviceName}")
    public List<ServiceInstance> getInstances(@PathVariable String serviceName) {
        return discoveryClient.getInstances(serviceName);
    }
    
    /**
     * 获取当前服务信息
     */
    @GetMapping("/current")
    public ServiceInstance getCurrentInstance() {
        List<ServiceInstance> instances = discoveryClient.getInstances(
            discoveryClient.getServices().get(0)
        );
        return instances.isEmpty() ? null : instances.get(0);
    }
}

