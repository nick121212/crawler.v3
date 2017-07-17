import { Service, Inject } from "ts-express-decorators/lib";
import * as Seneca from 'seneca';
import { ConfigService } from "./config";
import { $log } from 'ts-log-debug';
import * as _ from 'lodash';

import * as elastic from '../seneca/elastic';

@Service()
export class PluginService {
    private seneca: any;

    constructor(
        @Inject(ConfigService) private configFactory: ConfigService,
    ) {
        this.seneca = Seneca({
            strict: {
                add: false
            }
        })
            .use("basic")
            .use("entity")
            .use(elastic);

        this.seneca.ready((err) => {
            if (err) { return $log.error(err); }
            $log.info("Seneca Ready!");
        });
    }

    public resultDone(config: any, queueItem: any, result: any): void {
        _.forEach(config.donePlugins, (pattern: string, key: string) => {
            try {
                // if (!this.seneca.has('../plugins/' + key)) {
                this.seneca.use(__dirname + '/../plugins/' + key);
                // }
                this.seneca.act(pattern, { config, result, queueItem }, console.log);

            } catch (e) {
                console.log("dfadfadsfads:", e);
            }
        });
    }
}