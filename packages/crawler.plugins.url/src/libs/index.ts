import * as _ from 'lodash';

import { DiscoverLinks } from './discover';
import { Queue } from './queue';

/**
 * 替换正则字符串
 * @param str 替换的字符串
 */
const replaceRegexp = (str:string) => {
    str = str || "";
    str = str.toString();

    return str.replace(/(^\/)|(\/$)/g, "");
}
/**
 * 处理配置文件
 * @params config {config} 分析的配置文件
 */
const dealConfig = (config: any) => {
    config.blackPathList = config.blackPathList || [];
    config.blackPathList = config.blackPathList.map((path) => {
        return new RegExp(replaceRegexp(path.regexp), path.scope);
    });
    // 查找enable是true的白名单
    config.whitePathList = _.filter(config.whitePathList, (list: any) => {
        return list.enable === true;
    });
    // 白名单中的正则过滤
    config.whitePathList = config.whitePathList.map((path) => {
        return new RegExp(replaceRegexp(path.regexp), path.scope);
    });

    return config;
};

/**
 * 分析得出的url处理分析出需要的
 * @param config
 */
export const urlPlugin = ({ discoverConfig = {}, queueConfig = {} }) => {
    /**
     * 返回中间件方法
     */
    return async (ctx: any, next: Function) => {
        let discoverLink = new DiscoverLinks(dealConfig(discoverConfig || {}));
        let queue = new Queue(dealConfig(queueConfig || {}));
        let urls = await discoverLink.discoverResources(ctx.queueItem);
        let allowUrls: Array<any> = [];

        urls.forEach((url) => {
            allowUrls.push(queue.queueURL(url, ctx.queueItem || {}));
        });

        ctx.urls = allowUrls.filter((url) => {
            return url !== false;
        });

        await next();
    };
};