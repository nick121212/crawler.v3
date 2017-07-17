import { NotFound } from "ts-httpexceptions";
import * as Express from "express";
import { Controller, Get, Post, BodyParams, Required, Request, Response, Next, UseAfter } from 'ts-express-decorators';
import * as Passport from 'passport';

import PassportLocalService from '../../../services/passport.local';
import { IUser } from "../../../services/user";
import {ResultMiddleware} from '../../../middlewares/result';

/**
 * 账号controller
 */
@Controller("/passport")
export class PassportCtrl {
    /**
     * 构造
     * @param passportLocalService 本地账号服务
     */
    constructor(
        private passportLocalService: PassportLocalService
    ) {
        passportLocalService.initLocalSignup();
        passportLocalService.initLocalLogin();
    }

    /**
     * 验证用户信息，使用本地数据库
     * @param email
     * @param password
     * @param request
     * @param response
     * @param next
     */
    @Post('/login')
    @UseAfter(ResultMiddleware)
    public login(
        @Required() @BodyParams('email') email: string,
        @Required() @BodyParams('password') password: string,
        @Request() request: Express.Request,
        @Response() response: Express.Response,
        @Next() next: Express.NextFunction
        ) {

        return new Promise<IUser>((resolve, reject) => {
            Passport
                .authenticate('login', (err, user: IUser) => {
                    if (err) {
                        return reject(err);
                    }
                    request.logIn(user, (err) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(user);
                    });

                })(request, response, next);

        }).catch((err) => {
            if (err && err.message === "Failed to serialize user into session") {
                throw new NotFound('user not found');
            }

            return Promise.reject(err);
        });
    }

    /**
     * 注册新账号
     * @param request
     * @param response
     * @param next
     */
    @Post('/signup')
    @UseAfter(ResultMiddleware)
    public signup(
        @Request() request: Express.Request,
        @Response() response: Express.Response,
        @Next() next: Express.NextFunction
        ) {
        return new Promise((resolve, reject) => {
            Passport.authenticate('signup', (err, user: IUser) => {
                if (err) {
                    return reject(err);
                }

                if (!user) {
                    return reject(!!err);
                }

                request.logIn(user, (err) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve(user);
                });
            })(request, response, next);
        });
    }

    /**
     * 登出
     * @param request
     */
    @Get('/logout')
    @UseAfter(ResultMiddleware)
    public logout( @Request() request: Express.Request) {
        request.logout();
    }
}