/**
 * ShowCodeing 组件
 * 代码展示组件（通用，用于配置管理）
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/components/ShowCodeing/ShowCodeing.js
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

export interface ShowCodeingProps {
  record?: {
    dataId?: string
    groupName?: string
    group?: string
  }
}

export default defineComponent<ShowCodeingProps>({
  name: 'ShowCodeing',
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
    const currentRecord = ref<ShowCodeingProps['record']>({})

    // 代码内容
    const javaCode = ref('')
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
    const getJavaCode = (data: { dataId: string; group: string }) => {
      return `/*
* Demo for Nacos
* pom.xml
    <dependency>
        <groupId>com.alibaba.nacos</groupId>
        <artifactId>nacos-client</artifactId>
        <version>\${version}</version>
    </dependency>
*/
package com.alibaba.nacos.example;

import java.util.Properties;
import java.util.concurrent.Executor;
import com.alibaba.nacos.api.NacosFactory;
import com.alibaba.nacos.api.config.ConfigService;
import com.alibaba.nacos.api.config.listener.Listener;
import com.alibaba.nacos.api.exception.NacosException;

/**
 * Config service example
 *
 * @author Nacos
 *
 */
public class ConfigExample {

	public static void main(String[] args) throws NacosException, InterruptedException {
		String serverAddr = "localhost";
		String dataId = "${data.dataId}";
		String group = "${data.group}";
		Properties properties = new Properties();
		properties.put(PropertyKeyConst.SERVER_ADDR, serverAddr);
		ConfigService configService = NacosFactory.createConfigService(properties);
		String content = configService.getConfig(dataId, group, 5000);
		System.out.println(content);
		configService.addListener(dataId, group, new Listener() {
			@Override
			public void receiveConfigInfo(String configInfo) {
				System.out.println("receive:" + configInfo);
			}

			@Override
			public Executor getExecutor() {
				return null;
			}
		});

		boolean isPublishOk = configService.publishConfig(dataId, group, "content");
		System.out.println(isPublishOk);

		Thread.sleep(3000);
		content = configService.getConfig(dataId, group, 5000);
		System.out.println(content);

		boolean isRemoveOk = configService.removeConfig(dataId, group);
		System.out.println(isRemoveOk);
		Thread.sleep(3000);

		content = configService.getConfig(dataId, group, 5000);
		System.out.println(content);
		Thread.sleep(300000);

	}
}
`
    }

    // 生成 Spring Boot 代码
    const getSpringBootCode = () => {
      return `// Refer to document: https://github.com/nacos-group/nacos-examples/tree/master/nacos-spring-boot-example/nacos-spring-boot-config-example
package com.alibaba.nacos.example.spring.boot.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import static org.springframework.web.bind.annotation.RequestMethod.GET;

@Controller
@RequestMapping("config")
public class ConfigController {

    @Value("\${useLocalCache:false}")
    private boolean useLocalCache;

    public void setUseLocalCache(boolean useLocalCache) {
        this.useLocalCache = useLocalCache;
    }

    @RequestMapping(value = "/get", method = GET)
    @ResponseBody
    public boolean get() {
        return useLocalCache;
    }
}`
    }

    // 生成 Spring Cloud 代码
    const getSpringCloudCode = () => {
      return `// Refer to document:  https://github.com/nacos-group/nacos-examples/tree/master/nacos-spring-cloud-example/nacos-spring-cloud-config-example
package com.alibaba.nacos.example.spring.cloud.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/config")
@RefreshScope
public class ConfigController {

    @Value("\${useLocalCache:false}")
    private boolean useLocalCache;

    @RequestMapping("/get")
    public boolean get() {
        return useLocalCache;
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
`
    }

    // 生成 C# 代码
    const getCSharpCode = () => {
      return `/*
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
        string serverAddr = "http://localhost:8848";
        string dataId = "${currentRecord.value?.dataId || 'example'}";
        string group = "${currentRecord.value?.groupName || currentRecord.value?.group || 'DEFAULT_GROUP'}";

        IServiceCollection services = new ServiceCollection();

        services.AddNacosV2Config(x =>
        {
            x.ServerAddresses = new List<string> { serverAddr };
            x.Namespace = "cs-test";

            // swich to use http or rpc
            x.ConfigUseRpc = true;
        });

        IServiceProvider serviceProvider = services.BuildServiceProvider();
        var configSvc = serviceProvider.GetService<INacosConfigService>();

        var content = await configSvc.GetConfig(dataId, group, 3000);
        Console.WriteLine(content);

        var listener = new ConfigListener();

        await configSvc.AddListener(dataId, group, listener);

        var isPublishOk = await configSvc.PublishConfig(dataId, group, "content");
        Console.WriteLine(isPublishOk);

        await Task.Delay(3000);
        content = await configSvc.GetConfig(dataId, group, 5000);
        Console.WriteLine(content);

        var isRemoveOk = await configSvc.RemoveConfig(dataId, group);
        Console.WriteLine(isRemoveOk);
        await Task.Delay(3000);

        content = await configSvc.GetConfig(dataId, group, 5000);
        Console.WriteLine(content);
        await Task.Delay(300000);
    }

    internal class ConfigListener : IListener
    {
        public void ReceiveConfigInfo(string configInfo)
        {
            Console.WriteLine("receive:" + configInfo);
        }
    }
}`
    }

    // 获取数据并生成代码
    const getData = () => {
      loading.value = true
      
      setTimeout(() => {
        const namespace = getParams('namespace') || ''
        const record = currentRecord.value || {}
        const dataId = record.dataId || ''
        const group = record.groupName || record.group || 'DEFAULT_GROUP'
        
        const data = {
          dataId,
          group,
          namespace,
        }

        javaCode.value = getJavaCode(data)
        springBootCode.value = getSpringBootCode()
        springCloudCode.value = getSpringCloudCode()
        pythonCode.value = getPythonCode()
        csharpCode.value = getCSharpCode()

        loading.value = false
      }, 100)
    }

    // 打开对话框
    const openDialog = (record?: ShowCodeingProps['record']) => {
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
            <div class="show-codeing-container" style={{ height: '500px' }}>
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

