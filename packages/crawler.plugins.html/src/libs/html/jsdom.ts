let jsdom = require("jsdom");
let _ = require("lodash");
let fs = require("fs");

import * as _ from 'lodash';
import * as jsdom from 'jsdom';
import * as _fs from 'fs';

const jquery = fs.readFileSync(`${__dirname}/../../../../node_modules/jquery/dist/jquery.min.js`, "utf-8");

export class JsDomDealStrategy {
    /**
     * @param queueItem {Object} 数据
     */
    load(queueItem, $): Promise<any> {
        return new Promise((resolve, reject) => {
            !$ && jsdom.env({
                html: queueItem.responseBody.replace(/iframe/g, "iframe1"),
                parsingMode: "html",
                src: [jquery],
                done: function (err, window) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(window.$("body"));
                }
            });
            if ($) {
                resolve($);
            }
        });
    }

    /**
     * @param queueItem {Object} 数据
     * @param data      {Object} 单个数据配置
     * @param $         {Cheerio} Dom节点
     * @param index     {number}  数组中，节点的索引
     * @return promise
     */
    doDeal(queueItem, data, $, index) {
        let $sel, result, len = 0;
        let $noSelcSel;

        return new Promise(async (resolve, reject) => {
            // 载入当前的cheerio根节点
            $ = await this.load(queueItem, $);

            // 如果存在index，则获取索引节点
            if (typeof index === "number" && $.size() > index) {
                $sel = $.eq(index);
            }
            try {
                $noSelcSel = $sel || $;
                // 查找当前的dom
                $sel = this.doFindSelector($noSelcSel, data.selector);
                $sel && (len = $sel.length);

                if (len && data.methodInfo) {
                    $sel = this.doRemoveEle($sel, data.removeSelector);
                    result = this.doCallMethod($sel, data.methodInfo);
                }

                resolve({
                    result: result,
                    data: _.cloneDeep(data),
                    $cur: $sel,
                    $noSelcSel: $noSelcSel,
                    $parent: $,
                    len: len,
                    index: index
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    doRemoveEle($sel, selector) {
        if (!_.isArray(selector)) {
            selector = [selector];
        }
        _.each(selector, (sel) => {
            try {
                $sel.find(sel).remove();
            } catch (e) { }
        });

        return $sel;
    }

    /**
     * 取得元素节点
     * @param $ {Object} cheerio对象
     * @param selector {Array|String} 搜索字段
     * @return cheerio对象
     */
    doFindSelector($, selector) {
        let $sel = $;

        if (!selector) {
            selector = [];
        }
        if (!_.isArray(selector)) {
            typeof selector === "string" && (selector = [selector]);
        }

        if (!_.isArray(selector)) {
            return $sel;
        }

        _.each(selector, (sel) => {
            switch (typeof sel) {
                case "string":
                    $sel = $sel.find(sel);
                    break;
                case "object":
                    $sel = this.doCallMethod($sel, sel);
                    break;
            }
            if (!$sel.length) {
                return false;
            }
        });

        return $sel;
    }

    /**
     * 调用方法
     * @param $   {Object} cheerio对象
     * @param methodInfo {Object} 调用的方法名称
     * @returns {*}
     */
    doCallMethod($, methodInfo) {
        let $sel = null;

        _.forEach(methodInfo, (params, method) => {
            if (params && !_.isArray(params)) {
                params = [params];
            }
            $sel = $[method].apply($, params || []);
        });

        return $sel;
    }
}

export default new JsDomDealStrategy();