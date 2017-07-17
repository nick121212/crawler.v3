import { IMiddleware, Middleware, Request, Response, Endpoint, ResponseData, EndpointInfo, Next } from 'ts-express-decorators';
import { ServerSettingsService } from "ts-express-decorators/lib/services/server-settings";
import * as Express from 'express';

import { ResultService } from '../services/result';

/**
 * 返回的数据包装中间件
 */
@Middleware()
export class ResultMiddleware implements IMiddleware {
    constructor(private serverSettingsService: ServerSettingsService, private resultService: ResultService) {

    }

    use( @ResponseData() data: any,
        @EndpointInfo() endpoint: Endpoint,
        @Response() response: Express.Response,
        @Request() request: Express.Request,
        @Next() next: Express.NextFunction) {
        if (response.headersSent) {
            return next();
        }
        response.status(200).send(this.resultService.getSuccessData(data));
    }
}