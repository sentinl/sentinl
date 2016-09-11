/* KAAE ACTIONS (c) 2016 QXIP BV */

import _ from 'lodash';
import mustache from 'mustache';
import config from './config';
import fs from 'fs';

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

/* Image Report Settings */
if (config.settings.report) {
	/* Image Report Settings */
	if (config.settings.report.active && config.settings.email.active) {
		try {
			const Pageres = require('pageres')
		} catch(err) {
			server.log(['status', 'info', 'KaaE'],'Pageres and PhantomJS required! Reports Disabled.');
			server.log(['status', 'info', 'KaaE'],'Install Pageres: "npm install --save pageres"');
		}
	} else {
		server.log(['status', 'info', 'KaaE'],'Action Report requires Email Settings! Reports Disabled.');
	}
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
	var esHistory = function(type,message,loglevel,payload) {
		var client = server.plugins.elasticsearch.client;
		if (!loglevel) { var loglevel = "INFO"; };
		if (!payload) { var payload = {} };
	        server.log(['status', 'info', 'KaaE'],'Storing Alarm to ES with type:'+type);
		var indexDate = '-' + new Date().toISOString().substr(0, 10).replace(/-/g, '.');
		var index_name = config.es.alarm_index ? config.es.alarm_index + indexDate : 'watcher_alarms' + indexDate;
	        client.create({
	          index: index_name,
	          type: type,
	          body: {
			"@timestamp" : new Date().toISOString(),
			"level" : loglevel,
			"message" : message,
			"action" : type,
			"payload" : payload

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
							esHistory(key,message,priority,payload);
            }

						/* ***************************************************************************** */
		      	/*
						*   "email" : {
						*      "to" : "root@localhost",
						*      "from" : "kaae@localhost",
						*      "subject" : "Alarm Title",
						*      "priority" : "high",
						*      "body" : "Series Alarm {{ payload._id}}: {{payload.hits.total}}",
						*      "stateless" : false
						*	    }
		      	*/

            	if(_.has(action, 'email')) {
										var formatter_s = action.email.subject ? action.email.subject : "KAAE: "+key;
										var formatter_b = action.email.body ? action.email.body : "Series Alarm {{ payload._id}}: {{payload.hits.total}}";
									  var subject = mustache.render(formatter_s, {"payload":payload});
									  var body = mustache.render(formatter_b, {"payload":payload});
										var priority = action.email.priority ? action.email.priority : "INFO";
										server.log(['status', 'info', 'KaaE','email'],'Subject: '+subject+', Body: '+body);

										if (!email_server || !config.settings.email.active ) { server.log(['status', 'info', 'Kaae', 'email'], 'Delivery Disabled!'); }
										else {
													server.log(['status', 'info', 'Kaae', 'email'], 'Delivering to Mail Server');
													email_server.send({
													   text:    body,
													   from:    action.email.from,
													   to:      action.email.to,
													   subject: subject
													}, function(err, message) { server.log(['status', 'info', 'Kaae', 'email'], err || message); });
										}
										if (!action.email.stateless) {
												// Log Event
												esHistory(key,body,priority,payload);
										}
        			}

							/* ***************************************************************************** */
							/*
							*   "report" : {
							*      "to" : "root@localhost",
							*      "from" : "kaae@localhost",
							*      "subject" : "Report Title",
							*      "priority" : "high",
							*      "body" : "Series Report {{ payload._id}}: {{payload.hits.total}}",
							*      "snapshot" : {
							*      		"res" : "1280x900",
							*         "url" : "http://127.0.0.1/app/kibana#/dashboard/Alerts",
							*         "path" : "/tmp/",
							*         "params" : {
							*      				"username" : "username",
							*      				"password" : "password",
							*      				"delay" : 15,
							*             "crop" : false
							*         }
						  *       },
							*      "stateless" : false
							*    }
							*/

							if(_.has(action, 'report')) {
										var formatter_s = action.report.subject ? action.report.subject : "KAAE: "+key;
										var formatter_b = action.report.body ? action.report.body : "Series Report {{ payload._id}}: {{payload.hits.total}}";
									  var subject = mustache.render(formatter_s, {"payload":payload});
									  var body = mustache.render(formatter_b, {"payload":payload});
										var priority = action.report.priority ? action.report.priority : "INFO";
										server.log(['status', 'info', 'KaaE','report'],'Subject: '+subject+', Body: '+body);
										if (!email_server) { server.log(['status', 'info', 'Kaae', 'report'], 'Reporting Disabled! Email Required!');return; }
										if (!Pageres || !action.report.snapshot) { server.log(['status', 'info', 'Kaae', 'report'], 'Reporting Disabled! No Settings!');return; }
										else {
												action.report.snapshot.params.filename = "report-"+ Date.now()+".png"
												server.log(['status', 'info', 'Kaae', 'report'], 'Delivering Report '+uuid+' to Mail Server');
												var sendReport = function(){
													email_server.send({
																				   text:    body,
																				   from:    action.email.from,
																				   to:      action.email.to,
																				   subject: subject,
																					 attachment:
																				   [
																				      {path:action.report.snapshot.path+action.report.snapshot.params.filename, type:"image/png", name:action.report.snapshot.params.filename}
																				   ]
																				}, function(err, message) {
																								server.log(['status', 'info', 'Kaae', 'report'], err || message);
																								fs.unlinkSync(action.report.snapshot.path+action.report.snapshot.params.filename);
																								payload.message = err || message;
																				});
												}
												pageres = new Pageres({delay: 2})
    										.src(action.report.snapshot.url, [action.report.snapshot.res ? action.report.snapshot.res : '1280x900'], action.report.snapshot.params)
    										.dest(action.report.snapshot.path)
    										.run()
												.then(() => sendReport());
										}
										if (!action.report.stateless) {
												// Log Event
												esHistory(key,body,priority,payload);
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
										var priority = action.slack.priority ? action.slack.priority : "INFO";
	        					server.log(['status', 'info', 'KaaE', 'Slack'],'Webhook to #'+action.slack.channel+' msg: '+message);

										if (!slack || !config.settings.slack.active) {
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
											esHistory(key,message,priority,payload);
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
										var priority = action.local.priority ? action.local.priority : "INFO";
		        				server.log(['status', 'info', 'KaaE', 'local'],'Message: '+message);
										// Log Event
										esHistory(key,message,priority,payload);
                }

		/* ***************************************************************************** */

	});

}
