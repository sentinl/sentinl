/* KAAE ACTIONS (c) 2016 QXIP BV */

import _ from 'lodash';
import mustache from 'mustache';
import config from './config';

/* Email Settings */
if (config.settings.email.active) {
	var email   = require("emailjs");
	var email_server  = email.server.connect({
	   user:    config.settings.email.user,
	   password:config.settings.email.password,
	   host:    config.settings.email.host,
	   ssl:     config.settings.email.ssl
	});
	// server.smtp.debug(100);
}

/* Slack Settings */
if (config.settings.slack.active) {
	var Slack   = require("node-slack");
	var slack = new Slack(config.settings.slack.hook);
}

var debug = true;

var hlimit = config.kaae.history ? config.kaae.history : 10;

export default function (server,actions,payload) {

	/* Internal Support Functions */

	var tmpHistory = function(type,message) {
		// Keep history stack of latest alarms (temp)
		server.kaaeStore.push({id:new Date(), action: type, message: message});
		// Rotate local stack
		if (server.kaaeStore.length > hlimit) { server.kaaeStore.shift(); } 
	}

	/* ES Indexing Functions */

	var esHistory = function(type,message,loglevel) {
		var client = server.plugins.elasticsearch.client;
		if (!loglevel) { var loglevel = "INFO"; }
	        server.log(['status', 'info', 'KaaE'],'Storing Alarm to ES with type:'+type);
		var indexDate = '-' + new Date().toISOString().substr(0, 10).replace(/-/g, '.');
		var index_name = config.es.alarm_index ? config.es.alarm_index + indexDate : 'watcher_alarms' + indexDate;
	        client.create({
	          index: index_name,
	          type: type,
	          body: {
			"@timestamp" : new Date().toISOString(),
			"level" : loglevel,
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

	        server.log(['status', 'info', 'KaaE'],'Processing action: '+key);

		/* ***************************************************************************** */

		      /*
			*   "console" : {
			*      "priority" : "DEBUG",
			*      "message" : "Average {{payload.aggregations.avg.value}}"
			*    }
		      */

                      if(_.has(action, 'console')) {
			var priority = action.console.priority ? action.console.priority : "INFO";
			var message = action.console.message ? action.console.message : "{{ payload }}";
		        server.log(['status', 'info', 'KaaE'],'Console Payload: '+payload);
			esHistory(key,message,priority);
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
		        server.log(['status', 'info', 'KaaE','email'],'Subject: '+subject+', Body: '+body);

			if (!email_server) { server.log(['status', 'info', 'Kaae', 'email'], 'Delivery Disabled!'); }

			if (!action.email.stateless) {
				// Log Event
				esHistory(key,body);
			}

                      }

		/* ***************************************************************************** */

		      /*
			*   "slack" : {
			*      "channel": '#<channel>',
			*      "message" : "Series Alarm {{ payload._id}}: {{payload.hits.total}}",
			*      "stateless" : false
			*    }
		      */

                      if(_.has(action, 'slack')) {
			var formatter = action.slack.message ? action.slack.message : "Series Alarm {{ payload._id}}: {{payload.hits.total}}";
                        var message = mustache.render(formatter, {"payload":payload});
	        	server.log(['status', 'info', 'KaaE', 'Slack'],'Webhook to #'+action.slack.channel+' msg: '+message);

			if (!slack) { 
			        server.log(['status', 'info', 'KaaE','slack'],'Delivery Disabled!');
			}
			else {
				try {
					slack.send({
	    				    text: message,
					    username: config.settings.slack.username
					});
				} catch(err) { 
				        server.log(['status', 'info', 'KaaE', 'slack'],'Failed sending to: '+condig.settings.slack.hook);
				}
			}

			if (!action.slack.stateless) {
				// Log Event
				esHistory(key,message);
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
			        server.log(['status', 'debug', 'KaaE'],'Response: '+chunk);
			    });
			});

			req.on('error', function(e) {
			        server.log(['status', 'err', 'KaaE'],'Error shipping webhook: '+e.message);
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
		        server.log(['status', 'info', 'KaaE', 'local'],'Message: '+message);
			esHistory(key,message);

                      }

		/* ***************************************************************************** */

	});


}
