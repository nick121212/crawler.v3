import * as Express from "express";
import { Controller, Get, Inject, UseAfter, Post, BodyParams, InjectorService, All, Request, Response } from "ts-express-decorators";
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { matchPath, RoutingContext, Route, IndexRoute, Router } from 'react-router';

import { IBaseInfoFactory, BaseInfoFactory } from '../../../services/baseinfo';
import { ResultMiddleware } from '../../../middlewares/result';
import { ProxyInfoFactory } from "../../../services/proxyinfo";
import { AgendaService } from '../../../services/agenda';

const routes = (
    <Router history={null}>
        <Route path="/" component={({ children }) => <span>hello world  {children}</span>}>
            <IndexRoute component={() => <span>dfadf</span>} />
        </Route>
    </Router>

);


/**
 * 节点基础信息Controller
 */
@Controller("/test")
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
    // @UseAfter(ResultMiddleware)
    public info(
        @Request() req: Express.Request,
        @Response() res: Express.Response, ): any {

                console.log(req.url);

        matchPath(req.url, (error, redirectLocation, renderProps) => {

            console.log("adfadf",renderProps);

            if (error) {
                res.status(500).send(error.message);
            } else if (redirectLocation) {
                res.redirect(302, redirectLocation.pathname + redirectLocation.search)
            } else if (renderProps) {
                let a = renderToString(<RoutingContext {...renderProps } />);
                console.log(a);
                res.status(200).send(a)
            } else {
                res.status(404).send('Not found')
            }
        })
    }
}