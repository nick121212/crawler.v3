import { ServerLoader, ServerSettings, InjectorService, IServerLifecycle, GlobalAcceptMimesMiddleware, Inject } from 'ts-express-decorators';
import { $log } from 'ts-log-debug';
import * as Express from 'express';
import * as Path from "path";

import { GlobalErrorHandlerMiddleware } from "./middlewares/_error";
import { AgendaService } from './services/agenda';
import { BaseInfoFactory, IBaseInfoFactory } from './services/baseinfo';
import { ConfigService } from "./services/config";

const rootDir = Path.resolve(__dirname);
/**
 * 服务的启动文件
 */
@ServerSettings({
    rootDir: rootDir,
    mount: {
        // '/api': `${rootDir}/controllers/current/**/*.js`
    },
    httpsPort: undefined,
    componentsScan: [
        `${rootDir}/middlewares/**/**.js`
    ],
    acceptMimes: ["application/json"]
})
export class Server extends ServerLoader implements IServerLifecycle {

    /**
     * 构造
     * 覆盖基类的信息
     * 挂载controller
     */
    constructor() {
        super();

        // this.scan(`${rootDir}/services/**/**.js`);
        // this.scan(`${rootDir}/constrollers/**/**.js`);
        // this.scan(`${rootDir}/middlewares/**/**.js`);
        this.mount('/api', `${rootDir}/controllers/**/**.js`);
    }

    /**
     * 设置自定义中间件
     * @returns {void | Promise<any>}
     */
    public $onMountingMiddlewares(): void | Promise<any> {
        const morgan = require('morgan'),
            cookieParser = require('cookie-parser'),
            bodyParser = require('body-parser'),
            compress = require('compression'),
            methodOverride = require('method-override'),
            multer = require('multer');

        this
            .use(morgan('dev'))
            .use(GlobalAcceptMimesMiddleware)
            .use(cookieParser())
            .use(compress({}))
            .use(methodOverride())
            .use(bodyParser.json())
            .use(bodyParser.urlencoded({
                extended: true
            }))
            .use(multer().single());
        // return this;
    }
    /**
     * lifecircle onReady
     */
    public $onReady() {
        $log.info('Server started...');
    }

    /**
     * lifecircle onServerInitError
     * @param err 错误信息
     */
    public $onServerInitError(err: Error) {
        $log.trace(err);
    }

    /**
     * lifecircle 路由加载完后hook的方法
     * 加载定时任务服务中间件
     * 加载全局错误中间件
     * 手动启动http服务
     */
    @Inject()
    $afterRoutesInit( @Inject(AgendaService) agendaFactory: AgendaService, @Inject(ConfigService) config: ConfigService) {
        let { http = { port: 0 } } = config.config.baseInfo;

        // 添加定时任务中间件
        this.use("/agendash", agendaFactory.initAgendash());
        // 启用全局错误中间件
        this.use(GlobalErrorHandlerMiddleware);
        // 手动启动httpserver
        if (http.port) {
            this.createHttpServer(http.port);
        }
    }

    /**
     * 初始化的lifecircle
     */
    public $onInit() {
        $log.info("oninit");
    }

    /**
     * 初始化服务
     * 打开log的时间
     */
    static Initialize(): Promise<any> {
        let rtn = new Server();

        $log.setPrintDate(true);
        $log.setRepporting({
            info: true,
            debug: true,
            trace: true,
            error: true,
            warn: true
        });

        return rtn.start();
    }
}

Server.Initialize();