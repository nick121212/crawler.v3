import { Service, InjectorService, Inject, ExpressApplication } from "ts-express-decorators";
import * as ip from 'ip';

import { IRedisService } from './redis';
import { ConfigService } from './config';

/**
 * 基础信息的工厂服务
 * 提供爬虫节点的基础信息
 *     pid
 *     currentTask
 *     maxTask
 */
export interface IBaseInfoFactory {
    /**
     * 获取基础节点信息
     */
    getInfo: () => {
        pid: number;
        currentTask: number;
        maxTask: number;
    };
    /**
     * 获取代理节点的基础信息
     */
    getProxyInfo: () => {

    };
    /**
     * 最大的任务数量
     */
    maxTask: number;
    /**
     * 当前的任务数量
     */
    currentTask: number;
}

/**
 * 基础信息服务
 */
@Service()
export class BaseInfoFactory implements IBaseInfoFactory {
    private _maxTask: number = 0;
    private _currentTask: number = 0;

    /**
     * 设置基础信息
     * 读取配置文件中maxTask字段
     */
    constructor( @Inject(ConfigService) private configFactory: ConfigService) {
        if (!configFactory || !configFactory.config) {
            return;
        }

        this.maxTask = configFactory.config.taskInfo.maxTask || 10;
    }

    /**
     * 设置最大任务数
     */
    public set maxTask(val: number) {
        this._maxTask = val;
    }

    /**
     * 设置当前的任务数量
     */
    public set currentTask(val: number) {
        this._currentTask = val;
    }

    /**
     * 获取基础信息
     * pid
     * currentTask
     * maxTask
     */
    public getInfo() {
        let { http = { port: 0 }, ip: callIp } = this.configFactory.config.baseInfo;

        return {
            type: "crawler.node",
            pid: process.pid,
            currentTask: this._currentTask,
            maxTask: this._maxTask,
            leftTask: this._maskTask - this._currentTask,
            callIp: callIp,
            callPort: http.port,
            ip: ip.address(),
            lastUpdateAt: Date.now()
        };
    }
    /**
     * 获取代理节点的基础信息
     */
    public getProxyInfo() {
        return Object.assign({}, this.getInfo(), {
            type: "crawler.proxy"
        });
    }
}

// 工厂方法注册
InjectorService.factory(BaseInfoFactory, InjectorService.invoke<BaseInfoFactory>(BaseInfoFactory));