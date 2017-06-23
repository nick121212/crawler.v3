import { Service, InjectorService, Inject, ExpressApplication } from "ts-express-decorators";
import * as ip from 'ip';

import { IRedisService } from './redis';
import { ConfigService } from './config';
import { ProxyService } from "./proxy";
import { AgendaService } from './agenda';
import { BaseInfoFactory } from "./baseinfo";
import { $log } from 'ts-log-debug';
import { Exception } from 'ts-httpexceptions';
import { Log } from '../decorations/log.func';

export interface IProxyInfo {
    account: string;
    server: string;
    password: string;
}

/**
 * 基础信息的工厂服务
 * 提供爬虫节点的基础信息
 */
export interface IProxyInfoFactory {
    /**
     * 获取基础节点信息
     */
    getInfo: () => any;

    /**
     * 代理信息
     * account:账号
     * server:服务器
     * password:密码
     */
    proxyInfo: IProxyInfo;

    /**
     * 执行更换代理服务
     * @param proxyService  代理服务
     * @param agendaService 定时任务服务
     */
    initPptpsetupSchedule(proxyService: ProxyService): Promise<any>;
}

/**
 * 基础信息服务
 */
// @Service()
export class ProxyInfoFactory implements IProxyInfoFactory {
    private _proxyInfo: IProxyInfo;
    private _running: boolean;
    private _errorMsg: string;
    private _lastUpdateAt: number = Date.now();

    /**
     * 设置代理信息
     */
    public set proxyInfo(val: IProxyInfo) {
        this._proxyInfo = val;
    }

    /**
     * 设置代理信息
     */
    public get proxyInfo() {
        return this._proxyInfo;
    }

    /**
     * 设置基础信息
     * 读取配置文件中maxTask字段
     */
    constructor( @Inject(ConfigService) private configFactory: ConfigService, @Inject(BaseInfoFactory) private baseInfoFactory: BaseInfoFactory) {

    }

    /**
     * 更改代理事件
     * @param proxyService  代理服务
     * @param agendaService 定时任务服务
     */
    @Inject()
    public async initPptpsetupSchedule(proxyService: ProxyService) {
        if (this._running) {
            return;
        }

        if (!this._proxyInfo) {
            throw new Error("没有设置账号等信息！");
        }

        /**
         * 执行更改定时任务
         */
        if (this._proxyInfo.account && this._proxyInfo.password && this._proxyInfo.server) {
            this._running = true;
            try {
                let info = await proxyService.execute(this._proxyInfo.account, this._proxyInfo.password, this._proxyInfo.server);
                // trace info数据
                $log.trace(info);
                // 最后更改时间
                this._lastUpdateAt = Date.now();
            }
            catch (e) {
                this._errorMsg = e.message;
                $log.error(e);
            }
            this._running = false;
        }
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
            type: "crawler.proxy",
            pid: process.pid,
            callIp: callIp,
            callPort: http.port,
            ip: ip.address(),
            running: this._running,
            errMsg: this._errorMsg,
            proxyInfo: this._proxyInfo,
            lastUpdateAt: this._lastUpdateAt
        };
    }
}

// 工厂方法注册
InjectorService.factory(ProxyInfoFactory, InjectorService.invoke<ProxyInfoFactory>(ProxyInfoFactory));