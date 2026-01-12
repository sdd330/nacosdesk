# Nacos Desktop API 服务器集成指南

本文档介绍如何将 Spring Boot 应用集成到 Nacos Desktop 的 API 服务器。

## 📋 目录

- [概述](#概述)
- [快速开始](#快速开始)
- [配置管理集成](#配置管理集成)
- [服务注册与发现集成](#服务注册与发现集成)
- [配置示例](#配置示例)
- [代码示例](#代码示例)
- [常见问题](#常见问题)

---

## 概述

Nacos Desktop 内置了一个 Nacos Standalone API 服务器，完全兼容 Nacos Server 的标准 API 接口。这意味着你可以使用标准的 Nacos Client（包括 Spring Cloud Alibaba Nacos）连接到 Nacos Desktop，就像连接到标准的 Nacos Server 一样。

**注意**：API 接口完全遵循 Nacos 官方标准，具体 API 文档请参考 [Nacos 官方文档](https://nacos.io/docs/latest/)。

### 主要特性

- ✅ **完全兼容**：基于官方 Nacos OpenAPI 文档实现，支持 Nacos Client 的所有标准 HTTP API
- ✅ **配置管理**：支持配置的发布、获取、监听、历史记录、上一版本、导入 / 导出等
- ✅ **服务注册与发现**：支持服务注册、实例管理、服务发现、订阅者查询等
- ✅ **命名空间支持**：支持多命名空间隔离，命名空间 CRUD 与级联删除
- ✅ **认证支持**：支持用户名密码认证，与 Console 账号体系一致
- ✅ **运维与健康检查**：支持系统开关、指标、服务器列表、Raft leader、配置 / 命名服务健康检查等接口

### API 服务器信息

- **默认端口**：`8848`
- **Context Path**：`/nacos`（可通过设置中心配置）
- **完整地址**：`http://localhost:8848/nacos`
- **兼容性**：
  - 路由与参数：与官方 Nacos Standalone OpenAPI 一致（例如 `/nacos/v1/cs/configs`、`/nacos/v1/ns/instance`、`/nacos/v1/ns/service` 等）
  - 响应结构：关键接口（实例列表、心跳、服务列表、服务详情、命名空间列表等）已按官方示例结构构造，并通过 Rust 集成测试校验

---

## 快速开始

### 1. 启动 Nacos Desktop API 服务器

1. 打开 Nacos Desktop 应用
2. 进入「设置中心」→「API 服务器」
3. 点击「启动服务器」按钮
4. 确认服务器状态为「运行中」，端口为 `8848`

### 2. 配置 Spring Boot 应用

在 `application.yml` 中添加以下配置：

```yaml
spring:
  application:
    name: your-service-name
  cloud:
    nacos:
      # 配置管理
      config:
        server-addr: localhost:8848
        namespace: public  # 命名空间，默认为 public
        group: DEFAULT_GROUP  # 配置组，默认为 DEFAULT_GROUP
        file-extension: yaml  # 配置文件扩展名（yaml、properties、json 等）
        username: nacos  # 用户名（如果启用了认证）
        password: nacos  # 密码（如果启用了认证）
        # 共享配置（可选）
        shared-configs:
          - data-id: shared-config.yaml
            group: DEFAULT_GROUP
            refresh: true
        # 扩展配置（可选）
        extension-configs:
          - data-id: extension-config.yaml
            group: DEFAULT_GROUP
            refresh: true
      
      # 服务注册与发现
      discovery:
        server-addr: localhost:8848
        namespace: public  # 命名空间，默认为 public
        group: DEFAULT_GROUP  # 服务组，默认为 DEFAULT_GROUP
        username: nacos  # 用户名（如果启用了认证）
        password: nacos  # 密码（如果启用了认证）
        # 实例配置
        ip: ${spring.cloud.client.ip-address}  # 实例 IP
        port: ${server.port}  # 实例端口
        weight: 1.0  # 权重
        enabled: true  # 是否启用
        healthy: true  # 健康状态
        ephemeral: true  # 是否临时实例
        cluster-name: DEFAULT  # 集群名称
```

### 3. 添加依赖

在 `pom.xml` 中添加 Spring Cloud Alibaba Nacos 依赖：

```xml
<dependencies>
    <!-- Spring Cloud Alibaba Nacos Config -->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
        <version>2022.0.0.0</version>
    </dependency>
    
    <!-- Spring Cloud Alibaba Nacos Discovery -->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        <version>2022.0.0.0</version>
    </dependency>
</dependencies>
```

### 4. 启用服务发现（可选）

在 Spring Boot 主类上添加 `@EnableDiscoveryClient` 注解：

```java
@SpringBootApplication
@EnableDiscoveryClient
public class YourApplication {
    public static void main(String[] args) {
        SpringApplication.run(YourApplication.class, args);
    }
}
```

---

## 配置管理集成

### 基本配置

#### 1. 发布配置

在 Nacos Desktop 中：
1. 进入「配置管理」
2. 点击「新建配置」
3. 填写配置信息：
   - **Data ID**：`your-service-name.yaml`（或 `.properties`、`.json` 等）
   - **Group**：`DEFAULT_GROUP`
   - **命名空间**：`public`（或自定义命名空间）
   - **配置格式**：选择 `YAML`、`Properties`、`JSON` 等
   - **配置内容**：填写你的配置内容

#### 2. 在 Spring Boot 中使用配置

配置会自动加载到 Spring 的 `Environment` 中，你可以通过以下方式使用：

**方式一：使用 `@Value` 注解**

```java
@RestController
public class ConfigController {
    @Value("${your.config.key:default-value}")
    private String configValue;
    
    @GetMapping("/config")
    public String getConfig() {
        return configValue;
    }
}
```

**方式二：使用 `@ConfigurationProperties` 注解**

```java
@ConfigurationProperties(prefix = "your")
@Data
public class YourConfig {
    private String configKey;
    private Integer configNumber;
}
```

**方式三：使用 `@RefreshScope` 实现动态刷新**

```java
@RestController
@RefreshScope
public class DynamicConfigController {
    @Value("${dynamic.config.key}")
    private String dynamicValue;
    
    @GetMapping("/dynamic-config")
    public String getDynamicConfig() {
        return dynamicValue;
    }
}
```

### 配置监听

Spring Cloud Alibaba Nacos Config 会自动监听配置变更，当配置更新时，使用 `@RefreshScope` 注解的 Bean 会自动刷新。

---

## 服务注册与发现集成

### 1. 服务注册

配置完成后，Spring Boot 应用启动时会自动注册到 Nacos Desktop。

你可以在 Nacos Desktop 中查看：
1. 进入「服务管理」
2. 在服务列表中可以看到你的服务
3. 点击服务名称查看服务详情和实例列表

### 2. 服务发现

**方式一：使用 `DiscoveryClient`**

```java
@RestController
public class ServiceDiscoveryController {
    @Autowired
    private DiscoveryClient discoveryClient;
    
    @GetMapping("/services")
    public List<String> getServices() {
        return discoveryClient.getServices();
    }
    
    @GetMapping("/instances/{serviceName}")
    public List<ServiceInstance> getInstances(@PathVariable String serviceName) {
        return discoveryClient.getInstances(serviceName);
    }
}
```

**方式二：使用 `RestTemplate` + `@LoadBalanced`**

```java
@Configuration
public class RestTemplateConfig {
    @Bean
    @LoadBalanced
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

@RestController
public class ServiceCallController {
    @Autowired
    private RestTemplate restTemplate;
    
    @GetMapping("/call/{serviceName}")
    public String callService(@PathVariable String serviceName) {
        // 使用服务名进行调用，Nacos 会自动进行负载均衡
        return restTemplate.getForObject(
            "http://" + serviceName + "/api/endpoint", 
            String.class
        );
    }
}
```

**方式三：使用 `OpenFeign`**

```java
@FeignClient(name = "your-service-name")
public interface YourServiceClient {
    @GetMapping("/api/endpoint")
    String getData();
}

@RestController
public class FeignController {
    @Autowired
    private YourServiceClient serviceClient;
    
    @GetMapping("/feign-call")
    public String feignCall() {
        return serviceClient.getData();
    }
}
```

---

## 配置示例

### 完整配置示例（application.yml）

```yaml
server:
  port: 8080

spring:
  application:
    name: example-service
  
  cloud:
    nacos:
      # 配置管理
      config:
        server-addr: localhost:8848
        namespace: public
        group: DEFAULT_GROUP
        file-extension: yaml
        username: nacos
        password: nacos
        # 是否启用配置刷新
        refresh-enabled: true
        # 配置刷新超时时间（毫秒）
        timeout: 3000
        # 长轮询超时时间（毫秒）
        long-poll-timeout: 30000
      
      # 服务注册与发现
      discovery:
        server-addr: localhost:8848
        namespace: public
        group: DEFAULT_GROUP
        username: nacos
        password: nacos
        # 实例配置
        ip: ${spring.cloud.client.ip-address}
        port: ${server.port}
        weight: 1.0
        enabled: true
        healthy: true
        ephemeral: true
        cluster-name: DEFAULT
        # 元数据（可选）
        metadata:
          version: 1.0.0
          region: us-east-1
```

### 使用自定义命名空间

```yaml
spring:
  cloud:
    nacos:
      config:
        server-addr: localhost:8848
        namespace: your-namespace-id  # 使用自定义命名空间
        group: DEFAULT_GROUP
      
      discovery:
        server-addr: localhost:8848
        namespace: your-namespace-id  # 使用自定义命名空间
        group: DEFAULT_GROUP
```

### 使用 Properties 格式配置

```yaml
spring:
  cloud:
    nacos:
      config:
        server-addr: localhost:8848
        namespace: public
        group: DEFAULT_GROUP
        file-extension: properties  # 使用 Properties 格式
```

---

## 代码示例

### 示例 1：配置管理 - 发布和获取配置

```java
package com.example.nacos;

import com.alibaba.nacos.api.config.ConfigService;
import com.alibaba.nacos.api.config.listener.Listener;
import com.alibaba.nacos.api.exception.NacosException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.Executor;

@RestController
@RequestMapping("/config")
public class ConfigExampleController {
    
    @Autowired
    private ConfigService configService;
    
    /**
     * 发布配置
     */
    @PostMapping("/publish")
    public String publishConfig(
            @RequestParam String dataId,
            @RequestParam String group,
            @RequestParam String content) throws NacosException {
        boolean success = configService.publishConfig(dataId, group, content);
        return success ? "配置发布成功" : "配置发布失败";
    }
    
    /**
     * 获取配置
     */
    @GetMapping("/get")
    public String getConfig(
            @RequestParam String dataId,
            @RequestParam String group) throws NacosException {
        return configService.getConfig(dataId, group, 5000);
    }
    
    /**
     * 监听配置变更
     */
    @PostMapping("/listen")
    public String listenConfig(
            @RequestParam String dataId,
            @RequestParam String group) throws NacosException {
        configService.addListener(dataId, group, new Listener() {
            @Override
            public void receiveConfigInfo(String configInfo) {
                System.out.println("配置已更新: " + configInfo);
            }
            
            @Override
            public Executor getExecutor() {
                return null;
            }
        });
        return "监听已添加";
    }
}
```

### 示例 2：服务注册与发现 - 服务提供者

```java
package com.example.nacos.provider;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@EnableDiscoveryClient
public class ProviderApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProviderApplication.class, args);
    }
    
    @RestController
    class EchoController {
        @GetMapping("/echo/{string}")
        public String echo(@PathVariable String string) {
            return "Hello Nacos Discovery " + string;
        }
    }
}
```

### 示例 3：服务注册与发现 - 服务消费者

```java
package com.example.nacos.consumer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
@EnableDiscoveryClient
public class ConsumerApplication {
    
    @LoadBalanced
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
    
    public static void main(String[] args) {
        SpringApplication.run(ConsumerApplication.class, args);
    }
    
    @RestController
    class TestController {
        private final RestTemplate restTemplate;
        
        public TestController(RestTemplate restTemplate) {
            this.restTemplate = restTemplate;
        }
        
        @GetMapping("/echo/{str}")
        public String echo(@PathVariable String str) {
            // 使用服务名进行调用，Nacos 会自动进行负载均衡
            return restTemplate.getForObject(
                "http://example-service/echo/" + str, 
                String.class
            );
        }
    }
}
```

### 示例 4：使用 OpenFeign 进行服务调用

```java
package com.example.nacos.feign;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class FeignApplication {
    public static void main(String[] args) {
        SpringApplication.run(FeignApplication.class, args);
    }
    
    @RestController
    class FeignController {
        private final EchoServiceClient echoServiceClient;
        
        public FeignController(EchoServiceClient echoServiceClient) {
            this.echoServiceClient = echoServiceClient;
        }
        
        @GetMapping("/feign/{str}")
        public String feign(@PathVariable String str) {
            return echoServiceClient.echo(str);
        }
    }
    
    @org.springframework.cloud.openfeign.FeignClient(name = "example-service")
    interface EchoServiceClient {
        @GetMapping("/echo/{str}")
        String echo(@PathVariable String str);
    }
}
```

---

## 常见问题

### Q1: 连接失败，提示 "Connection refused"

**原因**：Nacos Desktop API 服务器未启动或端口不正确。

**解决方案**：
1. 确认 Nacos Desktop 应用已启动
2. 在「设置中心」→「API 服务器」中确认服务器状态为「运行中」
3. 确认端口配置正确（默认 8848）
4. 检查防火墙设置

### Q2: 配置无法加载

**原因**：配置的 Data ID、Group 或命名空间不匹配。

**解决方案**：
1. 确认 `spring.application.name` 与配置的 Data ID 匹配
2. 确认 `file-extension` 与配置文件的扩展名匹配
3. 确认 `namespace` 配置正确
4. 在 Nacos Desktop 中检查配置是否存在

### Q3: 服务注册失败

**原因**：认证信息错误或网络连接问题。

**解决方案**：
1. 确认用户名和密码正确（默认：nacos/nacos）
2. 确认 `server-addr` 配置正确
3. 检查网络连接
4. 查看 Nacos Desktop 的日志输出

### Q4: 配置变更无法自动刷新

**原因**：未使用 `@RefreshScope` 注解或配置监听未启用。

**解决方案**：
1. 在需要动态刷新的 Bean 上添加 `@RefreshScope` 注解
2. 确认 `refresh-enabled: true` 已配置
3. 检查长轮询超时时间配置

### Q5: 服务发现返回空列表

**原因**：服务未注册或命名空间不匹配。

**解决方案**：
1. 确认服务已成功注册（在 Nacos Desktop 中查看）
2. 确认服务发现时使用的命名空间与服务注册时的命名空间一致
3. 检查服务组（group）配置是否一致

### Q6: Context Path 配置

**原因**：如果修改了 Nacos Desktop 的 Context Path，需要在客户端配置中指定。

**解决方案**：
1. 在 Nacos Desktop 的「设置中心」中查看 Context Path 配置
2. 如果修改了 Context Path（例如改为 `/nacos-api`），需要在 Spring Boot 配置中添加：
   ```yaml
   spring:
     cloud:
       nacos:
         config:
           context-path: /nacos-api
         discovery:
           context-path: /nacos-api
   ```

---

## 版本兼容性

### Spring Cloud Alibaba 版本

| Spring Cloud Alibaba 版本 | Spring Cloud 版本 | Spring Boot 版本 |
|---------------------------|-------------------|------------------|
| 2022.0.0.0                | 2022.0.x          | 3.0.x            |
| 2021.0.5.0                | 2021.0.x          | 2.7.x            |
| 2.2.10.RELEASE            | Hoxton.SR12       | 2.3.x            |

### Nacos Client 版本

Nacos Desktop API 服务器兼容以下 Nacos Client 版本：
- Nacos Client 2.x
- Nacos Client 1.x

---

## 更多资源

- [Nacos 官方文档](https://nacos.io/docs/latest/)
- [Spring Cloud Alibaba 文档](https://github.com/alibaba/spring-cloud-alibaba)
- [Nacos Desktop GitHub](https://github.com/your-repo/nacosdesk)

---

**最后更新**：2025-01-01

