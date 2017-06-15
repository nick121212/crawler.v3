import * as Express from "express";
import { Controller, Get, Inject, UseAfter } from "ts-express-decorators";

import { IBaseInfoFactory, BaseInfoFactory } from '../../../services/baseinfo';
import { ResultMiddleware } from '../../../middlewares/result';

/**
 * 节点基础信息
 */
@Controller("/nodes")
export class NodeCtrl {

    /**
     * 构造函数
     * @param baseInfoFactory 基础信息工厂方法
     */
    constructor( @Inject(BaseInfoFactory) private baseInfoFactory: IBaseInfoFactory) {
        
    }

    /**
     * 获取单个节点的详情信息
     *     路由信息为 /
     *     返回数据后使用包装器包装       
     */
    @Get("/")
    @UseAfter(ResultMiddleware)
    public getBaseInfo(): any {
        return this.baseInfoFactory.getInfo();
    }
}