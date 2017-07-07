import * as _ from 'lodash';

import { DiscoverLinks } from './libs/discover';
import { Queue } from './libs/queue';

/**
 * 分析得出的url处理分析出需要的
 * @param config
 */
export const urlPlugin = ({ discoverConfig = {}, queueConfig = {} }) => {
    /**
     * 返回中间件方法
     */
    return async (ctx: any, next: Function) => {
        let discoverLink = new DiscoverLinks(discoverConfig || {});
        let queue = new Queue(queueConfig || {});
        let urls: Array<string> = await discoverLink.discoverResources(ctx.queueItem);
        let allowUrls: Array<any> = [];

        // url地址queue化
        urls.forEach((url: string) => {
            allowUrls.push(queue.queueURL(url, ctx.queueItem || {}));
        });

        // 过滤可用的url
        ctx.urls = allowUrls.filter((url) => {
            return url !== false;
        });

        await next();
    };
};