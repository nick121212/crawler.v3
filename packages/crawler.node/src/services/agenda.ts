import { Service, Inject, InjectorService } from 'ts-express-decorators';
import * as Agenda from 'agenda';
import * as Agendash from 'agendash';
import { $log } from 'ts-log-debug';
import * as bluebird from 'bluebird';

import { ConfigService, IConfigService } from './config';
import { RedisService, IRedisService } from "./redis";
import { BaseInfoFactory } from './baseinfo';
import { ProxyInfoFactory } from './proxyinfo';
import { ProxyService } from './proxy';

/**
 * agenda服务
 */
@Service()
export class AgendaService {
    public agenda: Agenda;

    /**
     * 构造函数
     * @param configFactory 配置文件服务类
     * @param redisService  redis服务
     * @param baseInfoFactory 基础服务
     */
    constructor(
        @Inject(ConfigService) private configFactory: IConfigService,
        @Inject(RedisService) private redisFactory: RedisService,
        @Inject(BaseInfoFactory) private baseInfoFactory: BaseInfoFactory,
        @Inject(ProxyInfoFactory) private proxyInfoFactory: ProxyInfoFactory,
    ) {
        // 实例化定时任务
        this.agenda = new Agenda({
            db: configFactory.config.mongo
        });
        // 启动任务
        this.agenda.on("ready", () => {
            this.agenda.start();
            // 创建定时任务
            this.createJob().then(this.initTask.bind(this));
        });
    }

    private createJob(): Promise<any> {
        let getJobsAsync = bluebird.promisify<any, any>(this.agenda.jobs.bind(this.agenda));

        return new Promise(async (resolve, reject) => {
            let baseInfo = this.baseInfoFactory.getInfo();
            let job = this.agenda.create(`setBaseInfo-${baseInfo.ip}`, {});
            let jobs = await getJobsAsync({ name: job.attrs.name });

            if (jobs.length) {
                return resolve(job.attrs.name);
            }
            job.repeatEvery("1 minutes");
            job.save((err) => {
                if (err) {
                    return reject(new Error('Jobs not created'))
                }
                resolve(job.attrs.name);
            });
        });
    }

    /**
     * 注册任务
     */
    private initTask(jobName: string): void {
        this.agenda.define(jobName, (job: Agenda.Job, done) => {
            this.redisFactory.setBaseInfo(this.baseInfoFactory.getInfo());
            this.redisFactory.setProxyInfo(this.proxyInfoFactory.getInfo());
            done && done();
        });
    }

    /**
     * 初始化定时任务界面
     */
    public initAgendash() {
        return Agendash(this.agenda);
    }

    /**
     * 执行更换代理ip
     * @param proxyService 
     * @param agendaService 
     */
    public executeProxy(ip: string = ""): Promise<any> {

        console.log(ip);

        return new Promise((resolve, reject) => {
            let { ip: localIp } = this.baseInfoFactory.getInfo();
            let job = this.agenda.now(`${ip || localIp}-pptpsetup`, {});

            if (!ip || ip == localIp) {
                this.initRestartProxySchedule();
            }

            return resolve();
        });
    }

    /**
     * 更改代理事件
     */
    private initRestartProxySchedule() {
        let { ip } = this.baseInfoFactory.getInfo();

        this.agenda.define(`${ip}-pptpsetup`, async (job, done) => {
            InjectorService.invokeMethod(this.proxyInfoFactory.initPptpsetupSchedule.bind(this.proxyInfoFactory), []);
            done && done();
        });
    }
}

// 工厂方法注册
InjectorService.factory(AgendaService, InjectorService.invoke<AgendaService>(AgendaService));