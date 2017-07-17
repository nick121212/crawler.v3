import { Service, Inject, InjectorService } from 'ts-express-decorators';
import * as Kue from 'kue';
import { $log } from 'ts-log-debug';
import * as bluebird from 'bluebird';
import { Client } from 'elasticsearch';
import * as _ from 'lodash';

import { ConfigService, IConfigService } from './config';

const fields = [
    "protocol",
    "host",
    "query",
    "port",
    "path",
    "depth",
    "url",
    "errorCount",
    "error",
    "statusCode",
    "responseBody",
    "responseBodyText",
    "@timestamp",
    "status",
    "updatedAt"
]

/**
 * elasticsearch 服务
 */
@Service()
export class ElasticService {
    public client: Elasticsearch.Client;

    /**
     * 构造函数
     * @param configFactory 配置文件服务类
     */
    constructor(
        @Inject(ConfigService) private configFactory: IConfigService
    ) {
        this.client = new Client(configFactory.config.elasticsearch);
        this.client.ping({
            // ping usually has a 3000ms timeout
            requestTimeout: 1000
        }, function (error) {
            if (error) {
                console.trace('elasticsearch cluster is down!');
            } else {
                console.log('All is well');
            }
        });
    }

    pick(result: any, fields: Array<string>) {
        let res = {};

        _.each(fields, (field) => {
            let val = _.pick(result, field);

            val && val[field] && (res[field] = val[field]);
        });

        return res;
    }

    /**
     * 保存分析出来的链接地址
     * 先判断地址是不是已经在es中
     * 存在的话，则不存入queue中
     * @param urls 连接数组
     */
    public async saveUrls(urls: Array<any>, esIndex: string, esType: string): Promise<Array<any>> {
        const urlsById = _.keyBy(urls, "_id");
        let docs: Array<any> = [];

        _.forEach(urlsById, (url) => {
            docs.push({
                _index: esIndex,
                _type: esType,
                _id: url._id
            });
        });
        // 判断链接是否存在

        if (!docs.length) {
            return [];
        }

        let resources = await this.client.mget({
            body: {
                docs: docs
            },
            storedFields: ["statusCode"]
        });

        // 如果不存在，则新建；
        let newUrls = _.filter(resources.docs, (doc) => {
            if (doc.error && doc.error.type === "index_not_found_exception") {
                return true;
            }
            if (doc.found === false) {
                return true;
            }

            return false;
        });

        docs = [];
        // 保存新增的地址
        _.each(newUrls, (url) => {
            if (urlsById[url._id]) {
                docs.push({
                    create: {
                        _index: esIndex,
                        _type: esType,
                        _id: url._id
                    }
                });
                docs.push(this.pick(_.extend({ "@timestamp": Date.now(), status: "queued" }, urlsById[url._id]), fields));
            }
        });
        if (docs.length) {
            let urlsResult = await this.client.bulk({
                body: docs
            });

            return urlsResult.items.map((url: any) => {
                if (url.create && url.create.created) {
                    return urlsById[url.create._id];
                }

                return null;
            });
        }

        return [];
    }

    /**
     * 存储当前的地址
     * @param queueItem 
     * @param esIndex 
     * @param esType 
     */
    async saveQueueItem(queueItem: any, esIndex: string, esType: string): Promise<any> {
        let docs: Array<any> = [];

        if (queueItem && queueItem._id) {
            docs.push({
                index: {
                    _index: esIndex,
                    _type: esType,
                    _id: queueItem._id
                }
            });
            queueItem.status = "complete";
            docs.push(this.pick(queueItem, fields));

            if (docs.length) {
                return await this.client.bulk({
                    body: docs
                });
            }
        }

        return {};
    }
}

// 工厂方法注册
InjectorService.factory(ElasticService, InjectorService.invoke<ElasticService>(ElasticService));