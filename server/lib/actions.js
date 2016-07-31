/* KAAE ACTIONS (c) 2016 QXIP BV */

import _ from 'lodash';
import mustache from 'mustache';
import config from './config';

var debug = true;

var hlimit = config.kaae.history ? config.kaae.history : 10;

export default function (server,actions,payload) {

	/* Internal Support Functions */

	var makeHistory = function(type,message) {
		// Keep history stack of latest alarms (temp)
		server.kaaeStore.push({id:new Date(), action: type, message: message});
		// Rotate local stack
		if (server.kaaeStore.length > hlimit) { server.kaaeStore.shift(); } 
	}

	var esHistory = function(type,message) {

		var client = server.plugins.elasticsearch.client;
	        console.log('Storing Alarm to ES with type:'+type);
		var index_name = config.es.alarm_index ? config.es.alarm_index : 'watcher_alarms' 
				 +'-'+ new Date().toISOString().substr(0, 10).replace(/-/g, '.');
	        client.create({
	          index: index_name,
	          type: type,
	          body: {
			"@timestamp" : new Date().toISOString(),
			"message" : message
		  }
	        }).then(function (resp) {
	           // if (debug) console.log(resp);
	        }, function (err,resp) {
	            console.trace(err,resp);
	        });

	}


	/* Loop Actions */

	_.forOwn(actions, function(action, key) { 

		if (debug) console.log('Processing action:',key);

		/* ***************************************************************************** */

		      /*
			*   "console" : {
			*      "priority" : "DEBUG",
			*      "message" : "Average {{payload.aggregations.avg.value}}"
			*    }
		      */

                      if(_.has(action, 'console')) {
			var formater = action.console.message ? action.console.message : "{{ payload }}";
                        var message = mustache.render(formatter, {"payload":payload});
                        if (debug) console.log('KAAE Console: ',payload);
                      }

		/* ***************************************************************************** */

		      /*
			*   "email" : {
			*      "to" : "root@localhost",
			*      "subject" : "Alarm Title",
			*      "priority" : "high",
			*      "body" : "Series Alarm {{ payload._id}}: {{payload.hits.total}}",
			*      "stateless" : false
			*    }
		      */

                      if(_.has(action, 'email')) {
			var formatter_s = action.email.subject ? action.email.subject : "KAAE: "+key;
			var formatter_b = action.email.body ? action.email.body : "Series Alarm {{ payload._id}}: {{payload.hits.total}}";
                        var subject = mustache.render(formatter_s, {"payload":payload});
                        var body = mustache.render(formatter_b, {"payload":payload});
                        if (debug) console.log('KAAE Email: ',subject, body);

			// TODO: Add send email using config.email 

			if (!action.email.stateless) {
				// makeHistory(key,body);
				esHistory(key,body);
			}

                      }

		/* ***************************************************************************** */

 		      /*
			*   "webhook" : {
			*      "method" : "POST", 
			*      "host" : "remote.server", 
			*      "port" : 9200, 
			*      "path": ":/{{payload.watcher_id}", 
			*      "body" : "{{payload.watcher_id}}:{{payload.hits.total}}" 
			*    }
		      */

		      var querystring = require('querystring');
		      var http = require('http');

                      if(_.has(action, 'webhook')) {

			var options = {
				hostname: action.webhook.host ? action.webhook.host : 'locahost',
				port: action.webhook.port ? action.webhook.port : 80,
				path: action.webhook.path ? action.webhook.path : '/kaae',
				method: action.webhook.method ? action.webhook.method : 'POST'
			}

			if (action.webhook.headers) options.headers = action.webhook.headers;

			var req = http.request(options, function(res) {
			    res.setEncoding('utf8');
			    res.on('data', function (chunk) {
			        if (debug) console.log("body: " + chunk);
			    });
			});

			req.on('error', function(e) {
			    if (debug) console.log('Error shipping webhook: ' + e.message);
			});

			if (actions.webhook.body) { req.write(action.webhook.body); }
			else if (actions.webhook.params) { req.write(action.webhook.params); }

			req.end();

                      }

		/* ***************************************************************************** */

		      /*
			*   "elastic" : {
			*      "priority" : "DEBUG",
			*      "message" : "Avg {{payload.aggregations.avg.value}} measurements in 5 minutes"
			*    }
		      */

                      if(_.has(action, 'elastic')) {
			var formater = action.local.message ? action.local.message : "{{ payload }}";
                        var message = mustache.render(formatter, {"payload":payload});
                        if (debug) console.log('KAAE local: ',message);
			// makeHistory(key,message);
			esHistory(key,message);

                      }

		/* ***************************************************************************** */

	});


}
