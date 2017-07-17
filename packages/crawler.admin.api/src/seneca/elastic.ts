import { $log } from 'ts-log-debug';
import { InjectorService } from 'ts-express-decorators';

import { ElasticService } from "../services/elastic";


module.exports = function (options: any) {
    const seneca: any = this;
    const elasticService: ElasticService = InjectorService.get(ElasticService);

    seneca.add({ role: 'seneca.elasticsearch', cmd: 'save' }, async ({ index, type, id, data }, done) => {
        $log.info("babytree.result.plugin");

        try {
            let res = await elasticService.client.index({
                id: id,
                index: index,
                type: type,
                body: data
            });
            done(null, res);
        } catch (e) {
            done(e);
        }
    });

    seneca.add({ role: 'seneca.elasticsearch', cmd: 'bulk' }, async ({ body, options = {} }, done) => {
        $log.info("babytree.result.plugin");

        try {
            let res = await elasticService.client.bulk({
                body: body,
                ...options
            });
            done(null, res);
        } catch (e) {
            done(e);
        }
    });

    return 'seneca.elasticsearch';
};