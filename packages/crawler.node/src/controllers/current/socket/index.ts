import * as Express from "express";
import { Controller, Get, Inject, UseAfter, Post, BodyParams, InjectorService, Required } from "ts-express-decorators";

import { IBaseInfoFactory, BaseInfoFactory } from '../../../services/baseinfo';
import { ResultMiddleware } from '../../../middlewares/result';
import { ProxyInfoFactory } from "../../../services/proxyinfo";
import { ProxyService } from "../../../services/proxy";
import { SocketService } from "../../../services/socket";
// import { AgendaService } from '../../../services/agenda';

/**
 * 节点基础信息Controller
 */
@Controller("/socket")
export class NodeCtrl {
    /**
     * 构造函数
     * @param baseInfoFactory 基础信息工厂方法,用来返回节点的基础信息
     */
    constructor(
        private socketService: SocketService
    ) {

    }

    /**
     * 获取一个代理节点的基础信息
     */
    @Get("/")
    @UseAfter(ResultMiddleware)
    public info(): any {
        return this.socketService.socket.id;
    }

    /**
     * 重启一个代理节点
     */
    @Post("/")
    @UseAfter(ResultMiddleware)
    public async execute( @BodyParams('ip') ip: string): Promise<any> {
        // this.socketService.socket.emit("asdfasdf", { data: 123 }, console.log);
        return this.socketService.socket.publish("channel1", { data: 1 }, console.log);
    }
}