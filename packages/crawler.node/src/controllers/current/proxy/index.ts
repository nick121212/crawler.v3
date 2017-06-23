import * as Express from "express";
import { Controller, Get, Inject, UseAfter, Post, BodyParams, InjectorService } from "ts-express-decorators";

import { IBaseInfoFactory, BaseInfoFactory } from '../../../services/baseinfo';
import { ResultMiddleware } from '../../../middlewares/result';
import { ProxyInfoFactory } from "../../../services/proxyinfo";
import { AgendaService } from '../../../services/agenda';

/**
 * 节点基础信息Controller
 */
@Controller("/proxy")
export class NodeCtrl {
    /**
     * 构造函数
     * @param baseInfoFactory 基础信息工厂方法,用来返回节点的基础信息
     */
    constructor(
        @Inject(ProxyInfoFactory) private baseInfoFactory: ProxyInfoFactory,
        @Inject(AgendaService) private agendaService: AgendaService
    ) {

    }

    /**
     * 获取一个代理节点的基础信息
     */
    @Get("/")
    @UseAfter(ResultMiddleware)
    public info(): any {
        return this.baseInfoFactory.getInfo();
    }

    /**
     * 重启一个代理节点
     */
    @Post("/restart")
    @UseAfter(ResultMiddleware)
    public async execute( @BodyParams('ip') ip: string): Promise<any> {
        return await this.agendaService.executeProxy(ip);
    }

    /**
     * 设置代理服务器的账号信息
     * @param account 
     * @param password 
     * @param server 
     */
    @Post("/setProxyInfo")
    @UseAfter(ResultMiddleware)
    public async setProxyInfo(
        @BodyParams('account') account: string,
        @BodyParams('password') password: string,
        @BodyParams('server') server: string
        ): Promise<any> {

        this.baseInfoFactory.proxyInfo = {
            account,
            password,
            server
        };

        return await this.agendaService.executeProxy();
    }
}