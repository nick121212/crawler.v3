# 爬虫系统

# 公共部分安装

1. 安装mongodb（2.4+）
2. 安装redis
3. 安装elasticsearch（2.4.3+）
4. 安装nodejs（6.0+）
5. 安装nginx
6. 创建mongodb用户
```
db.createUser({user:"admin",pwd:"123456",roles:[{role:"root",db:"admin"}]})
db.createUser({user:"crawler",pwd:"crawler",roles:[{role:"readWrite",db:"crawler"}]})
```
7. 安装elasticsearch插件header

# 详细描述

## crawler.node
1. 爬虫代理节点，提供ip代理服务。

大致流程说明：
1. 第一步：关闭nginx
2. 第二步：关闭pptp通道
3. 第三步：创建通道
4. 第四步：添加默认网关并且验证通道创建的地址是否在网关里面
5. 第五步：延时3s，重启nginx

安装：
* 安装nginx，配置正向代理配置文件,端口统一为8083。
```
    server{  
        resolver 8.8.8.8;  
        resolver_timeout 30s;   
        listen 8083;  
        location / {  
                proxy_pass http://$http_host$request_uri;  
                proxy_set_header Host $http_host;  
                proxy_buffers 256 4k;  
                proxy_max_temp_file_size 0;  
                proxy_connect_timeout 30;  
                proxy_cache_valid 200 302 10m;  
                proxy_cache_valid 301 1h;  
                proxy_cache_valid any 1m;  
        }  
}  
```
* 安装pptpsetup
* 安装nodejs
* 安装crawler.node代码

2. 爬虫节点，负责爬取页面的数据

* 插件机制

> 下载插件（downloader）；下载页面，返回页面的responseBody和statusCode;

依赖插件：null

大致流程说明：
* 调用url信息
* 返回数据

参数格式：
```
    {
        "type":"object",
        "description":"",
        "properties":{
            "type":{"type":"string","title":"下载类型","enum":["normal","interface"],"default":"normal"},
            "retry":{"type":"number","title":"重试次数","default":1},
            "url":{"type":"string","title":"需要下载的URL地址"},
            "params":{"type":"object","title":"接口参数"},
            "data":{"type":"object","title":"接口参数"},
            "method":{"type":"string","接口method","enum":["get","post","delete","put"]
        }
    }
```
返回数据格式：
```
    {
        "type":"object",
        "description":"",
        "properties":{
            "responseBody":{"type":"string","title":"页面的html字符串或接口数据"},
            "statusCode:{"type":"number","title":"状态码"},
            "type":{"type":"string","title":"下载类型","enum":["normal","interface"]}
        }
    }
```

> 错误处理插件；对下载的页面做分析，分析页面的错误码，根据配置做页面的处理;

依赖插件：
* 下载插件

大致流程说明：
* 判断下载插件的statusCode，根据配置来执行对应的错误返回
* 如果statusCode=200-299，执行下一个插件

> 分析地址插件；找出页面中需要下载的地址链接；

依赖插件：
* 下载插件

大致流程说明：
* 根据下载插件的responseBody来分析出所有的链接
* 根据配置中domian，path等信息过滤链接
* 返回过滤后的链接

参数格式：
```
    {
        "type":"object",
        "description":"",
        "properties":{
            "parseHTMLComments":{"type":"boolean","title":"是否需要搜索注释中的中的url"},
            "parseScriptTags":{"type":"boolean","title":"是否需要搜索script标签中的url"},
            "allowedProtocols":{"type":"array","title":"允许的协议类型","items":{
                "type":"string",
                "title":"协议类型",
                "enum":["http","https","ftp"]
            }},
            "whitePathList":{"type":"array","title":"路径白名单","items":{
                "type":"object",
                "properties":{
                    "used":{"type":"boolean","title":"是否启用"},
                    "rule":{"type":"string","title":"规则，需要配置如何匹配路径"}
                }
            }},
            "maxDepth":{"type":"number", "title":"最大路径层数"},
            "ignoreRobots":{"type":"boolean","title":"是否忽略机器人应答"}
        }
    }
```
返回数据格式：
```
    {
        "type":"object",
        "description":"",
        "properties":{
            "urls":{"type":"array","title":"匹配到的地址","items":{
                "type":"string",
                "title":"地址信息"
            }},
        }
    }
```

> 分析页面插件；根据配置解析页面，返回json数据；

依赖插件：
* 下载插件

大致流程说明：
* 解析responseBody中的数据

参数格式：
```
    {
        "type":"object",
        "description":"",
        "properties":{
            "pages":{"type":"array","title":"需要分析的页面数据","items":{
                "type":"object",
                "title":"单个分析的页面",
                "properties":{
                    "key":{"type":"string","title":"唯一值"},
                    "rule":{"type":"string","title":"地址规则"},
                    "strict":{"type":"boolean","title":"是否开启严格模式，开启则检测strictFields中的字段"},
                    "strictFields":{"type":"array","title":"检测字段，如果检测字段不存在则报错","items":{
                        "type":"string",
                        "title":"检测字段路径"
                    }},
                    "fieldKey":{"type":"string","title":"主键字段"},
                    "fields":{"type":"array","title":"字段配置","items":{
                        "type":"object",
                        "properties":{
                            "key":{"type":"string","title":"字段名"},
                            "selector":{"type":"string","title":"jquery选择器"},
                            "removeSelector":{"type":"string","title":"jquery选择器，需要删除的元素"},
                            "methodInfo":{"type":"object","title":"方法信息","items":{
                                "type":"object",
                                "properties":{
                                    "name":{"type":"string","title":"方法名"},
                                    "value":{"type":"any","title":"方法参数"}
                                }
                            }},
                            "dealStrategy":{"type":"string","title":"解析策略","enum":["normal","array","switch","case","or"]},
                        }
                    }},
                }
            }}
        }
    }
```
返回数据格式：
```
    {
        "type":"any",
        "description":"",
        "properties":{
            
        }
    }
```

> 存储插件；根据分析地址插件，再一次筛选未爬取过的链接，存储当前的爬取地址;

依赖插件：
* 解析地址插件

大致流程说明：
* 存储解析出来的地址，用于下次过滤，爬过的地址不再返回