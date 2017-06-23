import { Service, InjectorService, Inject, ExpressApplication } from "ts-express-decorators";
import { $log } from 'ts-log-debug';

import { Log } from '../decorations/log.func';

/**
 * 执行插件的服务
 * 根据插件的配置和顺序，依次执行插件
 * 每个插件返回每个插件的数据
 */
@Service()
export class PluginService {
    constructor() {
        
    }
}

// getPath : function(ele){
// if(ele.nodeName == "HTML") return ele.nodeName;
// else return this.getPath(ele.parentNode) + " " + ele.nodeName;
// }