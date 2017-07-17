import { Service, Inject, InjectorService } from 'ts-express-decorators';
import * as amqplib from 'amqplib';
import { $log } from 'ts-log-debug';
import * as bluebird from 'bluebird';
import * as _ from 'lodash';
import * as URI from "urijs";
import * as md5 from "blueimp-md5";

import { ConfigService, IConfigService } from './config';
import { SocketService } from "./socket";
import { ElasticService } from "./elastic";
import { PluginService } from "./plugin";

process.on('unhandledRejection', (reason, p) => {
    console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
});

/**
 * agenda服务
 */
@Service()
export class QueueService {
    private connection: amqplib.Connection;
    private channel: amqplib.Channel;
    private consume: amqplib.Replies.Consume;
    private exchange: amqplib.Replies.AssertExchange;
    // private msgs: Array<amqplib.Message> = [];
    // private workerCtx: Map<number, any> = new Map();

    private queueName: string;
    private config: any;

    /**
     * 构造函数
     * @param configFactory 配置文件服务类
     */
    constructor(
        @Inject(ConfigService) private configFactory: IConfigService,
        private elasticService: ElasticService,
        private socketService: SocketService,
        private pluginService: PluginService
    ) {

    }

    public instance(): QueueService {
        return new QueueService(this.configFactory, this.elasticService, this.socketService, this.pluginService);
    }

    /**
     * 初始化队列
     */
    private async initQueue(): Promise<void> {
        this.connection = await amqplib.connect(this.configFactory.config.rabbitmq.url, this.configFactory.config.rabbitmq.options);
        this.channel = await this.connection.createConfirmChannel();

        this.channel.on("error", (err) => {
            $log.trace(err);
        });
        this.channel.on("close", () => {
            console.log("channel closed!");
        });
    }

    /**
     * 初始化消费队列
     */
    async initConsume(queueName: string, config: any, prefetch: number = 1): Promise<void> {
        let count = 0, exchange: amqplib.Replies.AssertExchange, queue: amqplib.Replies.AssertQueue;
        await this.initQueue();

        this.queueName = queueName;
        this.config = config;
        exchange = await this.channel.assertExchange("amqp.topic", "topic", { durable: true });
        queue = await this.channel.assertQueue(queueName, { durable: true, exclusive: false });

        this.exchange = exchange;
        await this.channel.bindQueue(queue.queue, exchange.exchange, `crawler.url.${config.key}`);

        try {
            await this.channel.prefetch(prefetch);
            await this.initInitilizeUrls(this.config.initUrls);
            this.consume = await this.channel.consume(queue.queue, (msg: amqplib.Message) => {
                this.execute(msg).then((data: any) => {
                    // await bluebird.delay(3000);
                    this.pluginService.resultDone(this.config, data.queueItem, data.result);
                    $log.info("抓取成功：", data.queueItem.url);
                    this.channel.ack(msg);
                }).catch(async (err) => {
                    await bluebird.delay(3000);
                    this.channel.nack(msg);
                    $log.error(err);
                });
            }, { noAck: false, exclusive: false });
            $log.info(queue.consumerCount, queue.messageCount);
        } catch (e) {
            console.log(e);
        }
    }

    private async initInitilizeUrls(urls: Array<string>) {
        urls = urls.concat([]);

        urls = urls.map((url) => {
            return Object.assign({}, URI(url).normalize()._parts, {
                _id: md5(url),
                url
            });
        });

        return await this.save({
            queueItem: null,
            url: urls
        });
    }

    /**
     * 发送socket消息
     * @param msg    一条queue的消息
     */
    private async execute(msg) {
        // 返回promise，超时时间为60秒
        return new bluebird(async (resolve, reject) => {
            return this.socketService.emitCrawlerNodeExecute(Object.assign({},
                this.config, {
                    queueItem: JSON.parse(msg.content.toString())
                })).then(async (result: any) => {
                    await this.save(result);
                    resolve(result);
                }).catch(reject);
        }).timeout(30000);
    }

    /**
     * 保存分析出来的结果
     * @param data 
     */
    private async save(data: any): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const urls = await this.elasticService.saveUrls(data.url, `crawler.url.${this.config.key}`, this.config.key);
                const queueResult = await this.elasticService.saveQueueItem(data.queueItem, `crawler.url.${this.config.key}`, this.config.key);

                _.each(urls, (url) => {
                    url && this.channel.publish(this.exchange.exchange, `crawler.url.${this.config.key}`, new Buffer(JSON.stringify(url)), {});
                });

                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * 销毁队列
     */
    public async destroy(): Promise<void> {
        try {
            await this.channel.nackAll(true);
            await this.channel.cancel(this.consume.consumerTag);
            await this.channel.close();
            await this.connection.close();

            delete this.channel;
            delete this.connection;
            delete this.consume;
            delete this.config;
            delete this.exchange;

        } catch (e) {
            console.log(e);
        }
    }
}