import _ from 'lodash';
import handleESError from '../lib/handle_es_error';
const config = require('../lib/config');

export default function (server) {

  // Current Time
  server.route({
    path: '/api/sentinl/example',
    method: 'GET',
    handler(req, reply) {
      reply({ time: new Date().toISOString() });
    }
  });

  server.route({
    method: 'GET',
    path: '/api/sentinl/config',
    handler: require('./config.js')
  });

  server.route({
    method: 'GET',
    path: '/api/sentinl/getitems',
    handler: require('./items.js')
  });


  // Local Alarms (session)
  server.route({
    path: '/api/sentinl/alarms',
    method: ['POST','GET'],
    handler(req, reply) {
      reply({ data: server.sentinlStore });
    }
  });

  // ES Alarms
  server.route({
    path: '/api/sentinl/list/alarms',
    method: ['POST', 'GET'],
    handler: function (req, reply) {
      // Use selected timefilter when available
      if (server.sentinlInterval) {
        var timeInterval = server.sentinlInterval;
      } else {
        var timeInterval = {from: "now-15m", mode: "quick", to: "now"};
      }
      var qrange = {gte: timeInterval.from, lt: timeInterval.to};

      const boundCallWithRequest = _.partial(server.plugins.elasticsearch.callWithRequest, req);
      boundCallWithRequest('search', {
        index: config.es.alarm_index ? config.es.alarm_index + "*" : "watcher_alarms*",
        sort: "@timestamp : asc",
        allowNoIndices: false,
        body: {
          "size": config.sentinl.results ? config.sentinl.results : 50,
          "query": {
            "filtered": {
              "query": {
                "match_all": {}
              },
              "filter": {
                "range": {
                  "@timestamp": qrange
                }
              }
            }
          }
        }
      })
      .then((res) => reply(res))
      .catch((err) => reply(handleESError(err)));
    }
  });

  // List Watchers
  server.route({
    path: '/api/sentinl/list',
    method: ['POST', 'GET'],
    handler: function (req, reply) {
      const boundCallWithRequest = _.partial(server.plugins.elasticsearch.callWithRequest, req);
      boundCallWithRequest('search', {
        index: 'watcher',
        size: config.sentinl.results ? config.sentinl.results : 50,
        allowNoIndices: false
      })
      .then((res) => reply(res))
      .catch((err) => reply(handleESError(err)));
    }
  });

  server.route({
    method: 'GET',
    path: '/api/sentinl/delete/alarm/{index}/{type}/{id}',
    handler: function (req, reply) {
      // Check if alarm index and discard everything else
      if (!req.params.index.substr(0, config.es.alarm_index.length) === config.es.alarm_index) {
        server.log(['status', 'err', 'Sentinl'], 'Forbidden Delete Request! ' + req.params);
        return;
      }
      var callWithRequest = server.plugins.elasticsearch.callWithRequest;

      var body = {
        index: req.params.index,
        type: req.params.type,
        id: req.params.id
      };

      callWithRequest(req, 'delete', body)
      .then((resp) => reply({ok: true, resp: resp}))
      .catch((err) => reply(handleESError(err)));
    }
  });

  /* ES Functions */

  // Get/Set Time Interval
  server.route({
    method: 'GET',
    path: '/api/sentinl/set/interval/{timefilter}',
    handler: function (request, reply) {
	server.sentinlInterval = JSON.parse(request.params.timefilter);
	// console.log('server timefilter:',server.sentinlInterval);
	reply({ status: "200 OK" });
   }
  });
  server.route({
    method: 'GET',
    path: '/api/sentinl/get/interval',
    handler: function (request, reply) {
	reply(server.sentinlInterval);
   }
  });


  // Test
  server.route({
    method: 'GET',
    path: '/api/sentinl/test/{id}',
    handler: function (request, reply) {
      var client = server.plugins.elasticsearch.client;

	server.log(['status', 'info', 'Sentinl'], 'Testing ES connection with param: '+request.params.id);
	client.ping({
	  requestTimeout: 5000,
	  // undocumented params are appended to the query string
	  hello: "elasticsearch"
	}, function (error) {
	  if (error) {
		server.log(['warning', 'info', 'Sentinl'], 'ES Connectivity is down! '+request.params.id);
            reply({ status: "DOWN" });
	  } else {
		server.log(['status', 'info', 'Sentinl'], 'ES Connectivity is up! '+request.params.id);
            reply({ status: "UP" });
	  }
	});

   }
  });

  server.route({
    method: 'GET',
    path: '/api/sentinl/get/watcher/{id}',
    handler: function (request, reply) {
      const callWithRequest = server.plugins.elasticsearch.callWithRequest;
      server.log(['status', 'info', 'Sentinl'], 'Get Watcher with ID: ' + request.params.id);
      callWithRequest(request, 'search', {
        index: config.es.default_index,
        type: config.es.type,
        q: request.params.id
      })
      .then((resp) => reply(resp))
      .catch((err) => {
        server.log(['debug', 'Sentinl'], err);
        reply(err);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/api/sentinl/save/watcher/{watcher}',
    handler: function (request, reply) {
      const callWithRequest = server.plugins.elasticsearch.callWithRequest;
      var watcher = JSON.parse(request.params.watcher);

      server.log(['status', 'info', 'Sentinl'], 'Saving Watcher with ID: '+watcher._id);

      var body = {
        index: config.es.default_index,
        type: config.es.type,
        id: watcher._id,
        body: watcher._source
      };

      callWithRequest(request, 'index', body)
      .then((resp) => reply({ok: true, resp: resp}))
      .catch((err) => reply(handleESError(err)));
    }
  });

  server.route({
    method: 'GET',
    path: '/api/sentinl/delete/watcher/{id}',
    handler: function (req, reply) {
      var callWithRequest = server.plugins.elasticsearch.callWithRequest;

      var body = {
        index: config.es.default_index,
        type: config.es.type,
        id: req.params.id
      };

      callWithRequest(req, 'delete', body)
      .then((resp) => reply({ok: true, resp: resp}))
      .catch((err) => reply(handleESError(err)));
   }
  });

  server.route({
    method: 'GET',
    path: '/api/sentinl/validate/es',
    handler: function (request, reply) {
      var callWithRequest = server.plugins.elasticsearch.callWithRequest;

      var body = {
        index: config.es.default_index,
      };

      callWithRequest(request, 'fieldStats', body).then(function (resp) {
        reply({
          ok: true,
          field: config.es.timefield,
          min: resp.index._all.fields[config.es.timefield].min_value,
          max: resp.index._all.fields[config.es.timefield].max_value
        });
      })
      .catch((err) => reply(handleESError(err)));
    }
  });

};
