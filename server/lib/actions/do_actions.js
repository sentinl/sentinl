/*
 *   Copyright 2016, Lorenzo Mangani (lorenzo.mangani@gmail.com)
 *   Copyright 2015, Rao Chenlin (rao.chenlin@gmail.com)
 *
 *   This file is part of Sentinl (http://github.com/sirensolutions/sentinl)
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from 'fs';
import querystring from 'querystring';
import _ from 'lodash';
import { assign, pick, isObject } from 'lodash';
import url from 'url';
import Promise from 'bluebird';
import later from 'later';
import moment from 'moment';
import rison from 'rison';
import mustache from 'mustache';
import { WebClient } from '@slack/client';
import getConfiguration from '../get_configuration';
import apiClient from '../api_client';
import EmailClient from './email_client';
import Log from '../log';
import ActionError from '../errors/action_error';

// actions
import reportAction from './report';

const toString = function (message) {
  if (typeof message !== 'string') {
    return JSON.stringify(message);
  }
  return message;
};

/**
* Perform actions
*
* @param {object} server hapi of Kibana
* @param {object} actions of watcher
* @param {payload} payload of watcher
* @param {task} task of watcher
*/
export default function (server, actions, payload, task) {
  const config = getConfiguration(server);
  let log = new Log(config.app_name, server, 'do_action');

  // Use Elasticsearch API because Kibana savedObjectsClient
  // can't be used without session user from request
  const client = apiClient(server, 'elasticsearchAPI');

  /* Email Settings */
  let email;
  try {
    email = new EmailClient(config.settings.email);
  } catch (err) {
    err = new ActionError('email client', err);
    log.error(`${task.title}: ${err.message}: ${err.stack}`);
    client.logAlarm({
      watcherTitle: task.title,
      message: err.toString(),
      level: 'high',
      isError: true,
    });
  }

  /* Slack Settings */
  let slack;
  try {
    if (config.settings.slack.active) {
      slack = new WebClient(config.settings.slack.token);
    }
  } catch (err) {
    err = new ActionError('slack client', err);
    log.error(`${task.title}: ${err.message}: ${err.stack}`);
    client.logAlarm({
      watcherTitle: task.title,
      message: err.toString(),
      level: 'high',
      isError: true,
    });
  }

  /* Debounce Function, returns true if throttled */
  var getDuration = require('sum-time');
  var debounce = function (id, period) {
    var duration = getDuration(period);

    var isInThrottlePeriod = function (id, now, duration) {
      return (now - server.sentinlStore.actions[id]) < duration;
    };

    if (duration) {
      var justNow = new Date().getTime();

      if (!_.has(server.sentinlStore, 'actions')) {
        server.sentinlStore.actions = {};
      }

      if (!_.has(server.sentinlStore.actions, id) || !isInThrottlePeriod(id, justNow, duration)) {
        server.sentinlStore.actions[id] = justNow;
        return false;
      }

      // throttle action
      return true;
    } else {
      return false;
    }
  };

  if (task.dashboard_link) {
    const scheduleStartTime = moment(later.schedule(later.parse.text(task.trigger.schedule.later)).prev(2)[1]);
    task.dashboard_link = _updateDashboardLinkTimeRange(task.dashboard_link, scheduleStartTime, moment());
  }

  /* Loop Actions */
  _.forEach(actions, function (action, actionId) {
    log = new Log(config.app_name, server, task._id);
    log.debug('processing action');

    const actionName = action.name || actionId; // advanced watcher can be without name property

    /* ***************************************************************************** */
    /*
    *   "console" : {
    *      "priority" : "low",
    *      "message" : "Average {{payload.aggregations.avg.value}}",
    *    }
    */

    var priority;
    var formatterConsole;
    var message;
    if (action.console) {
      (async () => {
        try {
          priority = action.console.priority || 'medium';
          formatterConsole = action.console.message ? action.console.message : '{{ payload }}';
          message = mustache.render(formatterConsole, {payload: payload,});
          log.debug('console payload', payload);

          await client.logAlarm({
            watcherTitle: task.title,
            actionName,
            message: toString(message),
            level: priority,
            payload: !task.save_payload ? {} : payload,
          });
        } catch (err) {
          err = new ActionError('console action', err);
          log.error(`${task.title}: ${err.message}: ${err.stack}`);
          client.logAlarm({
            watcherTitle: task.title,
            message: err.toString(),
            level: 'high',
            isError: true,
            actionName,
          });
        }
      })();
    }

    /* ***************************************************************************** */
    /*
    /* Throttle Action based on 'throttle_period' optional parameter
    /* "throttle_period": "5m"
    /*
    /* ***************************************************************************** */
    if (action.throttle_period) {
      (async () => {
        try {
          const id = `${task._id}_${actionId}`;
          if (debounce(id, action.throttle_period)) {
            log.info(`action throttled, watcher id: ${task._id}, action name: ${actionId}`);
            await client.logAlarm({
              watcherTitle: task.title,
              actionName,
              message: `Action Throttled for ${action.throttle_period}`,
              level: priority,
              payload: {}
            });
            return;
          }
        } catch (err) {
          err = new ActionError('throttle', err);
          log.error(`${task.title}: ${err.message}: ${err.stack}`);
          client.logAlarm({
            watcherTitle: task.title,
            message: err.toString(),
            level: 'high',
            isError: true,
            actionName,
          });
        }
      })();
    }

    /* ***************************************************************************** */
    /*
    *   "email" : {
    *      "to" : "root@localhost",
    *      "from" : "sentinl@localhost",
    *      "subject" : "Alarm Title",
    *      "priority" : "high",
    *      "body" : "Series Alarm {{ payload._id}}: {{payload.hits.total}}",
    *      "stateless" : false,
    *     }
    */

    var formatterSubject;
    var formatterBody;
    var subject;
    var text;
    if (action.email) {
      (async () => {
        try {
          formatterSubject = action.email.subject || ('SENTINL: ' + actionId);

          formatterBody = action.email.body;
          if (!formatterBody) {
            if (payload.docs) {
              formatterBody = 'Number of documents: {{payload.docs.length}}';
            } else if (payload.sheet) {
              formatterBody = 'Number of 0 sheet data: {{payload.sheet[0].list[0].data.length}}';
            } else { // hits
              formatterBody = 'Series Alarm {{payload._id}}: {{payload.hits.total}}';
            }
          }

          subject = mustache.render(formatterSubject, {payload: payload, watcher: task});
          text = mustache.render(formatterBody, {payload: payload, watcher: task});
          priority = action.email.priority || 'medium';


          if (!action.email.stateless) {
            // Log Event
            await client.logAlarm({
              watcherTitle: task.title,
              actionName,
              message: toString(text),
              level: priority,
              payload: !task.save_payload ? {} : payload,
            });
          }

          log.info('sending email');

          if (!config.settings.email.active) {
            throw new Error('email delivery disabled');
          } else {
            await email.send({
              text,
              from: action.email.from,
              to: action.email.to,
              subject
            });
          }
        } catch (err) {
          err = new ActionError('email action', err);
          log.error(`${task.title}: ${err.message}: ${err.stack}`);
          client.logAlarm({
            watcherTitle: task.title,
            message: err.toString(),
            level: 'high',
            isError: true,
            actionName,
          });
        }
      })();
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
    *      "stateless" : false,
    *     }
    */
    var html;
    if (action.email_html) {
      (async () => {
        try {
          formatterSubject = action.email_html.subject ? action.email_html.subject : 'SENTINL: ' + actionId;

          formatterBody = action.email_html.body;
          if (!formatterBody) {
            if (payload.docs) {
              formatterBody = 'Number of documents: {{payload.docs.length}}';
            } else if (payload.sheet) {
              formatterBody = 'Number of 0 sheet data: {{payload.sheet[0].list[0].data.length}}';
            } else { // hits
              formatterBody = 'Series Alarm {{payload._id}}: {{payload.hits.total}}';
            }
          }

          let formatterConsole = action.email_html.html || '<p>Series Alarm {{ payload._id}}: {{payload.hits.total}}</p>';
          subject = mustache.render(formatterSubject, {payload: payload, watcher: task});
          text = mustache.render(formatterBody, {payload: payload, watcher: task});
          html = mustache.render(formatterConsole, {payload: payload, watcher: task});
          priority = action.email_html.priority || 'medium';

          if (!action.email_html.stateless) {
            // Log Event
            await client.logAlarm({
              watcherTitle: task.title,
              actionName,
              message: toString(text),
              level: priority,
              payload: !task.save_payload ? {} : payload,
            });
          }

          log.info('processing html email');

          if (!config.settings.email.active) {
            throw new Error('email delivery disabled');
          } else {
            await email.send({
              text,
              from: action.email_html.from,
              to: action.email_html.to,
              subject,
              attachment: [
                {
                  data: html,
                  alternative: true
                }
              ]
            });
          }
        } catch (err) {
          err = new ActionError('html email action', err);
          log.error(`${task.title}: ${err.message}: ${err.stack}`);
          client.logAlarm({
            watcherTitle: task.title,
            message: err.toString(),
            level: 'high',
            isError: true,
            actionName,
          });
        }
      })();
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
    *         "res" : "1280,900",
    *         "url" : "http://127.0.0.1/app/kibana#/dashboard/Alerts",
    *         "path" : "/tmp/",
    *         "params" : {
    *             "username" : "username",
    *             "password" : "password",
    *             "delay" : 15,
    *             "crop" : false
    *         }
    *       },
    *      "stateless" : false
    *    }
    */
    if (action.report) {
      (async () => {
        try {
          if (!config.settings.report.active) {
            throw new Error('Reports disabled');
          }

          await reportAction({
            server,
            action,
            watcherTitle: task.title,
            esPayload: payload,
            actionName,
            emailClient: email,
          });
        } catch (err) {
          err = new ActionError('report action', err);
          log.error(`${task.title}: ${err.message}: ${err.stack}`);
          client.logAlarm({
            watcherTitle: task.title,
            message: err.toString(),
            level: 'high',
            isError: true,
            isReport: true,
            actionName,
          });
        }
      })();
    }

    /* ***************************************************************************** */
    /*
    *   "slack" : {
    *      "channel": '#<channel>',
    *      "message" : "Series Alarm {{ payload._id}}: {{payload.hits.total}}",
    *      "stateless" : false,
    *    }
    */

    if (action.slack) {
      (async () => {
        try {
          let formatter;
          formatter = action.slack.message ? action.slack.message : 'Series Alarm {{ payload._id}}: {{payload.hits.total}}';
          message = mustache.render(formatter, {payload: payload, watcher: task});
          priority = action.slack.priority || 'medium';
          log.debug(`webhook to #${action.slack.channel}, message: ${message}`);

          if (!action.slack.stateless) {
            // Log Event
            await client.logAlarm({
              watcherTitle: task.title,
              actionName,
              message: toString(message),
              level: priority,
              payload: !task.save_payload ? {} : payload,
            });
          }

          if (!slack || !config.settings.slack.active) {
            throw new Error('slack message delivery disabled');
          }

          try {
            const resp = await slack.chat.postMessage({
              channel: action.slack.channel,
              text: message
            });
            log.info(`Message sent to slack channel ${resp.channel} as ${resp.message.username}`);
          } catch (err) {
            const msg = `Failed to send message to channel ${action.slack.channel} using token ${config.settings.slack.token}`;
            throw new ActionError(msg, err);
          }
        } catch (err) {
          err = new ActionError('slack action', err);
          log.error(`${task.title}: ${err.message}: ${err.stack}`);
          client.logAlarm({
            watcherTitle: task.title,
            message: err.toString(),
            level: 'high',
            isError: true,
            actionName,
          });
        }
      })();
    }

    /* ***************************************************************************** */
    /*
    *   "webhook" : {
    *      "method" : "POST",
    *      "host" : "remote.server",
    *      "port" : 9200,
    *      "path": "/{{payload.watcher_id}}",
    *      "body" : "{{payload.watcher_id}}:{{payload.hits.total}}",
    *      "use_https" : false,
    *      "stateless" : false,
    *      "headers": {'Content-Type': 'text/plain'},
    *    }
    */

    if (action.webhook) {
      (async () => {
        try {
          // Log Alarm Event
          if (!action.webhook.stateless && payload.constructor === Object && Object.keys(payload).length) {
            await client.logAlarm({
              watcherTitle: task.title,
              actionName,
              message: toString(action.webhook.message),
              level: action.webhook.priority,
              payload: !task.save_payload ? {} : payload,
            });
          }

          const http = action.webhook.use_https ? require('https') : require('http');
          const templateData = {
            payload: payload,
            watcher: task
          };
          let options;
          let req;

          options = {
            hostname: action.webhook.host ? action.webhook.host : 'localhost',
            port: action.webhook.port ? action.webhook.port : 80,
            method: action.webhook.method ? action.webhook.method : 'GET',
            headers: action.webhook.headers ? action.webhook.headers : {},
            auth: action.webhook.auth ? action.webhook.auth : undefined,
            path: mustache.render(action.webhook.path, templateData)
          };

          if (options.method === 'GET' && action.webhook.params) {
            const params = {};
            for (const [param, value] of Object.entries(action.webhook.params)) {
              params[param] = mustache.render(value, templateData);
            }
            options.path += '?' + querystring.stringify(params);
          }

          const dataToWrite = (options.method !== 'GET' && action.webhook.body) ?
            mustache.render(action.webhook.body, templateData) : undefined;
          if (dataToWrite) {
            options.headers['Content-Length'] = Buffer.byteLength(dataToWrite);
          }

          req = http.request(options, function (res) { // to-do: refactor to use http client which returns promise, e.g. axios
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
              log.debug(`webhook response: ${chunk}`);
            });
          });

          req.on('error', function (err) {
            log.error(`fail to ship webhook, ${err}`);
          });
          if (dataToWrite) {
            req.write(dataToWrite);
          }
          req.end();
        } catch (err) {
          err = new ActionError('webhook action', err);
          log.error(`${task.title}: ${err.message}: ${err.stack}`);
          client.logAlarm({
            watcherTitle: task.title,
            message: err.toString(),
            level: 'high',
            isError: true,
            actionName,
          });
        }
      })();
    }

    /* ***************************************************************************** */
    /*
    *   "elastic" : {
    *      "priority" : "low",
    *      "message" : "Avg {{payload.aggregations.avg.value}} measurements in 5 minutes"
    *    }
    */

    if (action.elastic) {
      (async () => {
        try {
          let message;
          let esFormatter;
          esFormatter = action.elastic.message || '{{payload}}';
          message = mustache.render(esFormatter, {payload: payload, watcher: task});
          priority = action.elastic.priority || 'medium';
          log.debug(`logged message to elastic: ${message}`);
          // Log Event
          await client.logAlarm({
            watcherTitle: task.title,
            actionName,
            message: toString(message),
            level: priority,
            payload: !task.save_payload ? {} : payload,
          });
        } catch (err) {
          err = new ActionError('elastic action', err);
          log.error(`${task.title}: ${err.message}: ${err.stack}`);
          client.logAlarm({
            watcherTitle: task.title,
            message: err.toString(),
            level: 'high',
            isError: true,
            actionName,
          });
        }
      })();
    }
  });
}

function _updateDashboardLinkTimeRange(url, from, to) {
  const [urlBase, query] = url.split('?', 2);
  let queryParameters = {};
  query.split('&').forEach(parameter => {
    const [key, value] = parameter.split('=');
    queryParameters[key] = rison.decode(value);
  });

  const dashboardName = queryParameters._a.id;
  queryParameters = {
    _a: {
      filters: queryParameters._a.filters,
      query: queryParameters._a.query
    },
    _k: {
      d: {
        [dashboardName]: {
          t: {
            m: 'absolute',
            f: from.toISOString(),
            t: to.toISOString()
          }
        }
      }
    }
  };
  return urlBase + '?' + _.map(queryParameters, (value, key) => `${key}=${rison.encode(value)}`).join('&');
}
