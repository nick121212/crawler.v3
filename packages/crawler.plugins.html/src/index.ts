import * as _ from 'lodash';
import * as pathToRegexp from 'path-to-regexp';

import format from './libs/format';
import analysis from './libs/analysis';

/**
 * 默认的解析html规则，读取body的innerText
 */
const defaultRule = {
    "areas": [],
    "fields": {
        "none": {
            "data": [{
                "key": "text",
                "selector": [],
                "removeSelector": ["script"],
                "methodInfo": { "text": [] },
                "formats": [{ "str": [] }],
                "htmlStrategy": "jsdom",
                "dealStrategy": "normal"
            }]
        }
    }
};

/**
 * 获取分析的规则
 * @param config     配置
 * @param queueItem  爬取的数据
 */
const getRules = (pages: Array<any> = [], queueItem: any = {}) => {
    return _.filter(pages, ({ path }) => {
        let pathToReg = pathToRegexp(path.toString(), []);

        return pathToReg.test(queueItem.path);
    });
};

/**
 * 分析得出的url处理分析出需要的
 * @param config
 */
export const htmlPlugin = (config: { pages: Array<any> }) => {
    /**
     * 返回中间件方法
     */
    return async (ctx: any, next: Function) => {
        let rules = getRules(config.pages, ctx.queueItem);
        let urls = [];
        let results: Array<any> = [];

        // 解析html页面成 文本，用于分词分析
        ctx.queueItem.responseBodyText = (await analysis.doDeal(ctx.queueItem, defaultRule)).result.text;
        // 解析规则，分析页面中的字段
        if (rules.length) {
            for (let rule of rules) {
                results.push((await analysis.doDeal(ctx.queueItem, rule)).result);
                // console.log((await analysis.doDeal(ctx.queueItem, rule)).result);
            }
        }
        console.log(results);
        ctx.results = results;

        await next();
    };
};