import { Service, Inject } from "ts-express-decorators";
import { Exception } from 'ts-httpexceptions';
import * as redis from 'ioredis';
import { $log } from 'ts-log-debug';
import { ConfigService, IConfigService } from './config';

/**
 * redis的工厂服务
 */
export interface IRedisService {

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
    constructor( @Inject(ConfigService) private configFactory: ConfigService) {
        this.client = new redis(configFactory.config.redis);

        this.client.on("error", (err: any) => {
            $log.error("Redis Error " + err);
        });

        this.client.set('foo', 'bar');
        this.client.get('foo').then((res) => {
            console.log(res);
        });
    }

    setBaseInfo() {

    }
}
