import {get, pick} from 'lodash';
import handleESError from '../lib/handle_es_error';
import getConfiguration from  '../lib/get_configuration';
import Joi from 'joi';
import getElasticsearchClient from '../lib/get_elasticsearch_client';
import Crypto from '../lib/crypto';
import WatcherHandler from '../lib/watcher_handler';
import CustomWatcherHandler from '../lib/custom_watcher_handler';
import Log from '../lib/log';
import { convert as convertSQLtoDSL } from 'elasql';

const delay = function (ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
};

/* ES Functions */
export default function routes(server) {
  const config = getConfiguration(server);
  const client = getElasticsearchClient({server, config});
  const log = new Log(config.app_name, server, 'routes');

  // Current Time
  server.route({
    path: '/api/sentinl/time',
    method: 'GET',
    handler(req, reply) {
      return reply({ time: new Date().toISOString() });
    }
  });

  // Get/Set Time Interval
  server.route({
    method: 'GET',
    path: '/api/sentinl/set/interval/{timefilter*}',
    handler: function (request, reply) {
      server.sentinlInterval = JSON.parse(request.params.timefilter);
      return reply({ status: '200 OK' });
    }
  });

  server.route({
    method: 'GET',
    path: '/api/sentinl/get/interval',
    handler: function (request, reply) {
      return reply(server.sentinlInterval);
    }
  });

  // Test
  server.route({
    method: 'GET',
    path: '/api/sentinl/test/{id}',
    handler: function (request, reply) {
      log.debug('testing Elasticsearch connection with param: ' + request.params.id);
      client.ping({
        refresh: true,
        timeout: 5000,
        // undocumented params are appended to the query string
        hello: 'elasticsearch'
      }, function (error) {
        if (error) {
          log.error('Elasticsearch connectivity is down! ' + request.params.id);
          return reply({ status: 'DOWN' });
        } else {
          log.debug('Elasticsearch connectivity is up! ' + request.params.id);
          return reply({ status: 'UP' });
        }
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/api/sentinl/es/getmapping',
    config: {
      validate: {
        payload: {
          index: Joi.array().required(),
        },
      },
    },
    handler: async function (request, reply) {
      const {index} = request.payload;
      try {
        const resp = await client.indices.getMapping({index});
        return reply(resp).code(201);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    path: '/api/sentinl/watcher/editor/count',
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
          query: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      const esParams = req.payload.es_params;

      try {
        const body = JSON.parse(req.payload.query);
        log.debug('COUNT QUERY BODY:', JSON.stringify(body, null, 2));
        log.debug('INDEX:', esParams.index);

        const resp = await client.search({
          index: esParams.index,
          ignoreUnavailable: esParams.ignoreUnavailable,
          allowNoIndices: esParams.allowNoIndices,
          body,
        });

        return reply(resp);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    path: '/api/sentinl/watcher/editor/average',
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
          query: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      const esParams = req.payload.es_params;

      try {
        const body = JSON.parse(req.payload.query);
        log.debug('AVERAGE QUERY BODY:', JSON.stringify(body, null, 2));
        log.debug('INDEX:', esParams.index);

        const resp = await client.search({
          index: esParams.index,
          ignoreUnavailable: esParams.ignoreUnavailable,
          allowNoIndices: esParams.allowNoIndices,
          body,
        });

        return reply(resp);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    path: '/api/sentinl/watcher/editor/min',
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
          query: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      const esParams = req.payload.es_params;

      try {
        const body = JSON.parse(req.payload.query);
        log.debug('MIN QUERY BODY:', JSON.stringify(body, null, 2));
        log.debug('INDEX:', esParams.index);

        const resp = await client.search({
          index: esParams.index,
          ignoreUnavailable: esParams.ignoreUnavailable,
          allowNoIndices: esParams.allowNoIndices,
          body,
        });

        return reply(resp);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    path: '/api/sentinl/watcher/editor/max',
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
          query: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      const esParams = req.payload.es_params;

      try {
        const body = JSON.parse(req.payload.query);
        log.debug('MAX QUERY BODY:', JSON.stringify(body, null, 2));
        log.debug('INDEX:', esParams.index);

        const resp = await client.search({
          index: esParams.index,
          ignoreUnavailable: esParams.ignoreUnavailable,
          allowNoIndices: esParams.allowNoIndices,
          body,
        });

        return reply(resp);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    path: '/api/sentinl/watcher/editor/sum',
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
          query: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      const esParams = req.payload.es_params;

      try {
        const body = JSON.parse(req.payload.query);
        log.debug('SUM QUERY BODY:', JSON.stringify(body, null, 2));
        log.debug('INDEX:', esParams.index);

        const resp = await client.search({
          index: esParams.index,
          ignoreUnavailable: esParams.ignoreUnavailable,
          allowNoIndices: esParams.allowNoIndices,
          body,
        });

        return reply(resp);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    path: '/api/sentinl/es/indexes',
    method: 'GET',
    handler: async function (req, reply) {
      try {
        const resp = await client.cat.indices({
          format: 'json',
        });

        return reply(resp);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    path: '/api/sentinl/sql/translate',
    method: 'POST',
    config: {
      validate: {
        payload: {
          sql_query: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        return reply({
          dsl_query: convertSQLtoDSL(req.payload.sql_query), // DSL query
        });
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    path: '/api/sentinl/sql/execute/{index}',
    method: 'POST',
    config: {
      validate: {
        params: {
          index: Joi.string(),
        },
        payload: {
          sql_query: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      const sqlQuery = req.payload.sql_query;
      const index = req.params.index;

      try {
        const apiSqlTranslate = await server.inject({
          method: 'POST',
          url: '/api/sentinl/sql/translate',
          headers: {
            'kbn-xsrf': 'reporting',
          },
          payload: {
            sql_query: sqlQuery,
          },
        });

        const body = apiSqlTranslate.result.dsl_query;
        body.size = config.es.results;

        const resp = await client.search({
          index,
          body,
          type: config.es.default_type,
        });
        return reply(resp);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });
};
