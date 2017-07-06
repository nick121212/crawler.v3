import { Service, InjectorService, Inject, ExpressApplication } from "ts-express-decorators";
import { $log } from 'ts-log-debug';
import * as shell from 'shelljs';
import * as child from 'child_process';
import * as bluebird from 'bluebird';

import { Log } from '../decorations/log.func';

const commands = {
    poff: (pptpChannel: string) => {
        return `pptpsetup --delete ${pptpChannel}`;
    },
    pptpsetup: (pptpChannel: string, account: string, password: string, server: string) => {
        return `pptpsetup --create ${pptpChannel} --server ${server} --username ${account} --password ${password} --start`
    },
    routeAdd: "route add default gw ",
    nginxRestart: "service nginx restart",
    nginxStop: "service nginx stop",
    nginxStart: "service nginx start",
    route: "route",
    routeDelete: "route delete default gw all"
};

/**
 * 更换代理服务
 * 第一步：关闭nginx
 * 第二步：关闭pptp通道
 * 第三步：创建通道
 * 第四步：添加默认网关并且验证通道创建的地址是否在网关里面
 * 第五步：延时3s，重启nginx
 */
@Service()
export class ProxyService {
    private _pptpChannel: string = "crawler.pptp";

    /**
     * 关闭nginx
     */
    private closeNginx(): Promise<any> {
        return new Promise((resolve, reject) => {
            let rtn = shell.exec(commands.nginxStop, { silent: false }) as shell.ExecOutputReturnValue;

            if (rtn.code !== 0) {
                return reject(new Error(rtn.stderr));
            }

            resolve();
        });
    }
    /**
     * 开启nginx
     */
    private openNginx(): Promise<any> {
        return new Promise((resolve, reject) => {
            let rtn = shell.exec(commands.nginxStart, { silent: false }) as shell.ExecOutputReturnValue;

            if (rtn.code !== 0) {
                return reject(new Error(rtn.stderr));
            }
            resolve();
        });
    }
    /**
     * 创建pptp通道
     * @param account
     * @param password
     * @param server
     */
    private pptpsetup(account: string, password: string, server: string): Promise<string> {
        let datas: Array<string> = [], isSuccess = false, localhostIp;

        return new Promise((resolve, reject) => {
            let pptpsetup: child.ChildProcess = shell.exec(commands.pptpsetup(this._pptpChannel, account, password, server), { silent: true, async: true }) as child.ChildProcess;

            pptpsetup.stdout.on("data", (data: string) => {
                datas.push(data);

                if (/remote/i.test(datas.join(""))) {
                    isSuccess = /succeeded/i.test(datas.join(""));
                    isSuccess && (localhostIp = datas.join("").match(/\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3}/ig));

                    if (isSuccess && localhostIp.length > 1) {
                        resolve(localhostIp[0]);
                    }
                }
            });

            pptpsetup.stderr.on("error", (err: Error) => {
                reject(err);
            });
        });
    }

    /**
     * 设置路由表
     * @param lastIp ip地址
     */
    private setRoute(lastIp: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let rtn = shell.exec(commands.routeAdd + lastIp, { silent: false }) as shell.ExecOutputReturnValue;
            let route: string = shell.exec(commands.route, { silent: false }).stdout as string;

            $log.trace("success----------", lastIp, route);

            if (route.indexOf(lastIp) > 0) {
                return resolve();
            }

            return reject();
        });
    }

    /**
     * 重启nginx
     */
    private restartNginx(): Promise<any> {
        return new Promise((resolve, reject) => {
            let rtn = shell.exec(commands.nginxStop, { silent: false }) as shell.ExecOutputReturnValue;
            let rtn1 = shell.exec(commands.nginxStart, { silent: false }) as shell.ExecOutputReturnValue;

            if (rtn.code != 0) {
                return reject(new Error(rtn.stderr));
            }
            if (rtn1.code != 0) {
                return reject(new Error(rtn1.stderr));
            }

            resolve();
        });
    }

    /**
     * 关闭之前创建的通道
     */
    private poff(): Promise<any> {
        return new Promise((resolve, reject) => {
            shell.exec(commands.poff(this._pptpChannel), { silent: false });
        });
    }

    /**
     * 执行更换代理操作
     * 此处nginx作为正向代理服务器来使用
     * 因为通过了vpn拨号，因此当前机器的出口ip地址已被更换成vpn的ip
     * 从而绕过网站的反扒策略
     * 
     * 第一步：关闭nginx
     * 第二步：关闭pptp通道
     * 第三步：创建通道
     * 第四步：添加默认网关并且验证通道创建的地址是否在网关里面
     * 第五步：延时3s，重启nginx
     * @param account  代理账户
     * @param password 代理密码
     * @param server   代理服务器
     */
    @Log()
    public async execute(account: string, password: string, server: string): Promise<any> {
        await this.closeNginx();
        await this.poff();
        let lastIp: string = await this.pptpsetup(account, password, server);
        await this.setRoute(lastIp);
        await bluebird.delay(3000);
        await this.restartNginx();

        return lastIp;
    }
}