import { $log } from 'ts-log-debug';
import { InjectorService } from 'ts-express-decorators';
import * as _ from 'lodash';


module.exports = function (options: any) {
    const seneca: any = this;

    seneca.add({ role: 'crawler.result.plugin', cmd: 'babytree' }, async ({ config, result, queueItem }, done) => {
        let body: Array<any> = [];

        _.each(result, (res, idx) => {
            if (!idx) {
                body.push({ index: { _index: config.key, _type: res.rule.key, _id: queueItem._id } });
                body.push(res.result);
            } else {
                body.push({ update: { _index: config.key, _type: res.rule.key, _id: queueItem._id } });
                body.push({
                    doc: res.result
                });
            }
        });

        if (!body.length) {
            return done();
        }

        seneca.act({ role: 'seneca.elasticsearch', cmd: 'bulk' }, {
            body,
            options: {
                refresh: true
            }
        }, (err, res) => {
            done(err, res);
        });
    });

    return 'crawler.result.plugin.babytree';
};