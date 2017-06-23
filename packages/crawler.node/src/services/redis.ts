import { Service, Inject, InjectorService, ExpressApplication } from "ts-express-decorators";
import { Exception } from 'ts-httpexceptions';
import * as redis from 'ioredis';
import { $log } from 'ts-log-debug';

import { ConfigService, IConfigService } from './config';

const _redisKey = "crawler.nodes";
const _redisProxyKey = "crawler.proxy";

/**
 * redis的工厂服务
 */
export interface IRedisService {
    setBaseInfo(data: any): void;
}

/**
 * redis相关的服务
 */
@Service()
export class RedisService implements IRedisService {
    private client: redis.Redis;

    /**
     * 构造
     * 初始化redis客户端
     */
    constructor( @Inject(ConfigService) private configFactory: IConfigService) {
        // this.client = new redis.Cluster(configFactory.config.redis.nodes);
        this.client = new redis(configFactory.config.redis.options);
        this.client.on("error", (err: any) => {
            $log.error("Redis Error " + err);
        });

        this.client.hgetall(_redisKey).then((data) => {
            // $log.info(data);
        });

        process.on("exit", () => {
            console.log("exit");
            this.client.hdel(_redisKey, process.pid.toString());
        });
    }
    /**
     * 设置基础信息到redis
     * @param data 基础信息
     */
    setBaseInfo(data: any): void {
        this.client.hset(_redisKey, data.ip.toString(), JSON.stringify(data)).then((data) => {
        }, (err) => {
            $log.error(err);
        });
    }

    setProxyInfo(data: any): void {
        this.client.hset(_redisProxyKey, data.ip.toString(), JSON.stringify(data)).then((data) => {
        }, (err) => {
            $log.error(err);
        });
    }
}

// 注册工厂方法
InjectorService.factory(RedisService, InjectorService.invoke<RedisService>(RedisService));