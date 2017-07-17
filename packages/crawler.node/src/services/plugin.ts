import { NotFound, TooManyRequests, HTTPException } from 'ts-httpexceptions';
import { Service, InjectorService, Inject, ExpressApplication } from "ts-express-decorators";
import { $log } from 'ts-log-debug';
import * as Kue from 'kue';
import * as _ from 'lodash';
import * as Seneca from 'seneca';
import * as bluebird from 'bluebird';
import * as jpp from 'json-pointer';

import { Log } from '../decorations/log.func';
import { BaseInfoFactory, IBaseInfoFactory } from './baseinfo';
import { KueService } from './kue';
import { ConfigService } from "./config";
import { SocketService } from "./socket";

/**
 * 执行插件的服务
 * 根据插件的配置和顺序，依次执行插件
 * 每个插件返回每个插件的数据
 */
@Service()
export class PluginService {
    private seneca: any;

    constructor(
        @Inject(BaseInfoFactory) private baseInfoFactory: IBaseInfoFactory,
        @Inject(KueService) private kueService: KueService,
        @Inject(ConfigService) private configFactory: ConfigService,
        @Inject(SocketService) private socketService: SocketService,
    ) {
        this.initJob();
        this.seneca = Seneca({
            strict: {
                add: false
            }
        })
            .use("basic")
            .use("entity")
            .use('redis-store', {
                db: 2,
                prefix: 'crawler',
                ...configFactory.config.redis.options
            });

        this.seneca.ready(function (err) {
            if (err) { return $log.error(err); }

            $log.info("Seneca Ready!");
        });

        this.socketService.socket.on("crawler.node.execute", async ({ queueItem, proxyInfo, plugins }, reply) => {
            this.execute(queueItem, proxyInfo, plugins).then(reply.bind(null, null)).catch(reply);
        });
    }

    /**
    * 新建更换代理的job
    * @param ip ip地址
    */
    public async createJob(queueItem: any, proxyInfo: any, plugins: Array<any>): Promise<any> {
        let job: Kue.Job = this.kueService.queue.create(`excute.plugins`, {
            queueItem,
            proxyInfo,
            plugins,
            createAt: Date.now()
        });

        return new Promise((resolve, reject) => {
            job.attempts(2).backoff({ delay: 1000 * 3, type: 'fixed' }).ttl(1000 * 3).removeOnComplete(true).save((err) => {
                if (err) {
                    return reject(err);
                }
                resolve(job);
            });
        });
    }

    /**
     * 绑定更换代理job
     */
    private initJob() {
        let baseInfo = this.baseInfoFactory.getInfo();

        // 监听插件执行的消息，执行插件列表
        this.kueService.queue.process(`excute.plugins`, baseInfo.maxTask, async (job: Kue.Job, done: any) => {
            let { queueItem = {}, proxyInfo = {}, plugins = [] } = job.data || {};
            this.execute(queueItem, proxyInfo, plugins).then(done.bind(null, null)).catch(done);
        });

        // 监听job的完成
        this.kueService.queue.on("job complete", (id: number, result: any) => {
            if (result && result.type == 'crawler.execute') {
                let res = this.seneca.make$("crawler_node_result", {
                    id: result.queueItem._id,
                    result,
                    createAt: Date.now()
                });

                this.socketService.sendPluginResult(result);

                res.save$((err, apple) => {
                    $log.info(`当前任务${id}执行完毕！空闲线程数：${this.baseInfoFactory.currentTask}`);
                });
            }
        });
    }

    /**
     * 执行插件one by one
     * @param queueItem 当前爬取的链接
     * @param proxyInfo 代理信息
     * @param config    配置信息
     */
    private async execute(queueItem: any = {}, proxyInfo: any = {}, plugins: Array<any> = []): Promise<any> {
        let baseInfo = this.baseInfoFactory.getInfo(), res;

        $log.info((`当前任务数（${this.baseInfoFactory.currentTask}）,最大任务数（${this.baseInfoFactory.maxTask}）!`));
        if (this.baseInfoFactory.isLock) {
            throw new TooManyRequests(`当前任务数（${this.baseInfoFactory.currentTask}）,超过最大任务数（${this.baseInfoFactory.maxTask}）!`);
        }
        this.baseInfoFactory.currentTask = this.baseInfoFactory.currentTask + 1;
        try {
            res = await this.executePlugins(queueItem, proxyInfo, plugins);
            // await bluebird.delay(3000);
            this.baseInfoFactory.currentTask = this.baseInfoFactory.currentTask - 1;
            // $log.info((`当前任务数（${this.baseInfoFactory.currentTask}）,最大任务数（${this.baseInfoFactory.maxTask}）!`));
        } catch (e) {
            this.baseInfoFactory.currentTask = this.baseInfoFactory.currentTask - 1;
            // $log.info((`当前任务数（${this.baseInfoFactory.currentTask}）,最大任务数（${this.baseInfoFactory.maxTask}）!`));
            $log.error(e);
            throw new HTTPException(601, e.message);
        }

        return res;
    }

    /**
     * 执行单个插件
     * @param res         数据
     * @param pluginInfo  插件信息
     */
    private executePlugin(res, pluginInfo: any): Promise<any> {
        let { queueItem, proxyInfo } = res;

        return new Promise((resolve, reject) => {
            if (!this.seneca.has(pluginInfo.pattern)) {
                this.seneca.use(pluginInfo.key);
            }
            let config = Object.assign({}, pluginInfo.pattern, {
                queueItem,
                proxyInfo,
                ...(pluginInfo.config || {})
            });

            this.seneca.act(config, (err, results) => {
                if (err) {
                    return reject(err);
                }
                pluginInfo.resultPath && jpp(res).set(pluginInfo.resultPath, results);
                resolve(results);
            });
        });
    }

    /**
     * 执行plugins
     * @param queueItem 爬取的链接
     * @param proxyInfo 代理信息
     * @param plugins   插件配置列表
     */
    private async executePlugins(queueItem: any, proxyInfo: any, plugins: Array<any>): Promise<any> {
        let res = { queueItem, proxyInfo, isError: false, type: 'crawler.execute' }, pluginCount = plugins.length, currentIndex = 0;

        $log.info(`开始执行爬取任务${queueItem.url}!`);
        while (currentIndex < pluginCount) {
            try {
                await this.executePlugin(res, plugins[currentIndex]);
            } catch (e) {
                $log.error(e);
                res.isError = true;
                throw e;
            }

            currentIndex++;
        }
        $log.info(`爬取任务${queueItem.url}完成!`);

        return res;
    }
}

InjectorService.factory(PluginService, InjectorService.invoke<PluginService>(PluginService));