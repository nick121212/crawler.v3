import * as _ from "lodash";

import { Base } from "./base";
import jsdom from "../html/jsdom";

export class Strategy extends Base {
    /**
     * 构造函数
     * 注册默认的解析策略
     */
    constructor() {
        super();
    }

    /**
     * 数组类型,直接返回空数组
     * @returns Promise
     */
    doDeal(queueItem, data, results, $, index) {
        return jsdom.doDeal(queueItem, data, $, index).then((res) => {
            let promises: Array<any> = [];

            for (let i = 0; i < res.len; i++) {
                promises = promises.concat(this.doDealData(queueItem, data.data.concat([]), results, res.$cur, i));
            }
            if (promises.length) {
                return Promise.all(promises).then((cases) => {
                    let rtnResults: Array<any> = [];

                    _.each(cases, (casee) => {
                        if (casee) {
                            _.each(casee.data.data, (d) => {
                                d.dataIndex = res.index;
                            });
                            rtnResults.push(casee);
                        }
                    });
                    return rtnResults;
                });
            }

            return res;
        });
    }
}

export default new Strategy();