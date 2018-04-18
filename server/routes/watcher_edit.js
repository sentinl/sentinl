import Joi from 'joi';
import Boom from 'boom';
import {pick} from 'lodash';
import getConfiguration from  '../lib/get_configuration';
import getElasticsearchClient from '../lib/get_elasticsearch_client';
import Log from '../lib/log';
import WatcherChartQueryBuilder from './watcher_edit_lib/watcher_chart_query_builder';

export default function watcherEdit(server) {
  const config = getConfiguration(server);
  const client = getElasticsearchClient(server, config);
  const log = new Log(config.app_name, server, 'routes');

  const chartQuery = new WatcherChartQueryBuilder({
    timeFieldName: config.es.timefield,
    timezoneName: config.es.timezone,
  });

  server.route({
    path: '/api/sentinl/watcher/editor/count/all',
    method: 'POST',
    config: {
      validate: {
        payload: {
          es_params: Joi.object({
            index: Joi.array().items(Joi.string().default('*')).default(),
            number: Joi.number().default(config.es.results),
            allowNoIndices: Joi.boolean().default(config.es.allow_no_indices),
            ignoreUnavailable: Joi.boolean().default(config.es.ignore_unavailable),
          }).default(),
          query_params: Joi.object({
            field: Joi.string(),
            over: Joi.string().default('_all'),
            last: Joi.object({
              n: Joi.number().default(15),
              unit: Joi.string().default('minutes'),
            }).default(),
            interval: Joi.object({
              n: Joi.number().default(1),
              unit: Joi.string().default('minutes'),
            }).default(),
          }).default(),
        },
      },
    },
    handler: async function (req, reply) {
      const esParams = req.payload.es_params;
      const queryParams = req.payload.query_params;

      try {
        const body = chartQuery.count(queryParams);

        const resp = await client.search({
          index: esParams.index,
          ignoreUnavailable: esParams.ignoreUnavailable,
          allowNoIndices: esParams.allowNoIndices,
          body,
        });

        return reply(resp);
      } catch (err) {
        return reply(Boom.serverUnavailable(err));
      }
    }
  });
}
