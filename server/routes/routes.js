import {get, pick} from 'lodash';
import handleESError from '../lib/handle_es_error';
import getConfiguration from  '../lib/get_configuration';
import Joi from 'joi';
import getElasticsearchClient from '../lib/get_elasticsearch_client';
import Log from '../lib/log';

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
};
