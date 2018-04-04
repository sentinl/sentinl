import Joi from 'joi';
import Boom from 'boom';
import getConfiguration from  '../lib/get_configuration';
import getElasticsearchClient from '../lib/get_elasticsearch_client';
import Log from '../lib/log';


class Query {
  static range(gte = 'now-1m', lt = 'now', timeField = '@timestamp', format = 'strict_date_optional_time||epoch_millis') {
    return {
      query: {
        bool: {
          filter: {
            range: {
              [timeField]: { gte, lt, format }
            }
          }
        }
      }
    };
  }
}

export default function watcherEdit(server) {
  const config = getConfiguration(server);
  const client = getElasticsearchClient(server, config);
  const log = new Log(config.app_name, server, 'routes');

  server.route({
    path: '/api/sentinl/watcher_edit/count/all/last',
    method: 'POST',
    config: {
      validate: {
        payload: {
          index: Joi.array().items(Joi.string().default('mos-*')).default(),
          number: Joi.number().default(60),
          units: Joi.string().default('m'),
          format: Joi.string().default('strict_date_optional_time||epoch_millis'),
          threshold: Joi.object({
            number: Joi.number().default(1),
            direction: Joi.string().default('>'),
          }).default(),
          page: Joi.object({
            from: Joi.number().default(0),
            size: Joi.number().default(config.es.results),
          }).default(),
          sort: Joi.string().default('@timestamp: asc'),
          allowNoIndices: Joi.boolean().default(false),
        },
      },
    },
    handler: async function (req, reply) {
      const {number, units, format, index, threshold, sort, allowNoIndices, page} = req.payload;

      try {
        const gte = 'now-' + number + units;
        const body = Query.range(gte);
        body.from = page.from;
        body.size = page.size;

        const resp = await client.search({ index, sort, body, allow_no_indices: allowNoIndices });
        return reply(resp);
      } catch (err) {
        return reply(Boom.serverUnavailable(err));
      }
    }
  });
}
