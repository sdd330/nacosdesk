package com.example.nacos.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * OpenFeign 客户端示例
 * 
 * 演示如何使用 OpenFeign 调用其他服务
 * 
 * @author nacos-desktop
 */
@FeignClient(name = "example-service")  // 服务名称（在 Nacos Desktop 中注册的服务名）
public interface EchoServiceClient {
    
    /**
     * 调用示例服务的 echo 接口
     * 
     * @param str 要回显的字符串
     * @return 回显结果
     */
    @GetMapping("/echo/{str}")
    String echo(@PathVariable String str);
    
    /**
     * 调用示例服务的其他接口
     */
    @GetMapping("/api/data")
    String getData();
}

/**
 * 使用 Feign 客户端的控制器
 */
package com.example.nacos.controller;

import com.example.nacos.feign.EchoServiceClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/feign")
public class FeignController {
    
    @Autowired
    private EchoServiceClient echoServiceClient;
    
    @GetMapping("/echo/{str}")
    public String echo(@PathVariable String str) {
        return echoServiceClient.echo(str);
    }
    
    @GetMapping("/data")
    public String getData() {
        return echoServiceClient.getData();
    }
}

