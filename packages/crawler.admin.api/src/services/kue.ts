import { Service, Inject, InjectorService } from 'ts-express-decorators';
import * as Kue from 'kue';
import { $log } from 'ts-log-debug';
import * as bluebird from 'bluebird';

import { ConfigService, IConfigService } from './config';

/**
 * agenda服务
 */
@Service()
export class KueService {
    public queue: Kue.Queue;

    /**
     * 构造函数
     * @param configFactory 配置文件服务类
     */
    constructor(
        @Inject(ConfigService) private configFactory: IConfigService
    ) {
        this.queue = Kue.createQueue({
            prefix: 'q',
            jobEvents: true,
            redis: {
                db: 3,
                ...this.configFactory.config.redis.options
            }
        });
    }
}

// 工厂方法注册
InjectorService.factory(KueService, InjectorService.invoke<KueService>(KueService));