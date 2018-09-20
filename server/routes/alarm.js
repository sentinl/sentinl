import Joi from 'joi';
import dateMath from '@elastic/datemath';
import handleESError from '../lib/handle_es_error';
import getConfiguration from  '../lib/get_configuration';
import { flatAttributes } from '../lib/helpers';
import apiClient from '../lib/api_client';

async function getAlarms(isReport, server, req, reply) {
  const config = getConfiguration(server);

  let timeInterval = {
    from: 'now-15m',
    mode: 'quick',
    to: 'now'
  };

  // Use selected timefilter when available
  if (server.sentinlInterval) {
    timeInterval = server.sentinlInterval;
  }

  const qrange = {
    gte: dateMath.parse(timeInterval.from).valueOf(),
    lt: dateMath.parse(timeInterval.to, true).valueOf()
  };

  try {
    // Use Elasticsearch API because Kibana savedObjectsClient
    // can't search in a specific index and doesn't allow custom query body
    const client = apiClient(server, 'elasticsearchAPI');
    const resp = await client.find({
      index: config.es.alarm_index + '*',
      type: config.es.alarm_type,
      perPage: req.params.size,
      sortField: '@timestamp',
      body: {
        query: {
          bool: {
            filter: [
              {
                term: { report: isReport }
              },
              {
                range: { '@timestamp': qrange }
              }
            ]
          }
        }
      }
    });

    resp.saved_objects = resp.saved_objects.map(flatAttributes);

    return reply(resp).code(200);
  } catch (err) {
    return reply(handleESError(err));
  }
};

export default function routes(server) {
  const config = getConfiguration(server);

  function getCurrentAlarmIndex() {
    return config.es.alarm_index + '-' + new Date().toISOString().substr(0, 10).replace(/-/g, '.');
  }

  // Local Alarms (session)
  server.route({
    method: ['POST','GET'],
    path: '/api/sentinl/alarms',
    handler(req, reply) {
      return reply({ data: server.sentinlStore });
    }
  });

  // ES Alarms
  server.route({
    method: ['POST', 'GET'],
    path: '/api/sentinl/list/alarms',
    config: {
      validate: {
        params: {
          size: Joi.number().default(config.es.results),
        },
      },
    },
    handler: function (req, reply) {
      const isReport = false;
      return getAlarms(isReport, server, req, reply);
    }
  });

  server.route({
    method: ['POST', 'GET'],
    path: '/api/sentinl/list/reports',
    config: {
      validate: {
        params: {
          size: Joi.number().default(config.es.results),
        },
      },
    },
    handler:  function (req, reply) {
      const isReport = true;
      return getAlarms(isReport, server, req, reply);
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/sentinl/alarm/{id}/{index}',
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
        // Use Elasticsearch API because Kibana savedObjectsClient
        // can't search in a specific index and doesn't allow custom query body
        const client = apiClient(server, 'elasticsearchAPI');
        const resp = await client.delete(config.es.alarm_type, id, index);

        return reply(resp).code(200);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    method: ['PUT'],
    path: '/api/sentinl/alarm/{index?}',
    config: {
      validate: {
        params: {
          index: Joi.string().default(getCurrentAlarmIndex()),
        },
        payload: {
          attributes: Joi.object().required(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        // Use Elasticsearch API because Kibana savedObjectsClient
        // can't search in a specific index and doesn't allow custom query body
        const client = apiClient(server, 'elasticsearchAPI');
        const resp = await client.create(config.es.alarm_type, req.payload.attributes,
          { overwrite: true }, config.es.alarm_index);

        return reply(resp).code(201);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });
}
