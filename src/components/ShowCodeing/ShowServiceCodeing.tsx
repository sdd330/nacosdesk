/**
 * ShowServiceCodeing 组件
 * 服务注册代码展示组件（服务专用）
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/components/ShowCodeing/ShowServiceCodeing.js
 */

import { defineComponent, ref, watch, computed } from 'vue'
import {
  ElDialog,
  ElTabs,
  ElTabPane,
  ElLoading,
} from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import { getParams } from '@/utils/urlParams'
import MonacoEditor from '@/components/MonacoEditor/index'

export interface ShowServiceCodeingProps {
  record?: {
    name?: string
    group?: string
    dataId?: string
  }
}

export default defineComponent<ShowServiceCodeingProps>({
  name: 'ShowServiceCodeing',
  props: {
    record: Object,
  },
  emits: ['close'],
  setup(props, { emit, expose }) {
    const { t } = useI18n()

    // 状态管理
    const dialogVisible = ref(false)
    const loading = ref(false)
    const activeTab = ref('java')
    const currentRecord = ref<ShowServiceCodeingProps['record']>({})

    // 代码内容
    const javaCode = ref('')
    const springCode = ref('')
    const springBootCode = ref('')
    const springCloudCode = ref('')
    const nodejsCode = ref('TODO')
    const cppCode = ref('TODO')
    const shellCode = ref('TODO')
    const pythonCode = ref('')
    const csharpCode = ref('')

    // Monaco Editor 语言映射
    const languageMap: Record<string, string> = {
      java: 'java',
      spring: 'java',
      springBoot: 'java',
      springCloud: 'java',
      nodejs: 'javascript',
      cpp: 'cpp',
      shell: 'shell',
      python: 'python',
      csharp: 'csharp',
    }

    // 当前代码内容
    const currentCode = computed(() => {
      switch (activeTab.value) {
        case 'java':
          return javaCode.value
        case 'spring':
          return springCode.value
        case 'springBoot':
          return springBootCode.value
        case 'springCloud':
          return springCloudCode.value
        case 'nodejs':
          return nodejsCode.value
        case 'cpp':
          return cppCode.value
        case 'shell':
          return shellCode.value
        case 'python':
          return pythonCode.value
        case 'csharp':
          return csharpCode.value
        default:
          return ''
      }
    })

    // 当前语言
    const currentLanguage = computed(() => {
      return languageMap[activeTab.value] || 'text'
    })

    // 生成 Java 代码
    const getJavaCode = (data: { name: string; group?: string }) => {
      const serviceName = data.name || 'example-service'
      const group = data.group || 'DEFAULT_GROUP'
      
      return `/* Refer to document: https://github.com/alibaba/nacos/blob/master/example/src/main/java/com/alibaba/nacos/example
*  pom.xml
    <dependency>
        <groupId>com.alibaba.nacos</groupId>
        <artifactId>nacos-client</artifactId>
        <version>\${latest.version}</version>
    </dependency>
*/
package com.alibaba.nacos.example;

import java.util.Properties;

import com.alibaba.nacos.api.exception.NacosException;
import com.alibaba.nacos.api.naming.NamingFactory;
import com.alibaba.nacos.api.naming.NamingService;
import com.alibaba.nacos.api.naming.listener.Event;
import com.alibaba.nacos.api.naming.listener.EventListener;
import com.alibaba.nacos.api.naming.listener.NamingEvent;

/**
 * @author nkorange
 */
public class NamingExample {

    public static void main(String[] args) throws NacosException {

        Properties properties = new Properties();
        properties.setProperty("serverAddr", System.getProperty("serverAddr"));
        properties.setProperty("namespace", System.getProperty("namespace"));

        NamingService naming = NamingFactory.createNamingService(properties);

        naming.registerInstance("${serviceName}", "11.11.11.11", 8888, "${group}");

        naming.registerInstance("${serviceName}", "2.2.2.2", 9999, "DEFAULT");

        System.out.println(naming.getAllInstances("${serviceName}"));

        naming.deregisterInstance("${serviceName}", "2.2.2.2", 9999, "DEFAULT");

        System.out.println(naming.getAllInstances("${serviceName}"));

        naming.subscribe("${serviceName}", new EventListener() {
            @Override
            public void onEvent(Event event) {
                System.out.println(((NamingEvent)event).getServiceName());
                System.out.println(((NamingEvent)event).getInstances());
            }
        });
    }
}`
    }

    // 生成 Spring 代码
    const getSpringCode = () => {
      return `/* Refer to document: https://github.com/nacos-group/nacos-examples/tree/master/nacos-spring-example/nacos-spring-discovery-example
*  pom.xml
    <dependency>
        <groupId>com.alibaba.nacos</groupId>
        <artifactId>nacos-spring-context</artifactId>
        <version>\${latest.version}</version>
    </dependency>
*/

// Refer to document:  https://github.com/nacos-group/nacos-examples/blob/master/nacos-spring-example/nacos-spring-discovery-example/src/main/java/com/alibaba/nacos/example/spring
package com.alibaba.nacos.example.spring;

import com.alibaba.nacos.api.annotation.NacosProperties;
import com.alibaba.nacos.spring.context.annotation.discovery.EnableNacosDiscovery;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableNacosDiscovery(globalProperties = @NacosProperties(serverAddr = "127.0.0.1:8848"))
public class NacosConfiguration {

}

// Refer to document: https://github.com/nacos-group/nacos-examples/tree/master/nacos-spring-example/nacos-spring-discovery-example/src/main/java/com/alibaba/nacos/example/spring/controller
package com.alibaba.nacos.example.spring.controller;

import com.alibaba.nacos.api.annotation.NacosInjected;
import com.alibaba.nacos.api.exception.NacosException;
import com.alibaba.nacos.api.naming.NamingService;
import com.alibaba.nacos.api.naming.pojo.Instance;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

import static org.springframework.web.bind.annotation.RequestMethod.GET;

@Controller
@RequestMapping("discovery")
public class DiscoveryController {

    @NacosInjected
    private NamingService namingService;

    @RequestMapping(value = "/get", method = GET)
    @ResponseBody
    public List<Instance> get(@RequestParam String serviceName) throws NacosException {
        return namingService.getAllInstances(serviceName);
    }
}`
    }

    // 生成 Spring Boot 代码
    const getSpringBootCode = () => {
      return `/* Refer to document: https://github.com/nacos-group/nacos-examples/blob/master/nacos-spring-boot-example/nacos-spring-boot-discovery-example
*  pom.xml
    <dependency>
       <groupId>com.alibaba.boot</groupId>
       <artifactId>nacos-discovery-spring-boot-starter</artifactId>
       <version>\${latest.version}</version>
    </dependency>
*/
/* Refer to document:  https://github.com/nacos-group/nacos-examples/blob/master/nacos-spring-boot-example/nacos-spring-boot-discovery-example/src/main/resources
* application.properties
   nacos.discovery.server-addr=127.0.0.1:8848
*/
// Refer to document: https://github.com/nacos-group/nacos-examples/blob/master/nacos-spring-boot-example/nacos-spring-boot-discovery-example/src/main/java/com/alibaba/nacos/example/spring/boot/controller

package com.alibaba.nacos.example.spring.boot.controller;

import com.alibaba.nacos.api.annotation.NacosInjected;
import com.alibaba.nacos.api.exception.NacosException;
import com.alibaba.nacos.api.naming.NamingService;
import com.alibaba.nacos.api.naming.pojo.Instance;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

import static org.springframework.web.bind.annotation.RequestMethod.GET;

@Controller
@RequestMapping("discovery")
public class DiscoveryController {

    @NacosInjected
    private NamingService namingService;

    @RequestMapping(value = "/get", method = GET)
    @ResponseBody
    public List<Instance> get(@RequestParam String serviceName) throws NacosException {
        return namingService.getAllInstances(serviceName);
    }
}`
    }

    // 生成 Spring Cloud 代码
    const getSpringCloudCode = () => {
      const serviceName = currentRecord.value?.name || 'example-service'
      
      return `/* Refer to document: https://github.com/nacos-group/nacos-examples/blob/master/nacos-spring-cloud-example/nacos-spring-cloud-discovery-example/
*  pom.xml
    <dependency>
       <groupId>org.springframework.cloud</groupId>
       <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
       <version>\${latest.version}</version>
    </dependency>
*/

// nacos-spring-cloud-provider-example

/* Refer to document:  https://github.com/nacos-group/nacos-examples/tree/master/nacos-spring-cloud-example/nacos-spring-cloud-discovery-example/nacos-spring-cloud-provider-example/src/main/resources
* application.properties
server.port=18080
spring.application.name=${serviceName}
spring.cloud.nacos.discovery.server-addr=127.0.0.1:8848
*/

// Refer to document: https://github.com/nacos-group/nacos-examples/tree/master/nacos-spring-cloud-example/nacos-spring-cloud-discovery-example/nacos-spring-cloud-provider-example/src/main/java/com/alibaba/nacos/example/spring/cloud
package com.alibaba.nacos.example.spring.cloud;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author xiaojing
 */
@SpringBootApplication
@EnableDiscoveryClient
public class NacosProviderApplication {

  public static void main(String[] args) {
    SpringApplication.run(NacosProviderApplication.class, args);
}

  @RestController
  class EchoController {
    @RequestMapping(value = "/echo/{string}", method = RequestMethod.GET)
    public String echo(@PathVariable String string) {
      return "Hello Nacos Discovery " + string;
    }
  }
}

// nacos-spring-cloud-consumer-example

/* Refer to document: https://github.com/nacos-group/nacos-examples/tree/master/nacos-spring-cloud-example/nacos-spring-cloud-discovery-example/nacos-spring-cloud-consumer-example/src/main/resources
* application.properties
spring.application.name=micro-service-oauth2
spring.cloud.nacos.discovery.server-addr=127.0.0.1:8848
*/

// Refer to document: https://github.com/nacos-group/nacos-examples/tree/master/nacos-spring-cloud-example/nacos-spring-cloud-discovery-example/nacos-spring-cloud-consumer-example/src/main/java/com/alibaba/nacos/example/spring/cloud
package com.alibaba.nacos.example.spring.cloud;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

/**
 * @author xiaojing
 */
@SpringBootApplication
@EnableDiscoveryClient
public class NacosConsumerApplication {

    @LoadBalanced
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    public static void main(String[] args) {
        SpringApplication.run(NacosConsumerApplication.class, args);
    }

    @RestController
    public class TestController {

        private final RestTemplate restTemplate;

        @Autowired
        public TestController(RestTemplate restTemplate) {this.restTemplate = restTemplate;}

        @RequestMapping(value = "/echo/{str}", method = RequestMethod.GET)
        public String echo(@PathVariable String str) {
            return restTemplate.getForObject("http://service-provider/echo/" + str, String.class);
        }
    }
}`
    }

    // 生成 Python 代码
    const getPythonCode = () => {
      return `/*
* Demo for Nacos
*/
import json
import socket

import nacos


def get_host_ip():
    res = socket.gethostbyname(socket.gethostname())
    return res


def load_config(content):
    _config = json.loads(content)
    return _config


def nacos_config_callback(args):
    content = args['raw_content']
    load_config(content)


class NacosClient:
    service_name = None
    service_port = None
    service_group = None

    def __init__(self, server_endpoint, namespace_id, username=None, password=None):
        self.client = nacos.NacosClient(server_endpoint,
                                        namespace=namespace_id,
                                        username=username,
                                        password=password)
        self.endpoint = server_endpoint
        self.service_ip = get_host_ip()

    def register(self):
        self.client.add_naming_instance(self.service_name,
                                        self.service_ip,
                                        self.service_port,
                                        group_name=self.service_group)

    def modify(self, service_name, service_ip=None, service_port=None):
        self.client.modify_naming_instance(service_name,
                                           service_ip if service_ip else self.service_ip,
                                           service_port if service_port else self.service_port)

    def unregister(self):
        self.client.remove_naming_instance(self.service_name,
                                           self.service_ip,
                                           self.service_port)

    def set_service(self, service_name, service_ip, service_port, service_group):
        self.service_name = service_name
        self.service_ip = service_ip
        self.service_port = service_port
        self.service_group = service_group

    async def beat_callback(self):
        self.client.send_heartbeat(self.service_name,
                                   self.service_ip,
                                   self.service_port)

    def load_conf(self, data_id, group):
        return self.client.get_config(data_id=data_id, group=group, no_snapshot=True)

    def add_conf_watcher(self, data_id, group, callback):
        self.client.add_config_watcher(data_id=data_id, group=group, cb=callback)


if __name__ == '__main__':
    nacos_config = {
        "nacos_data_id":"test",
        "nacos_server_ip":"127.0.0.1",
        "nacos_namespace":"public",
        "nacos_groupName":"DEFAULT_GROUP",
        "nacos_user":"nacos",
        "nacos_password":"1234567"
    }
    nacos_data_id = nacos_config["nacos_data_id"]
    SERVER_ADDRESSES = nacos_config["nacos_server_ip"]
    NAMESPACE = nacos_config["nacos_namespace"]
    groupName = nacos_config["nacos_groupName"]
    user = nacos_config["nacos_user"]
    password = nacos_config["nacos_password"]
    # todo 将另一个路由对象（通常定义在其他模块或文件中）合并到主应用（app）中。
    # app.include_router(custom_api.router, tags=['test'])
    service_ip = get_host_ip()
    client = NacosClient(SERVER_ADDRESSES, NAMESPACE, user, password)
    client.add_conf_watcher(nacos_data_id, groupName, nacos_config_callback)

    # 启动时，强制同步一次配置
    data_stream = client.load_conf(nacos_data_id, groupName)
    json_config = load_config(data_stream)
    #设定服务
    client.set_service(json_config["service_name"], json_config.get("service_ip", service_ip), service_port, groupName)
    #注册服务
    client.register()
    #下线服务
    client.unregister()
`
    }

    // 生成 C# 代码
    const getCSharpCode = () => {
      const serviceName = currentRecord.value?.name || 'example-service'
      
      return `/* Refer to document: https://github.com/nacos-group/nacos-sdk-csharp/
Demo for Basic Nacos Opreation
App.csproj

<ItemGroup>
  <PackageReference Include="nacos-sdk-csharp" Version="\${latest.version}" />
</ItemGroup>
*/

using Microsoft.Extensions.DependencyInjection;
using Nacos.V2;
using Nacos.V2.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

class Program
{
    static async Task Main(string[] args)
    {
        IServiceCollection services = new ServiceCollection();

        services.AddNacosV2Naming(x =>
        {
            x.ServerAddresses = new List<string> { "http://localhost:8848/" };
            x.Namespace = "cs-test";

            // swich to use http or rpc
            x.NamingUseRpc = true;
        });

        IServiceProvider serviceProvider = services.BuildServiceProvider();
        var namingSvc = serviceProvider.GetService<INacosNamingService>();

        await namingSvc.RegisterInstance("${serviceName}", "11.11.11.11", 8888, "TEST1");

        await namingSvc.RegisterInstance("${serviceName}", "2.2.2.2", 9999, "DEFAULT");

        Console.WriteLine(Newtonsoft.Json.JsonConvert.SerializeObject(await namingSvc.GetAllInstances("${serviceName}")));

        await namingSvc.DeregisterInstance("${serviceName}", "2.2.2.2", 9999, "DEFAULT");

        var listener = new EventListener();

        await namingSvc.Subscribe("${serviceName}", listener);
    }

    internal class EventListener : IEventListener
    {
        public Task OnEvent(IEvent @event)
        {
            Console.WriteLine(Newtonsoft.Json.JsonConvert.SerializeObject(@event));
            return Task.CompletedTask;
        }
    }
}

/* Refer to document: https://github.com/nacos-group/nacos-sdk-csharp/
Demo for ASP.NET Core Integration
App.csproj

<ItemGroup>
  <PackageReference Include="nacos-sdk-csharp.AspNetCore" Version="\${latest.version}" />
</ItemGroup>
*/

/* Refer to document: https://github.com/nacos-group/nacos-sdk-csharp/blob/dev/samples/App1/appsettings.json
*  appsettings.json
{
  "nacos": {
    "ServerAddresses": [ "http://localhost:8848" ],
    "DefaultTimeOut": 15000,
    "Namespace": "cs",
    "ServiceName": "App1",
    "GroupName": "DEFAULT_GROUP",
    "ClusterName": "DEFAULT",
    "Port": 0,
    "Weight": 100,
    "RegisterEnabled": true,
    "InstanceEnabled": true,
    "Ephemeral": true,
    "NamingUseRpc": true,
    "NamingLoadCacheAtStart": ""
  }
}
*/

// Refer to document: https://github.com/nacos-group/nacos-sdk-csharp/blob/dev/samples/App1/Startup.cs
using Nacos.AspNetCore.V2;

public class Startup
{
    public Startup(IConfiguration configuration)
    {
        Configuration = configuration;
    }

    public IConfiguration Configuration { get; }

    public void ConfigureServices(IServiceCollection services)
    {
        // ....
        services.AddNacosAspNet(Configuration);
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        // ....
    }
}`
    }

    // 获取数据并生成代码
    const getData = () => {
      loading.value = true
      
      setTimeout(() => {
        const namespace = getParams('namespace') || ''
        const record = currentRecord.value || {}
        const name = record.name || 'example-service'
        const group = record.group || 'DEFAULT_GROUP'
        
        const data = {
          name,
          group,
          namespace,
        }

        javaCode.value = getJavaCode(data)
        springCode.value = getSpringCode()
        springBootCode.value = getSpringBootCode()
        springCloudCode.value = getSpringCloudCode()
        pythonCode.value = getPythonCode()
        csharpCode.value = getCSharpCode()

        loading.value = false
      }, 100)
    }

    // 打开对话框
    const openDialog = (record?: ShowServiceCodeingProps['record']) => {
      dialogVisible.value = true
      currentRecord.value = record || props.record || {}
      activeTab.value = 'java'
      
      setTimeout(() => {
        getData()
      })
    }

    // 关闭对话框
    const closeDialog = () => {
      dialogVisible.value = false
      emit('close')
    }

    // 切换标签页
    const handleTabChange = (tabName: string) => {
      activeTab.value = tabName
    }

    // 暴露方法
    expose({
      openDialog,
      closeDialog,
    })

    // 监听 props.record 变化
    watch(() => props.record, (newRecord) => {
      if (newRecord && dialogVisible.value) {
        currentRecord.value = newRecord
        getData()
      }
    }, { deep: true })

    return () => (
      <ElDialog
        modelValue={dialogVisible.value}
        onUpdate:modelValue={(val: boolean) => {
          dialogVisible.value = val
          if (!val) {
            closeDialog()
          }
        }}
        title={t('showCodeing.sampleCode')}
        width="80%"
        v-slots={{
          default: () => (
            <div class="show-service-codeing-container" style={{ height: '500px' }}>
              <ElLoading
                v-loading={loading.value}
                text={t('showCodeing.loading')}
                style={{ width: '100%' }}
              >
                <ElTabs
                  modelValue={activeTab.value}
                  onUpdate:modelValue={(val: string) => handleTabChange(val)}
                  type="border-card"
                >
                  <ElTabPane label="Java" name="java">
                    <MonacoEditor
                      value={javaCode.value}
                      language={currentLanguage.value}
                      height={450}
                      readOnly={true}
                    />
                  </ElTabPane>
                  <ElTabPane label="Spring" name="spring">
                    <MonacoEditor
                      value={springCode.value}
                      language={currentLanguage.value}
                      height={450}
                      readOnly={true}
                    />
                  </ElTabPane>
                  <ElTabPane label="Spring Boot" name="springBoot">
                    <MonacoEditor
                      value={springBootCode.value}
                      language={currentLanguage.value}
                      height={450}
                      readOnly={true}
                    />
                  </ElTabPane>
                  <ElTabPane label="Spring Cloud" name="springCloud">
                    <MonacoEditor
                      value={springCloudCode.value}
                      language={currentLanguage.value}
                      height={450}
                      readOnly={true}
                    />
                  </ElTabPane>
                  <ElTabPane label="Node.js" name="nodejs">
                    <MonacoEditor
                      value={nodejsCode.value}
                      language={currentLanguage.value}
                      height={450}
                      readOnly={true}
                    />
                  </ElTabPane>
                  <ElTabPane label="C++" name="cpp">
                    <MonacoEditor
                      value={cppCode.value}
                      language={currentLanguage.value}
                      height={450}
                      readOnly={true}
                    />
                  </ElTabPane>
                  <ElTabPane label="Shell" name="shell">
                    <MonacoEditor
                      value={shellCode.value}
                      language={currentLanguage.value}
                      height={450}
                      readOnly={true}
                    />
                  </ElTabPane>
                  <ElTabPane label="Python" name="python">
                    <MonacoEditor
                      value={pythonCode.value}
                      language={currentLanguage.value}
                      height={450}
                      readOnly={true}
                    />
                  </ElTabPane>
                  <ElTabPane label="C#" name="csharp">
                    <MonacoEditor
                      value={csharpCode.value}
                      language={currentLanguage.value}
                      height={450}
                      readOnly={true}
                    />
                  </ElTabPane>
                </ElTabs>
              </ElLoading>
            </div>
          ),
        }}
      />
    )
  },
})

