let a = {
    "queueItem": {
        "url": "http://www.yaolan.com",
        "path": "/",
        "depth": 0,
        "query": ""
    },
    "plugins": [{
        "key": "crawler.plugins.downloader",
        "pattern": { "role": "crawler.plugins", "cmd": "downloader" }
    }, {
        "key": "crawler.plugins.url",
        "pattern": { "role": "crawler.plugins", "cmd": "url" },
        "resultPath": "/url",
        "config": {
            "queueConfig": {
                "ignoreWWWDomain": false,
                "stripWWWDomain": false,
                "scanSubdomains": true,
                "host": "www.yaolan.com",
                "initialProtocol": "http",
                "initialPort": 80,
                "stripQuerystring": true,
                "fetchConditions": [],
                "domainWhiteList": ["(.*?).yaolan.com"],
                "filterByDomain": true
            },
            "discoverConfig": {
                "parseHTMLComments": false,
                "parseScriptTags": false,
                "allowedProtocols": ["http", "https"],
                "whitePathList": [{ "path": "/(.*?)", "enable": true }],
                "userAgent": "",
                "fetchWhitelistedMimeTypesBelowMaxDepth": false,
                "maxDepth": 0,
                "ignoreRobots": true
            }
        }
    }, {
        "key": "crawler.plugins.html",
        "pattern": { "role": "crawler.plugins", "cmd": "html" },
        "resultPath": "/result",
        "config": {
            "pages": [{
                "key": "health-post",
                "path": "/health/d+.shtml",
                "areas": [],
                "fieldKey": "",
                "fields": {
                    "none": {
                        "data": [{
                            "key": "title",
                            "selector": ["#final_content .sfinal_w:eq(0) h1:eq(0)"],
                            "removeSelector": [],
                            "methodInfo": { "text": [] },
                            "htmlStrategy": "jsdom",
                            "dealStrategy": "normal"
                        }, {
                            "key": "content",
                            "selector": ["#content_p"],
                            "removeSelector": [],
                            "methodInfo": { "html": [] },
                            "htmlStrategy": "jsdom",
                            "dealStrategy": "normal"
                        }]
                    }
                },
                "enabled": true
            }, {
                "key": "main",
                "path": "",
                "areas": [],
                "fieldKey": "",
                "fields": {
                    "none": {
                        "data": [{
                            "key": "array",
                            "selector": ["#ylHnTime li"],
                            "dealStrategy": "array",
                            "data": [{
                                "key": "name",
                                "selector": ["a"],
                                "methodInfo": { "text": [] },
                                "dealStrategy": "normal"
                            }]
                        }, {
                            "selector": ["#ylHnTime li"],
                            "dealStrategy": "switch",
                            "data": [{
                                "selector": "a",
                                "methodInfo": { "attr": ["title"] },
                                "match": "0-1岁",
                                "data": [{
                                    "key": "switch",
                                    "selector": ["a"],
                                    "formats": [{ "str": [] }],
                                    "methodInfo": { "text": [] }
                                }],
                                "dealStrategy": "case"
                            }]
                        }]
                    }
                },
                "enabled": true
            }, {
                "key": "num",
                "path": "",
                "areas": [],
                "fieldKey": "",
                "enabled": true,
                "fields": {
                    "none": {
                        "data": [{
                            "key": "num",
                            "selector": ["#text_Keywords"],
                            "dealStrategy": "normal",
                            "methodInfo": { "val": [] },
                            "formats": [
                                { "key": "trim", "settings": { "start": true, "end": true, "mimddle": true } },
                                { "key": "regexp", "settings": { "regexp": "/\\d+/", "scope": "i", "index": 0 } },
                                { "key": "num" }
                            ]
                        }]
                    }
                }
            }]
        }
    }]
}