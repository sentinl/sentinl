/*
 * Copyright 2016, Lorenzo Mangani (lorenzo.mangani@gmail.com)
 * Copyright 2015, Rao Chenlin (rao.chenlin@gmail.com)
 *
 * This file is part of Sentinl (http://github.com/sirensolutions/sentinl)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import _ from 'lodash';
import mustache from 'mustache';
import getConfiguration from './get_configuration';
import fs from 'fs';
import getElasticsearchClient from './get_elasticsearch_client';
import horsemanFactory from './horseman_factory';
import logHistory from './log_history';

import url from 'url';

export default function (server, actions, payload, watcherTitle) {

  const { callWithRequest } = getElasticsearchClient(server);
  const config = getConfiguration(server);
  const hlimit = config.sentinl.history ? config.sentinl.history : 10;

  /* ES Indexing Functions */
  var esHistory = function (watcherTitle, type, message, loglevel, payload, isReport, object) {
    if (isReport) {
      logHistory(server, callWithRequest, config, watcherTitle, type, message, loglevel, payload, isReport, object);
    } else {
      logHistory(server, callWithRequest, config, watcherTitle, type, message, loglevel, payload);
    }
  };

  /* Email Settings */
  var emailServer;
  var email;
  if (config.settings.email.active) {
    email = require('emailjs');
    emailServer = email.server.connect({
      user: config.settings.email.user,
      password: config.settings.email.password,
      host: config.settings.email.host,
      ssl: config.settings.email.ssl,
      timeout: config.settings.email.timeout
    }, function (err, message) {
      server.log(['status', 'info', 'Sentinl', 'email'], err || message);
    });
  }

  /* Slack Settings */
  var slack;
  if (config.settings.slack.active) {
    var Slack = require('node-slack');
    slack = new Slack(config.settings.slack.hook);
  }

  /* Internal Support Functions */
  var tmpHistory = function (type, message) {
    // Keep history stack of latest alarms (temp)
    server.sentinlStore.push({id: new Date(), action: type, message: message});
    // Rotate local stack
    if (server.sentinlStore.length > hlimit) {
      server.sentinlStore.shift();
    }
  };

  /* Debounce Function, returns true if throttled */
  var getDuration = require('sum-time');
  var debounce = function (id, period) {
    var duration = getDuration(period);
    if (duration) {
      var justNow = new Date().getTime();
      if (server.sentinlStore[id] === undefined) {
        server.sentinlStore[id] = justNow;
        return false;
      } else if ((justNow - server.sentinlStore[id]) > duration) {
        server.sentinlStore[id] = justNow;
        return false;
      } else {
        // reject action
        return true;
      }
    } else {
      return false;
    }
  };

  /* Loop Actions */
  _.forOwn(actions, function (action, key) {
    server.log(['status', 'info', 'Sentinl'], 'Processing action: ' + key);

    /* ***************************************************************************** */
    /*
    *   "console" : {
    *      "priority" : "DEBUG",
    *      "message" : "Average {{payload.aggregations.avg.value}}"
    *    }
    */

    var priority;
    var formatterC;
    var message;
    if (_.has(action, 'console')) {
      priority = action.console.priority ? action.console.priority : 'INFO';
      formatterC = action.console.message ? action.console.message : '{{ payload }}';
      message = mustache.render(formatterC, {payload: payload});
      server.log(['status', 'info', 'Sentinl'], 'Console Payload: ' + JSON.stringify(payload));
      esHistory(watcherTitle, key, message, priority, payload, false);
    }

    /* ***************************************************************************** */
    /*
    /* Throttle Action based on 'throttle_period' optional parameter
    /* "throttle_period": "5m"
    /*
    /* ***************************************************************************** */
    if (_.has(action, 'throttle_period')) {
      if (debounce(key, action.throttle_period)) {
        server.log(['status', 'info', 'Sentinl'], 'Action Throtthled: ' + key);
        esHistory(watcherTitle, key, 'Action Throtthled for ' + action.throttle_period, priority, {});
        return;
      }
    }

    /* ***************************************************************************** */
    /*
    *   "email" : {
    *      "to" : "root@localhost",
    *      "from" : "sentinl@localhost",
    *      "subject" : "Alarm Title",
    *      "priority" : "high",
    *      "body" : "Series Alarm {{ payload._id}}: {{payload.hits.total}}",
    *      "stateless" : false
    *	    }
    */

    var formatterS;
    var formatterB;
    var subject;
    var body;
    if (_.has(action, 'email')) {
      formatterS = action.email.subject ? action.email.subject : 'SENTINL: ' + key;
      formatterB = action.email.body ? action.email.body : 'Series Alarm {{ payload._id}}: {{payload.hits.total}}';
      subject = mustache.render(formatterS, {payload: payload});
      body = mustache.render(formatterB, {payload: payload});
      priority = action.email.priority ? action.email.priority : 'INFO';
      server.log(['status', 'info', 'Sentinl', 'email'], 'Subject: ' + subject + ', Body: ' + body);

      if (!emailServer || !config.settings.email.active) {
        server.log(['status', 'info', 'Sentinl', 'email'], 'Delivery Disabled!');
      }
      else {
        server.log(['status', 'info', 'Sentinl', 'email'], 'Delivering to Mail Server');
        emailServer.send({
          text: body,
          from: action.email.from,
          to: action.email.to,
          subject: subject
        }, function (err, message) {
          server.log(['status', 'info', 'Sentinl', 'email'], err || message);
        });
      }
      if (!action.email.stateless) {
        // Log Event
        esHistory(watcherTitle, key, body, priority, payload, false);
      }
    }


    /* ***************************************************************************** */
    /*
    *   "email_html" : {
    *      "to" : "root@localhost",
    *      "from" : "sentinl@localhost",
    *      "subject" : "Alarm Title",
    *      "priority" : "high",
    *      "body" : "Series Alarm {{ payload._id}}: {{payload.hits.total}}",
    *      "html" : "<p>Series Alarm {{ payload._id}}: {{payload.hits.total}}</p>",
    *      "stateless" : false
    *	    }
    */
    var html;
    if (_.has(action, 'email_html')) {
      formatterS = action.email_html.subject ? action.email_html.subject : 'SENTINL: ' + key;
      formatterB = action.email_html.body ? action.email_html.body : 'Series Alarm {{ payload._id}}: {{payload.hits.total}}';
      formatterC = action.email_html.body ? action.email_html.body : '<p>Series Alarm {{ payload._id}}: {{payload.hits.total}}</p>';
      subject = mustache.render(formatterS, {payload: payload});
      body = mustache.render(formatterB, {payload: payload});
      html = mustache.render(formatterC, {payload: payload});
      priority = action.email_html.priority ? action.email_html.priority : 'INFO';
      server.log(['status', 'info', 'Sentinl', 'email_html'], 'Subject: ' + subject + ', Body: ' + body + ', HTML:' + html);

      if (!emailServer || !config.settings.email.active) {
        server.log(['status', 'info', 'Sentinl', 'email_html'], 'Delivery Disabled!');
      }
      else {
        server.log(['status', 'info', 'Sentinl', 'email'], 'Delivering to Mail Server');
        emailServer.send({
          text: body,
          from: action.email_html.from,
          to: action.email_html.to,
          subject: subject,
          attachment: [{data: html, alternative: true}]
        }, function (err, message) {
          server.log(['status', 'info', 'Sentinl', 'email_html'], err || message);
        });
      }
      if (!action.email_html.stateless) {
        // Log Event
        esHistory(watcherTitle, key, body, priority, payload, false);
      }
    }

    /* ***************************************************************************** */
    /*
    *   "report" : {
    *      "to" : "root@localhost",
    *      "from" : "sentinl@localhost",
    *      "subject" : "Report Title",
    *      "priority" : "high",
    *      "body" : "Series Report {{ payload._id}}: {{payload.hits.total}}",
    *      "snapshot" : {
    *      		"res" : "1280,900",
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

    if (_.has(action, 'report')) {
      formatterS = action.report.subject ? action.report.subject : 'SENTINL: ' + key;
      formatterB = action.report.body ? action.report.body : 'Series Report {{ payload._id}}: {{payload.hits.total}}';
      subject = mustache.render(formatterS, {payload: payload});
      body = mustache.render(formatterB, {payload: payload});
      priority = action.report.priority ? action.report.priority : 'INFO';
      server.log(['status', 'info', 'Sentinl', 'report'], 'Subject: ' + subject + ', Body: ' + body);
      if (!emailServer) {
        server.log(['status', 'info', 'Sentinl', 'report'], 'Reporting Disabled! Email Required!');
        return;
      }

      if (!config.settings.report.active || (config.settings.report.active && !config.settings.email.active)) {
        server.log(['status', 'info', 'Sentinl', 'report'], 'Reports Disabled: Action requires Email Settings!');
        return;
      }

      if (!_.has(action, 'report.snapshot.url')) {
        server.log(['status', 'info', 'Sentinl', 'report'], 'Report Disabled: No URL Settings!');
        return;
      }

      let domain = null;
      try {
        const parts = url.parse(action.report.snapshot.url);
        domain = parts.hostname;
      } catch (error) {
        server.log(['status', 'info', 'Sentinl', 'report'], 'ERROR: ' + error);
      }

      horsemanFactory(server, domain)
      .then((horseman) => {
        var filename = 'report-' + Math.random().toString(36).substr(2, 9) + '.png';
        server.log(['status', 'info', 'Sentinl', 'report'], 'Creating Report for ' + action.report.snapshot.url);
        try {
          return horseman
          .viewport(1280, 900)
          .open(action.report.snapshot.url)
          .wait(action.report.snapshot.params.delay)
          .screenshot(action.report.snapshot.path + filename)
          //.pdf(action.report.snapshot.path + filename)
          .then(function () {
            server.log(['status', 'info', 'Sentinl', 'report'], 'Snapshot ready for url:' + action.report.snapshot.url);
            return emailServer.send({
              text: body,
              from: action.report.from,
              to: action.report.to,
              subject: subject,
              attachment: [
                // { path: action.report.snapshot.path + filename, type: "application/pdf", name: filename },
                { data: '<html><img src=\'cid:my-report\' width=\'100%\'></html>' },
                {
                  path: action.report.snapshot.path + filename,
                  type: 'image/png',
                  name: filename + '.png',
                  headers: {'Content-ID': '<my-report>'}
                }
              ]
            }, function (err, message) {
              server.log(['status', 'info', 'Sentinl', 'report'], err || message);
              if (!action.report.stateless) {
                // Log Event
                if (action.report.save) {
                  return fs.readFile(action.report.snapshot.path + filename, (err, data) => {
                    if (err) server.log(['status', 'info', 'Sentinl', 'report'], `Fail to save the ${action.report.subject}`);
                    esHistory(watcherTitle, key, body, priority, payload, true, new Buffer(data).toString('base64'));
                  });
                } else {
                  esHistory(watcherTitle, key, body, priority, payload, true);
                }
              }
              return fs.unlink(action.report.snapshot.path + filename, (err) => {
                if (err) {
                  server.log(['status', 'info', 'Sentinl', 'report'], 'Fail to delete file '
                    + action.report.snapshot.path + filename);
                }
                payload.message = err || message;
              });

            });
          }).close();
        } catch (err) {
          server.log(['status', 'error', 'Sentinl', 'report'], 'ERROR: ' + err);
          payload.message = err;
          if (!action.report.stateless) {
            // Log Event
            esHistory(watcherTitle, key, body, priority, payload, true);
          }
        }
      })
      .catch((error) => {
        server.log(['status', 'error', 'Sentinl'], `Cannot instantiate Horseman/PhantomJS: ${error}`);
      });
    }

    /* ***************************************************************************** */
    /*
    *   "slack" : {
    *      "channel": '#<channel>',
    *      "message" : "Series Alarm {{ payload._id}}: {{payload.hits.total}}",
    *      "stateless" : false
    *    }
    */

    var formatter;
    if (_.has(action, 'slack')) {
      formatter = action.slack.message ? action.slack.message : 'Series Alarm {{ payload._id}}: {{payload.hits.total}}';
      message = mustache.render(formatter, {payload: payload});
      priority = action.slack.priority ? action.slack.priority : 'INFO';
      server.log(['status', 'info', 'Sentinl', 'Slack'], 'Webhook to #' + action.slack.channel + ' msg: ' + message);

      if (!slack || !config.settings.slack.active) {
        server.log(['status', 'info', 'Sentinl', 'slack'], 'Delivery Disabled!');
      }
      else {
        try {
          slack.send({
            text: message,
            channel: action.slack.channel,
            username: config.settings.slack.username
          });
        } catch (err) {
          server.log(['status', 'info', 'Sentinl', 'slack'], 'Failed sending to: ' + config.settings.slack.hook);
        }
      }

      if (!action.slack.stateless) {
        // Log Event
        esHistory(watcherTitle, key, message, priority, payload, false);
      }
    }

    /* ***************************************************************************** */
    /*
    *   "webhook" : {
    *      "method" : "POST",
    *      "host" : "remote.server",
    *      "port" : 9200,
    *      "path": "/{{payload.watcher_id}}",
    *      "body" : "{{payload.watcher_id}}:{{payload.hits.total}}"
    *    }
    */

    var querystring = require('querystring');
    var http = require('http');
    var webhookBody;
    var options;
    var req;
    if (_.has(action, 'webhook')) {
      webhookBody = action.webhook.body ? mustache.render(action.webhook.body, {payload: payload}) : null;

      options = {
        protocol: action.webhook.protocol ? action.webhook.protocol : 'http:',
        hostname: action.webhook.host ? action.webhook.host : 'localhost',
        port: action.webhook.port ? action.webhook.port : 80,
        path: action.webhook.path ? action.webhook.path : '/',
        method: action.webhook.method ? action.webhook.method : 'GET'
      };

      // Log Alarm Event
      if (action.webhook.create_alert && payload.constructor === Object && Object.keys(payload).length) {
        esHistory(watcherTitle, key, action.webhook.message, action.webhook.priority, payload, false);
      }

      if (action.webhook.headers) options.headers = action.webhook.headers;
      if (action.webhook.auth) options.auth = action.webhook.auth;

      req = http.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          server.log(['status', 'debug', 'Sentinl'], 'Webhook Response: ' + chunk);
        });
      });

      req.on('error', function (e) {
        server.log(['status', 'err', 'Sentinl'], 'Error shipping Webhook: ' + e.message);
      });

      if (webhookBody) {
        req.write(webhookBody);
      }
      else if (action.webhook.params) {
        req.write(action.webhook.params);
      }
      req.end();
    }

    /* ***************************************************************************** */
    /*
    *   "elastic" : {
    *      "priority" : "DEBUG",
    *      "message" : "Avg {{payload.aggregations.avg.value}} measurements in 5 minutes"
    *    }
    */

    var esMessage;
    var esFormatter;
    if (_.has(action, 'elastic')) {
      esFormatter = action.local.message ? action.local.message : '{{ payload }}';
      esMessage = mustache.render(esFormatter, {payload: payload});
      priority = action.local.priority ? action.local.priority : 'INFO';
      server.log(['status', 'info', 'Sentinl', 'local'], 'Logged Message: ' + esMessage);
      // Log Event
      esHistory(watcherTitle, key, esMessage, priority, payload, false);
    }


    /* ***************************************************************************** */
    /*      you must set your api key in config.settings.pushapps.api_key
    mandatory parameters are text and at least on element in platforms array, see https://docs.pushapps.mobi/docs/notifications-create-notification for more info
    *   "pushapps" : {
    *      "platforms" : [ "android" , "ios", "web", "fb-messenger", "whatsapp"],
    *      "tags" : [ "<optional tag from PushApps>"],
    *      "campaign_id" : "<optional campaign id from PushApps>",
    *      "text" : "Series Alarm {{ payload._id}}: {{payload.hits.total}}",
    *      "url" : "<optional url to present>",
    *      "image_url" : "<optional image url for the notification or message>"
    *    }
    */

    var querystring = require('querystring');
    var http = require('http');
    if (_.has(action, 'pushapps')) {
      options = {
        hostname: 'https://api.pushapps.mobi/v1',
        port: 443,
        path: '/notifications',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': config.settings.pushapps.api_key
        }
      };

      var postData = querystring.stringify({
        text: action.text,
        platforms: action.platform,
        tags: action.tags,
        campaign_id: action.campaign_id,
        url: action.url,
        image_url: action.image_url
      });

      req = http.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          server.log(['status', 'debug', 'Sentinl'], 'Response: ' + chunk);
        });
      });

      req.on('error', function (e) {
        server.log(['status', 'err', 'Sentinl'], 'Error creating a PushApps notification: ' + e);
      });
      req.write(postData);
      req.end();
    }
  });
}
