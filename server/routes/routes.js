import _ from 'lodash';
import handleESError from '../lib/handle_es_error';
import getConfiguration from  '../lib/get_configuration';
import Joi from 'joi';
import dateMath from '@elastic/datemath';
import getElasticsearchClient from '../lib/get_elasticsearch_client';
import es from 'elasticsearch';
import Crypto from '../lib/crypto';
import WatcherHandler from '../lib/watcher_handler';
import Boom from 'boom';
import Log from '../lib/log';

const delay = function (ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
};

/* ES Functions */
var getAlarms = async function (type, server, req, reply) {
  const config = getConfiguration(server);
  const client = getElasticsearchClient(server, config);
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
  const client = getElasticsearchClient(server, config);
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

  /**
  * Route to get some of Sentinl configurations.
  */
  server.route({
    path: '/api/sentinl/config',
    method: ['POST', 'GET'],
    handler: function (req, reply) {
      return reply({
        es: {
          index: config.es.default_index,
          type: config.es.default_type,
          number_of_results: config.es.results
        },
        authentication: {
          impersonate: config.settings.authentication.impersonate,
        }
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/sentinl/alarm/{index}/{type}/{id}',
    handler: async function (req, reply) {
      // Check if alarm index and discard everything else
      if (!req.params.index.substr(0, config.es.alarm_index.length) === config.es.alarm_index) {
        log.error('forbidden delete request! ' + req.params);
        return;
      }

      try {
        const resp = await client.delete({
          refresh: true,
          index: req.params.index,
          type: req.params.type,
          id: req.params.id
        });
        return reply({ok: true, resp});
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
        return reply(Boom.notAcceptable(err.message));
      }
    }
  });
};
