import { Service, InjectorService, Inject } from "ts-express-decorators";
import { IRedisService } from './redis';

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

    public set maxTask(val: number) {
        this._maxTask = val;
    }

    public set currentTask(val: number) {
        this._currentTask = val;
    }

    public getInfo() {
        return {
            pid: process.pid,
            currentTask: this._currentTask,
            maxTask: this._maxTask
        };
    }
}

// 工厂方法注册
InjectorService.factory(BaseInfoFactory, new BaseInfoFactory());