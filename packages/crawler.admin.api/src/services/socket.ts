import { Service, Inject, InjectorService, ExpressApplication } from 'ts-express-decorators';
import { $log } from 'ts-log-debug';
import * as bluebird from 'bluebird';
import * as socketIo from 'socket.io';
import * as _ from 'lodash';
import { NotFound } from "ts-httpexceptions";

import { ConfigService, IConfigService } from './config';

/**
 * socket服务
 */
@Service()
export class SocketService {
    public socket: SocketIO.Server;
    private users: Object = {};

    /**
     * 构造函数
     * @param configFactory 基础的配置信息
     */
    constructor(
        @Inject(ConfigService) private configFactory: IConfigService
    ) { }

    /**
     * 初始化
     * @param server http服务
     */
    init(server: any) {
        this.socket = socketIo(server, this.configFactory.config.baseInfo.socket as any)
        this.initEvents();
    }

    /**
     * 初始化事件
     */
    initEvents() {
        this.socket.on("connect", (client) => {
            let customType = client.request.headers["x-custom-type"];

            /**
             * 临时存储数据
             */
            this.users[client.id] = {
                baseInfo: {},
                client: client
            };
            /**
             * 根据收到的header来区分存入的room
             */
            if (customType == "crawler.node") {
                client.join(customType);
            }
            /**
             *  失去连接的时候触发
             */
            client.on("disconnection", () => {
                delete this.users[client.id];
                client.leaveAll();
                $log.info(`${client.id} disconnect!`);
            });
            /**
             * 接受消息,传递节点的基础信息
             */
            client.on("message", (baseInfo: any) => {
                this.users[client.id].baseInfo = baseInfo;
            });
            // 连接的日志
            $log.info(`${client.id} connect!`);
            // this.socket.to("crawler.node").send("hello crawler.node")
        });
    }

    /**
     * 调用节点，获取爬取后的结果
     * @param data 需要发送的数据
     */
    async emitCrawlerNodeExecute(data): Promise<any> {
        let socket = _.sortBy(this.users, "baseInfo.leftTask").pop();

        return new bluebird((resolve, reject) => {
            if (!socket) {
                return reject(new NotFound("没有发现爬虫节点！"));
            }

            socket.client.emit("crawler.node.execute", data, (err, data) => {
                if (err) {
                    return reject(err);
                }

                resolve(data);
            });
        });
    }
}