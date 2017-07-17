import { Service, InjectorService, Inject, ExpressApplication } from "ts-express-decorators";
import * as ip from 'ip';
import { $log } from 'ts-log-debug';
import { Exception, HTTPException } from 'ts-httpexceptions';
import * as Kue from 'kue';

import { ConfigService } from './config';
import { ProxyService } from "./proxy";
import { KueService } from './kue';

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
     * @param ip ip地址
     */
    createJob(ip: string): Promise<Kue.Job>;
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
    constructor( @Inject(ConfigService) private configFactory: ConfigService, @Inject(KueService) private kueService: KueService) {
        this.initJob();
    }

    /**
     * 新建更换代理的job
     * @param ip ip地址
     */
    public createJob(ip: string): Promise<any> {
        let baseInfo = this.getInfo();
        let job = this.kueService.queue.create(`change proxy with ip ${ip || baseInfo.ip}`, {

        });

        return new Promise((resolve, reject) => {
            job.attempts(3).backoff({ delay: 1000 * 3, type: 'fixed' }).ttl(1000 * 15).removeOnComplete(true).save((err) => {
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
        let baseInfo = this.getInfo();

        // this.kueService.queue.active(() => {
        this.kueService.queue.process(`change proxy with ip ${baseInfo.ip}`, 10, (job: Kue.Job, done: Function) => {
            console.log(job.type);
            InjectorService.invokeMethod(this.initPptpsetupSchedule.bind(this), []).then(done.bind(null, null)).catch(done);
        });
        // });
    }

    /**
     * 更改代理
     * @param proxyService  代理服务
     */
    @Inject()
    private async initPptpsetupSchedule(proxyService: ProxyService): Promise<any> {
        if (this._running) {
            return true;
        }

        if (!this._proxyInfo) {
            throw new HTTPException(410, "没有设置账号等信息！");
        }

        /**
         * 执行更改定时任务
         */
        if (this._proxyInfo.account && this._proxyInfo.password && this._proxyInfo.server) {
            this._running = true;
            let info = await proxyService.execute(this._proxyInfo.account, this._proxyInfo.password, this._proxyInfo.server).catch((e) => {
                this._errorMsg = e.message;
                this._running = false;
                $log.error(e);

                throw new HTTPException(410, e.message);
            });
            this._running = false;
            // trace info数据
            $log.trace(info);
            // 最后更改时间
            this._lastUpdateAt = Date.now();
        } else {
            throw new HTTPException(410, "没有设置账号等信息！");
        }

        return true;
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