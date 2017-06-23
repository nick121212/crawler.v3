import * as Express from "express";
import { Controller, Get, Inject, UseAfter, Post, BodyParams } from "ts-express-decorators";

import { IBaseInfoFactory, BaseInfoFactory } from '../../../services/baseinfo';
import { ResultMiddleware } from '../../../middlewares/result';

/**
 * 节点基础信息Controller
 */
@Controller("/node")
export class NodeCtrl {
    /**
     * 构造函数
     * @param baseInfoFactory 基础信息工厂方法,用来返回节点的基础信息
     */
    constructor( @Inject(BaseInfoFactory) private baseInfoFactory: IBaseInfoFactory) {

    }
    /**
     * 获取单个节点的详情信息74
     *     路由信息为 /
     *     返回数据后使用包装器包装       
     */
    @Get("/")
    @UseAfter(ResultMiddleware)
    public getBaseInfo(): any {
        return this.baseInfoFactory.getInfo();
    }

    /**
     * 设置当前节点的最大任务数量
     * @param maxTask 最大任务数量
     */
    @Post("/setMaxTask")
    @UseAfter(ResultMiddleware)
    public setMaxTask( @BodyParams('maxTask') maxTask: number): any {
        this.baseInfoFactory.maxTask = maxTask;
    }
    
    /**
     * 执行一次爬取操作
     */
    @Post("/execute")
    @UseAfter(ResultMiddleware)
    public execute() {
        this.baseInfoFactory.currentTask += 1;

        return {};
    }
}