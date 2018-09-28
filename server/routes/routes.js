import {get, pick} from 'lodash';
import handleESError from '../lib/handle_es_error';
import getConfiguration from  '../lib/get_configuration';
import Joi from 'joi';
import dateMath from '@elastic/datemath';
import getElasticsearchClient from '../lib/get_elasticsearch_client';
import Crypto from '../lib/crypto';
import WatcherHandler from '../lib/watcher_handler';
import Log from '../lib/log';
import { convert as convertSQLtoDSL } from 'elasql';

const delay = function (ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
};

/* ES Functions */
var getAlarms = async function (type, server, req, reply) {
  const config = getConfiguration(server);
  const client = getElasticsearchClient({server, config});
  const log = new Log(config.app_name, server, 'routes');

  var timeInterval;
  // Use selected timefilter when available
  if (server.sentinlInterval) {
    timeInterval = server.sentinlInterval;
  } else {
    timeInterval = {
      from: 'now-15m',
      mode: 'quick',
      to: 'now'
    };
  }
  var qrange = {
    gte: dateMath.parse(timeInterval.from).valueOf(),
    lt: dateMath.parse(timeInterval.to, true).valueOf()
  };

  try {
    const resp = await client.search({
      index: config.es.alarm_index + '*',
      sort: '@timestamp : asc',
      allowNoIndices: config.es.allow_no_indices,
      ignoreUnavailable: config.es.ignore_unavailable,
      body: {
        size: config.es.results,
        query: {
          bool: {
            filter: [
              {
                term: { report: type === 'report' }
              },
              {
                range: { '@timestamp': qrange }
              }
            ]
          }
        }
      }
    });

    return reply(resp);
  } catch (err) {
    return reply(handleESError(err));
  }
};

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

  // Local Alarms (session)
  server.route({
    path: '/api/sentinl/alarms',
    method: ['POST','GET'],
    handler(req, reply) {
      return reply({ data: server.sentinlStore });
    }
  });

  // ES Alarms
  server.route({
    path: '/api/sentinl/list/alarms',
    method: ['POST', 'GET'],
    handler: function (req, reply) {
      return getAlarms('alarms', server, req, reply);
    }
  });

  server.route({
    path: '/api/sentinl/list/reports',
    method: ['POST', 'GET'],
    handler:  function (req, reply) {
      return getAlarms('report', server, req, reply);
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/sentinl/alarm/{id}/{index?}',
    config: {
      validate: {
        params: {
          id: Joi.string().required(),
          index: Joi.string().required(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const { id, index } = req.params;

        const resp = await client.delete({
          id,
          index,
          refresh: true,
          type: config.es.alarm_type,
        });

        return reply(resp).code(201);
      } catch (err) {
        return reply(handleESError(err));
      }
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

  /**
  * Execute watcher
  *
  * @param {object} request.payload - watcher object
  */
  server.route({
    method: 'POST',
    path: '/api/sentinl/watcher/_execute',
    handler: async function (request, reply) {
      const watcherHandler = new WatcherHandler(server);

      try {
        const resp = await watcherHandler.execute(request.payload);
        return reply(resp);
      } catch (err) {
        return reply(handleESError(err));
      }
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

  /**
  * Hash clear text
  *
  * @param {object} SHA hash
  */
  server.route({
    method: 'POST',
    path: '/api/sentinl/hash',
    config: {
      validate: {
        payload: {
          text: Joi.string().required(),
        },
      },
    },
    handler: async function (request, reply) {
      const text = request.payload.text;
      const crypto = new Crypto(config.settings.authentication.encryption);

      try {
        return reply({
          sha: crypto.encrypt(text),
        });
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
