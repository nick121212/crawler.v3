import * as _ from 'lodash';

import { DiscoverLinks } from './libs/discover';
import { Queue } from './libs/queue';

/**
 * 分析得出的url处理分析出需要的
 * @param config
 */
export default ({ discoverConfig = {}, queueConfig = {} }) => {
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
            let q = queue.queueURL(url, ctx.queueItem || {});
            q && allowUrls.push(q);
        });

        await next();
    };
};

module.exports = function () {
    const seneca: any = this;

    seneca.add({ role: 'crawler.plugins', cmd: 'url' }, async ({ queueItem, discoverConfig = {}, queueConfig = {} }, done) => {
        let discoverLink = new DiscoverLinks(discoverConfig || {});
        let queue = new Queue(queueConfig || {});
        let urls: Array<string> = await discoverLink.discoverResources(queueItem);
        let allowUrls: Array<any> = [];

        // url地址queue化
        urls.forEach((url: string) => {
            let q = queue.queueURL(url, queueItem || {});

            q && allowUrls.push(q);
        });

        done(null, allowUrls);
    });

    return 'crawler.plugins.url';
};