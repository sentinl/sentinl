import _ from 'lodash';
import handleESError from '../lib/handle_es_error';

export default function (server) {

  let call = server.plugins.elasticsearch.callWithRequest;

  // Current Time
  server.route({
    path: '/api/kaae/example',
    method: 'GET',
    handler(req, reply) {
      reply({ time: new Date().toISOString() });
    }
  });

  server.route({
    method: 'GET',
    path: '/api/kaae/config',
    handler: require('./config.js')
  });

  server.route({
    method: 'GET',
    path: '/api/kaae/getitems',
    handler: require('./items.js')
  });


  // Local Alarms (session)
  server.route({
    path: '/api/kaae/alarms',
    method: ['POST','GET'],
    handler(req, reply) {
      reply({ data: server.kaaeStore });
    }
  });

  // ES Alarms
  server.route({
    path: '/api/kaae/list/alarms',
    method: ['POST', 'GET'],
    handler: function (req, reply) {
      var config = require('../../kaae.json');

      // Use selected timefilter when available
      if (server.kaaeInterval) {
	var timeInterval = server.kaaeInterval;
      } else {
	var timeInterval = {from: "now-15m", mode: "quick", to: "now"};
      }
      var qrange = { gte: timeInterval.from, lt: timeInterval.to };

      const boundCallWithRequest = _.partial(server.plugins.elasticsearch.callWithRequest, req);
      boundCallWithRequest('search', {
	index: config.es.alarm_index ? config.es.alarm_index + "*" : "watcher_alarms*",
	sort : "@timestamp : asc", 
        allowNoIndices: false,
	body: {
		"size": config.kaae.results ? config.kaae.results : 50,
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
      .then(
        function (res) {
          reply(res); 
        },
        function (error) {
          reply(handleESError(error));
        }
      );
    }
  });

  // List Watchers
  server.route({
    path: '/api/kaae/list',
    method: ['POST', 'GET'],
    handler: function (req, reply) {
      const boundCallWithRequest = _.partial(server.plugins.elasticsearch.callWithRequest, req);
      boundCallWithRequest('search', {
	index: 'watcher',
        allowNoIndices: false
      })
      .then(
        function (res) {
          reply(res); 
        },
        function (error) {
          reply(handleESError(error));
        }
      );
    }
  });


  server.route({
    method: 'GET',
    path: '/api/kaae/delete/alarm/{index}/{type}/{id}',
    handler: function (req, reply) {
      var config = require('../../kaae.json');
      // Check if alarm index and discard everything else
      if (!req.params.index.substr(0,config.es.alarm_index.length) === config.es.alarm_index) { 
		server.log(['status', 'err', 'KaaE'], 'Forbidden Delete Request! '+req.params);
		return;
      }
      var client = server.plugins.elasticsearch.client;
      var callWithRequest = server.plugins.elasticsearch.callWithRequest;

      var body = {
        index: req.params.index,
        type: req.params.type,
        id: req.params.id
      };

      callWithRequest(req, 'delete', body).then(function (resp) {
        reply({
          ok: true,
	  resp: resp
        });
      }).catch(function (resp) {
        reply({
          ok: false,
          resp: resp
        });
      });

   }
  });


  /* ES Functions */

  // Get/Set Time Interval
  server.route({
    method: 'GET',
    path: '/api/kaae/set/interval/{timefilter}',
    handler: function (request, reply) {
	server.kaaeInterval = JSON.parse(request.params.timefilter);
	// console.log('server timefilter:',server.kaaeInterval);
	reply({ status: "200 OK" });
   }
  });
  server.route({
    method: 'GET',
    path: '/api/kaae/get/interval',
    handler: function (request, reply) {
	reply(server.kaaeInterval);
   }
  });


  // Test
  server.route({
    method: 'GET',
    path: '/api/kaae/test/{id}',
    handler: function (request, reply) {
      var config = require('../../kaae.json');
      var client = server.plugins.elasticsearch.client;

	server.log(['status', 'info', 'KaaE'], 'Testing ES connection with param: '+request.params.id);
	client.ping({
	  requestTimeout: 5000,
	  // undocumented params are appended to the query string
	  hello: "elasticsearch"
	}, function (error) {
	  if (error) {
		server.log(['warning', 'info', 'KaaE'], 'ES Connectivity is down! '+request.params.id);
            reply({ status: "DOWN" });
	  } else {
		server.log(['status', 'info', 'KaaE'], 'ES Connectivity is up! '+request.params.id);
            reply({ status: "UP" });
	  }
	});

   }
  });

  server.route({
    method: 'GET',
    path: '/api/kaae/get/watcher/{id}',
    handler: function (request, reply) {
      var config = require('../../kaae.json');
      var client = server.plugins.elasticsearch.client;

	server.log(['status', 'info', 'KaaE'], 'Get Watcher with ID: '+request.params.id);
	client.search({
	  index: config.es.default_index,
	  type: config.es.type,
	  q: request.params.id
	}).then(function (resp) {
	    var hits = resp.hits.hits;
            reply( resp );
	}, function (err,resp) {
	    console.trace(err.message);
            reply( resp );
	});
   }
  });

  server.route({
    method: 'GET',
    path: '/api/kaae/save/watcher/{watcher}',
    handler: function (request, reply) {
      var config = require('../../kaae.json');
      var client = server.plugins.elasticsearch.client;
      var watcher = JSON.parse(request.params.watcher)

      server.log(['status', 'info', 'KaaE'], 'Saving Watcher with ID: '+watcher._id);

	        var body = {
	        	index: config.es.default_index,
	        	type: config.es.type,
			id: watcher._id,
	        	body: watcher._source
	        };

	        client.index(body).then(function (resp) {
        		reply({ ok: true, resp: resp });
	                   // if (debug) console.log(resp);
	            }, function (err,resp) {
        		reply({ ok: false, resp: resp });
	           	console.trace(err,resp);
		});
   }
  });


  server.route({
    method: 'GET',
    path: '/api/kaae/delete/watcher/{id}',
    handler: function (req, reply) {
      var config = require('../../kaae.json');
      var client = server.plugins.elasticsearch.client;
      var callWithRequest = server.plugins.elasticsearch.callWithRequest;

      var body = {
        index: config.es.default_index,
        type: config.es.type,
        id: req.params.id
      };

      callWithRequest(req, 'delete', body).then(function (resp) {
        reply({
          ok: true,
	  resp: resp
        });
      }).catch(function (resp) {
        reply({
          ok: false,
          resp: resp
        });
      });

   }
  });


  server.route({
    method: 'GET',
    path: '/api/kaae/validate/es',
    handler: function (request, reply) {
      var config = require('../../kaae.json');
      var callWithRequest = server.plugins.elasticsearch.callWithRequest;

      var body = {
        index: config.es.default_index,
      };

      callWithRequest(request, 'fieldStats', body).then(function (resp) {
        reply({
          ok: true,
          field: config.es.timefield,
          min: resp.indices._all.fields[config.es.timefield].min_value,
          max: resp.indices._all.fields[config.es.timefield].max_value
        });
      }).catch(function (resp) {
        reply({
          ok: false,
          resp: resp
        });
      });

    }
  });



};

