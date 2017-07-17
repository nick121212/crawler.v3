import * as SocketIO from "socket.io";
import * as Http from "http";
import { Service, Inject, InjectorService } from "ts-express-decorators";
import * as SocketCluster from 'socketcluster-client';
import * as _ from 'lodash';
import { $log } from "ts-log-debug";
import * as client from 'socket.io-client';

import { BaseInfoFactory } from "./baseinfo";
import { ConfigService } from "./config";

@Service()
export class SocketService {
    public socket: SocketIOClient.Socket;

    constructor(
        @Inject(ConfigService) private configFactory: ConfigService,
        @Inject(BaseInfoFactory) private baseinfoFactory: BaseInfoFactory
    ) {
        this.socket = client(configFactory.config.baseInfo.socket.url, configFactory.config.baseInfo.socket.options);
        this.socket.on('connect', () => {
            this.socket.on('disconnect', () => {
                console.log(this.socket.connected);
            }).on("message", (data) => {
                $log.info(data);
            });
            $log.info("socket connected!");
            setInterval(() => {
                this.socket.connected && this.socket.send(baseinfoFactory.getInfo(), console.log);
            }, 1000);
        });
    }

    sendPluginResult(result) {
        // this.socket.state === "open" && this.socket.send("cralwer.node.plugin.result", result);
    }
}

InjectorService.factory(SocketService, InjectorService.invoke<SocketService>(SocketService));