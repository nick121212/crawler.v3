import * as _ from 'lodash';

/**
 * 分析得出的url处理分析出需要的
 * @param config
 */
export const urlPlugin = ({ discoverConfig = {}, queueConfig = {} }) => {
    /**
     * 返回中间件方法
     */
    return async (ctx: any, next: Function) => {
       
        await next();
    };
};