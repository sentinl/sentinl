/* KAAE ACTIONS (c) 2016 QXIP BV */

import _ from 'lodash';
import mustache from 'mustache';
import config from './config';

var debug = true;

export default function (actions,payload) {

	_.forOwn(actions, function(action, key) { 

		if (debug) console.log('Processing action:',key);

		/* ***************************************************************************** */

		      /*
			*   "email" : {
			*      "to" : "root@localhost",
			*      "subject" : "Alarm Title",
			*      "priority" : "high",
			*      "body" : "Series Alarm {{ payload._id}}: {{payload.hits.total}}"
			*    }
		      */

                      if(_.has(action, 'email')) {
                        var subject = mustache.render(action.email.subject, {"payload":payload});
                        var body = mustache.render(action.email.body, {"payload":payload});
                        if (debug) console.log('KAAE Email: ',subject, body);
                      }

		/* ***************************************************************************** */

		      /*
			*   "console" : {
			*      "priority" : "DEBUG",
			*      "message" : "Average {{payload.aggregations.avg.value}}"
			*    }
		      */

                      if(_.has(action, 'console')) {
                        var message = mustache.render(action.email.body, {"payload":payload});
                        if (debug) console.log('KAAE Console: ',payload);
                      }

		/* ***************************************************************************** */

 		      /*
			*   "webhook" : {
			*      "method" : "POST", 
			*      "host" : "remote.server", 
			*      "port" : 9200, 
			*      "path": ":/{{ctx.watch_id}", 
			*      "body" : "{{ctx.watch_id}}:{{ctx.payload.hits.total}}" 
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
			*   "local" : {
			*      "priority" : "DEBUG",
			*      "message" : "Avg {{payload.aggregations.avg.value}} measurements in 5 minutes"
			*    }
		      */

                      if(_.has(action, 'local')) {
                        var message = mustache.render(action.email.body, {"payload":payload});
                        if (debug) console.log('KAAE local: ',message);
			// Keep stack of latest alarms (temp)
			server.kaaeStore.push({id:new Date(), message: message});
			// Rotate local stack
			if (server.kaaeStore.length > 10) { server.kaaeStore.shift(); } 
                      }

		/* ***************************************************************************** */

	});


}
