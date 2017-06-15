# 爬虫代理

负责爬虫的代理更换

# 接口

1. 代理列表信息

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