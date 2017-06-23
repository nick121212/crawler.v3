import * as Express from 'express';
import { IMiddleware, MiddlewareError, Request, Response, Next, Err, IMiddlewareError } from "ts-express-decorators";
import { Exception } from "ts-httpexceptions";
import { $log } from "ts-log-debug";

import { ResultService } from '../services/result';

/**
 * 全局错误中间件
 */
@MiddlewareError()
export class GlobalErrorHandlerMiddleware implements IMiddlewareError {
    constructor(private resultService: ResultService) {

    }

    use(
        @Err() error: any,
        @Request() request: Express.Request,
        @Response() response: Express.Response,
        @Next() next: Express.NextFunction
    ): any {

        if (response.headersSent) {
            return next(error);
        }

        const toHTML = (message = "") => message.replace(/\n/gi, "<br />");

        if (error instanceof Exception) {
            $log.error(error);
            response.status(error.status).send(this.resultService.getErrorData(error));
            return next();
        }

        if (typeof error === "string") {
            response.status(404).send(toHTML(error));
            return next();
        }

        $log.error(error);
        response.status(error.status || 500).send("Internal Error");

        return next();
    }
}