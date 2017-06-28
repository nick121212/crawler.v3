import { urlPlugin } from './index';

const config = {
    "queue": {
        "ignoreWWWDomain": false,
        "stripWWWDomain": false,
        "scanSubdomains": false,
        "host": "www.yaolan.com",
        "initialProtocol": "http",
        "initialPort": 80,
        "stripQuerystring": true,
        "fetchConditions": [],
        "domainWhiteList": ["www.yaolan.com"],
        "filterByDomain": true
    },
    "discover": {
        "parseHTMLComments": false,
        "parseScriptTags": false,
        "allowedProtocols": [/http/, /https/],
        "whitePathList": [{ "regexp": "/(.*?)/", "scope": "i", "enable": true }],
        "blackPathList": [],
        "userAgent": "",
        "fetchWhitelistedMimeTypesBelowMaxDepth": false,
        "maxDepth": 0,
        "ignoreRobots": false
    }
};

let discover = urlPlugin(config)({}, () => { }).then((data) => {
    console.log(data);
}).catch((err) => { console.log(err) });