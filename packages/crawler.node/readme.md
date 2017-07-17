
# 爬虫节点

负责调度插件列表

# 安装

1. mongo
> ```yum install mongodb```
> 
2. redis 2.6.12+

# 接口

1. 调用接口 

+ 类型 post
+ 参数JsonSchema
```
{
    "type":"object",
    "required":["hostKey","host",""],
    "description":"调用爬虫接口，开始爬取数据",
    "properties":{
        "hostKey":{"type":"string","title":"站点key"},
        "host":{"type":"string","title":"站点入口"},
        "hostStandy":{"type":"string","title":"备用站点入口"},
        "url":{"type":"string","title":"当前需要下载的地址"},
        "proxyInfo":{"type":"string","title":"代理信息"},
        "pContent":{"type":"string","插件数据"},
        "mqName":{"type":"string","title":"mq的名称"}
    }
}
```
+ 返回值JsonSchema 
```
{
    "type":"object",
    "required":["hostKey","mqName"],
    "description":"爬虫返回的数据结构",
    "properties":{
        "hostKey":{"type":"string","title":"站点key"},
        "mqName":{"type":"string","title":"mq的名称"},
        "urls":{"type":"array","items":{"type":"string"}},
        "abandon":{"type":"boolean","title":"是否丢弃"},
        "seal":{"type":"boolean","title":"是否被封"},
        "url":{"type":"string","title":"当前需要下载的地址"},
        "proxyInfo":{"type":"string","title":"代理信息"
        "result":{
            "type":"object",
            "required":["tableName","data"],
            "properties":{
                "tableName":{"type":"string","title":"数据结果的表名"},
                "data":{"type":"object","title":"数据的结果"}
            }
        }
    }
}
```


2. 列表信息

+ 类型 get
+ 返回值JsonSchema
```
    {
        "type":"object",
        "description":"爬虫节点的数据结构",
        "properties":{
            "key":{"type":"string","title":"节点唯一标识"},
            "ip":{"type":"string","title":"IP"},
            "port":{"type":"number","title":"端口"},
            "lastDownloadTime":{"type":"number","title":"上次爬取消耗的时间（单位:ms）"},
            "taskCount":{"type":"number","title":"最大任务数量"},
            "currTaskCount":{"type":"number","title":"当前占用任务数量"}
        }
    }
```

3. 代理列表信息

+ 类型 get
+ 返回值JsonSchema
```
    {
        "type":"object",
        "description":"爬虫代理的数据结构",
        "properties":{
            "key":{"type":"string","title":"节点唯一标识"},
            "ip":{"type":"string","title":"IP"},
            "port":{"type":"number","title":"端口"}
        }
    }
```

4. 代理重启接口

+ 类型 get
+ 返回值JsonSchema
```
    {
        "type":"object",
        "description":"爬虫代理的数据结构",
        "properties":{
            "code":{"type":"number","title":"返回码"},
            "message":{"type":"string","title":"信息"}
        }
    }
```