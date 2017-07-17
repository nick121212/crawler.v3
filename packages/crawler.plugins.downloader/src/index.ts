/**
 * 下载插件
 * @param options 参数
 */

import { modelProxy, IProxyCtx, IInterfaceModel, IExecute } from 'modelproxy';
import { RequestEngine } from './request';

// const proxy = new modelProxy.Proxy();

// proxy.addEngines({
//     "request": new RequestEngine()
// });

// export default (config: any): (ctx: any, next: Function) => Promise<any> => {
//     return async (ctx, next) => {
//         proxy.loadConfig({
//             "key": "download",
//             "title": "download下载接口",
//             "state": "prod",
//             "engine": "request",
//             "states": {
//                 "prod": ctx.queueItem.url
//             },
//             "interfaces": [{
//                 "path": "/",
//                 "method": "get",
//                 "key": "download",
//                 "title": ""
//             }]
//         });

//         let res = await proxy.execute("/download/download", ctx.proxyInfo || {});

//         ctx.queueItem = Object.assign(ctx.queueItem, {
//             statusCode: res.statusCode,
//             responseBody: res.body,
//             crawlerCount: ~~ctx.queueItem.crawlerCount + 1
//         });

//         await next();
//     }
// }

module.exports = function() {
    const seneca: any = this;
    const proxy = new modelProxy.Proxy();

    proxy.addEngines({
        "request": new RequestEngine()
    });

    seneca.add({ role: 'crawler.plugins', cmd: 'downloader' }, async ({ queueItem, proxyInfo = {} }, done) => {
        proxy.loadConfig({
            "key": "download",
            "title": "download下载接口",
            "state": "prod",
            "engine": "request",
            "states": {
                "prod": queueItem.url
            },
            "interfaces": [{
                "path": "/",
                "method": "get",
                "key": "download",
                "title": ""
            }]
        });

        proxy.execute("/download/download", proxyInfo || {}).then((res) => {
            done(null, Object.assign(queueItem, {
                statusCode: res.statusCode,
                responseBody: res.body,
                crawlerCount: ~~queueItem.crawlerCount + 1
            }));
        }).catch(done);
    });

    return 'crawler.plugins.downloader';
};