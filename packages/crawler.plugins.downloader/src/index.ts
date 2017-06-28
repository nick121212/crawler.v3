/**
 * 下载插件
 * @param options 参数
 */

import { modelProxy, IProxyCtx, IInterfaceModel, IExecute } from 'modelproxy';
import { RequestEngine } from './request';

const proxy = new modelProxy.Proxy();

proxy.addEngines({
    "request": new RequestEngine()
});


export const downloaderPlugin = ({ downloader }): (ctx: any, next: Function) => Promise<any> => {
    proxy.loadConfig({
        "key": "download",
        "title": "download下载接口",
        "state": "prod",
        "engine": "request",
        "states": {
            "prod": downloader.url
        },
        "interfaces": [{
            "path": "/",
            "method": "get",
            "key": "download",
            "title": ""
        }]
    });

    return async (ctx, next) => {
        let res = await proxy.execute("/download/download", {});

        return {
            statusCode: res.statusCode,
            responseBody: res.body
        };
    }
}