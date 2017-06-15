import { InjectorService } from 'ts-express-decorators';
import { $log, Logger } from 'ts-log-debug';
import { Service } from 'ts-express-decorators';
import * as fs from "fs";
import * as util from "util";
import { EventEmitter } from "events";
import { NotAcceptable, NotFound } from 'ts-httpexceptions';
import * as redis from 'ioredis';

/**
 * 获取配置文件的信息
 */
export class Configurator extends EventEmitter {
    public config: any;
    public oldConfig: any;

    /**
     * 构造
     * @param automaticConfigReload 是否自动获取配置文件的更改
     */
    constructor(private automaticConfigReload: boolean = false) {
        super();
    }

    /**
     * 更新配置文件信息
     * @param file 文件的路径
     */
    updateConfig(file: string) {
        let config = JSON.parse(fs.readFileSync(file, "utf8"));

        fs.watch(file, (event, filename) => {
            if (event == 'change' && this.automaticConfigReload) {
                this.updateConfig(filename);
                this.emit("cofigFileChange");
            }
        });

        this.oldConfig = this.config;
        this.config = config;
    }
}

/**
 * 读取配置文件服务
 *     redis
 *     mq          
 */
@Service()
export class ConfigService implements IConfigService {
    private configurator: Configurator;

    constructor() { }

    /**
     * 初始化配置文件
     * @param filePath 配置文件路径
     * @param automaticConfigReload 
     */
    public initConfig(filePath: string, automaticConfigReload: boolean = false): void | any {
        if (!fs.existsSync(filePath)) {
            return $log.error(new NotFound(`${filePath}不存在！`));
        }
        this.configurator = new Configurator(automaticConfigReload);
        this.configurator.updateConfig(filePath);
    }

    public get config() {
        return this.configurator.config;
    }
}

export interface IConfigService {
    initConfig: (filePath: string, automaticConfigReload: boolean) => void | any;
    config: {
        redis: redis.RedisOptions
    };
}

// 工厂方法注册
InjectorService.factory(ConfigService, new ConfigService());