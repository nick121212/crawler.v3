import { ServerLoader, ServerSettings, InjectorService } from 'ts-express-decorators';
import { $log } from 'ts-log-debug';
import * as Express from 'express';
import * as Path from "path";

import { IBaseInfoFactory, BaseInfoFactory } from './services/baseinfo';
import GlobalErrorHandlerMiddleware from "./middlewares/_error";
import { ConfigService } from './services/config';

const rootDir = Path.resolve(__dirname);
/**
 * 服务的启动文件
 */
@ServerSettings({
    rootDir: rootDir,
    mount: {
        '/api': `${rootDir}/controllers/current/**/*.js`
    },
    componentsScan: [
        `${rootDir}/middlewares/**/**.js`
    ]
})
export class Server extends ServerLoader {
    /**
     * 设置自定义中间件
     * @returns {void | Promise<any>}
     */
    public $onMountingMiddlewares(): void | Promise<any> {
        const morgan = require('morgan'),
            cookieParser = require('cookie-parser'),
            bodyParser = require('body-parser'),
            compress = require('compression'),
            methodOverride = require('method-override');

        this
            .use(morgan('dev'))
            // .use(ServerLoader.AcceptMime("application/json"))
            .use(cookieParser())
            .use(compress({}))
            .use(methodOverride())
            .use(bodyParser.json())
            .use(bodyParser.urlencoded({
                extended: true
            }));

        // return this;
    }

    /**
     * lifecircle onReady
     */
    public $onReady() {
        console.log('Server started...');
    }
    /**
     * lifecircle onServerInitError
     * @param err 错误信息
     */
    public $onServerInitError(err: Error) {
        console.error(err);
    }
    /**
     * 路由加载完后hook的方法
     */
    $afterRoutesInit() {
        this.use(GlobalErrorHandlerMiddleware);
    }
    /**
     * 初始化服务
     */
    static Initialize(): Promise<any> {
        let rtn = new Server().start();
        let baseInfoFactory = InjectorService.get<BaseInfoFactory>(BaseInfoFactory);
        let configFactory = InjectorService.get<ConfigService>(ConfigService);

        // 设置基础信息数据
        baseInfoFactory.currentTask = 0;
        baseInfoFactory.maxTask = 10;

        // 读取配置文件
        if (process.argv.length < 2 && !process.argv[2]) {
            $log.error("没有定义config文件!");
            process.exit(1);
        } else {
            // 配置文件载入
            configFactory.initConfig(process.argv[2]);
        }

        return rtn;
    }
}

Server.Initialize();