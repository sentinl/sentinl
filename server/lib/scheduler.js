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
import Promise from 'bluebird';
import later from 'later';
import doActions from './actions';
import getConfiguration from './get_configuration';
import Watcher from './classes/watcher';
import getElasticsearchClient from './get_elasticsearch_client';
import AnomalyFinder from 'anomaly-finder';

/**
* Schedules and executes watchers in background
*/
export default function Scheduler(server) {

  const config = getConfiguration(server);

  let watcher;
  let client;

  let sirenVanguardAvailable = false;
  try {
    const elasticsearchPlugins = server.config().get('elasticsearch.plugins');
    if (elasticsearchPlugins && elasticsearchPlugins.indexOf('siren-vanguard') > -1) {
      sirenVanguardAvailable = true;
    }
  } catch (err) {
    // 'elasticsearch.plugins' not available when running from kibana
  }

  /**
  * Get all report actions.
  *
  * @param {object} actions - watcher actions.
  */
  function getReportActions(actions) {
    const filteredActions = {};
    _.forEach(actions, (settings, name) => {
      if (_.has(settings, 'report')) filteredActions[name] = settings;
    });
    return filteredActions;
  };

  /**
  * Get all actions except reports.
  *
  * @param {object} actions - watcher actions.
  */
  function getNonReportActions(actions) {
    const filteredActions = {};
    _.forEach(actions, (settings, name) => {
      if (!_.has(settings, 'report')) filteredActions[name] = settings;
    });
    return filteredActions;
  };

  /**
  * Remove unused watchers watcher.
  *
  * @param {object} resp - ES response, watchers list.
  */
  function removeOrphans(resp) {
    let orphans = _.difference(_.each(_.keys(server.sentinlStore.schedule)), _.map(resp.hits.hits, '_id'));
    _.each(orphans, function (orphan) {
      server.log(['status', 'info', 'Sentinl', 'scheduler'], 'Deleting orphan watcher: ' + orphan);
      if (_.isObject(server.sentinlStore.schedule[orphan].later) && _.has(server.sentinlStore.schedule[orphan].later, 'clear')) {
        server.sentinlStore.schedule[orphan].later.clear();
      }
      delete server.sentinlStore.schedule[orphan];
    });
  };

  /**
  * Find user for a watcher. Get authenticated Elasticsearch client.
  *
  * @param {string} watcherId - watcher _id.
  */
  function getImpersonatedEsClient(watcherId) {
    return new Promise((resolve, reject) => {
      watcher.getUser(watcherId).then((resp) => {
        if (resp.found) {
          const impersonate = {
            username: resp._source.username,
            sha: resp._source.sha
          };
          const client = getElasticsearchClient(server, config, 'data', impersonate);
          server.log(['status', 'debug', 'Sentinl', 'scheduler', 'auth'],
            `Impersonate watcher ${watcherId} by ${JSON.stringify(impersonate)}`);
          resolve(client);
        } else {
          reject(new Error(`Unable to find an user to authenticate watcher ${watcherId}: ${JSON.stringify(resp)}`));
        }
      });
    });
  };

  /**
  * Execute a watcher report actions.
  *
  * @param {object} task - watcher configuration.
  */
  function handleReports(task) {
    server.log(['status', 'info', 'Sentinl', 'scheduler'], `Executing report action: ${task._id}`);

    const actions = getReportActions(task._source.actions);
    const payload = { _id: task._id };

    if (_.keys(actions).length) {
      doActions(server, actions, payload, task._source);
    }
  };

  /**
  * Execute all watcher actions except reports.
  *
  * @param {object} task - watcher configuration.
  */
  function handleActions(task) {
    server.log(['status', 'info', 'Sentinl', 'scheduler'], `Executing action: ${task._id}`);

    const actions = getNonReportActions(task._source.actions);
    let request = _.has(task._source, 'input.search.request') ? task._source.input.search.request : undefined;
    let condition = _.keys(task._source.condition).length ? task._source.condition : undefined;
    let transform = task._source.transform ? task._source.transform : {};

    let method = 'search';
    if (sirenVanguardAvailable) {
      for (let candidate of ['kibi_search', 'vanguard_search', 'search']) {
        if (client[candidate]) {
          method = candidate;
          break;
        }
      }
    }

    if (!request || !condition) {
      server.log(['status', 'debug', 'Sentinl', 'scheduler'],
        `Watcher ${task._source.uuid} search request or condition malformed`);
      return;
    }

    /**
    * Finding anomaly.
    */
    function findAnomaly(payload, condition) {
      const hound = new AnomalyFinder();

      _.forEach(payload.hits.hits, function (hit) {
        if (condition.anomaly.normal_values) { // static anomaly search
          if (hound.find(condition.anomaly.normal_values, hit[condition.anomaly.field_to_check])) {
            if (!_.has(payload, 'anomaly')) {
              payload.anomaly = [];
            }
            payload.anomaly.push(hit);
          }
        } else { // dynamic anomaly search based on the received response
          const anomaly = [];
          const field = condition.anomaly.field_to_check;
          const values = _.pluck(payload.hits.hits, `_source.${field}`);

          _.forEach(payload.hits.hits, function (hit) {
            let otherValues = _.filter(values, v => v !== hit._source[field]);
            if (hound.find(otherValues, hit._source[field])) {
              anomaly.push(hit);
            }
          });

          if (anomaly.length) {
            payload.anomaly = anomaly;
          }
        }
      });

      return payload;
    };

    /**
    * Executing watcher search request.
    *
    * @param {object} watcher - watcher API object
    */
    function executeWatcher(watcher) {
      watcher.search(method, request).then((payload) => {
        server.log(['status', 'info', 'Sentinl', 'scheduler', 'payload'], payload);

        if (!payload) {
          server.log(['status', 'debug', 'Sentinl', 'scheduler'], `Watcher ${task._source.uuid}` +
            ' malformed or missing key parameters!');
          return;
        }

        server.log(['status', 'debug', 'Sentinl', 'scheduler'], payload);

        // find anomalies in search response
        if (_.has(task._source, 'sentinl.condition.anomaly')) {
          payload = findAnomaly(payload, task._source.sentinl.condition);
        }

        /* Validate Condition */
        let ret;
        try {
          ret = eval(condition); // eslint-disable-line no-eval
        } catch (err) {
          server.log(['status', 'info', 'Sentinl', 'scheduler'], `Condition Error for ${task._id}: ${err}`);
        }

        if (ret) {
          if (transform.script) {
            try {
              eval(transform.script.script); // eslint-disable-line no-eval
            } catch (err) {
              server.log(['status', 'info', 'Sentinl', 'scheduler'], `Transform Script Error for ${task._id}: ${err}`);
            }
            doActions(server, actions, payload, task._source);
          } else if (transform.search) {
            watcher.search(method, transform.search.request).then((payload) => {
              if (!payload) return;
              doActions(server, actions, payload, task._source);
            });
          } else {
            doActions(server, actions, payload, task._source);
          }
        }
      })
      .catch((error) => {
        server.log(['error', 'Sentinl', 'scheduler'], `An error occurred while executing the task._source: ${error}`);
      });
    };

    if (config.settings.authentication.enabled) {
      getImpersonatedEsClient(task._id)
      .then((clientImpersonated) => {
        const watcherImpersonated = new Watcher(clientImpersonated, config);

        scheduleWatcher(task);
        executeWatcher(watcherImpersonated);
      })
      .catch((err) => server.log(['status', 'error', 'Sentinl', 'scheduler'], err));
    } else {
      executeWatcher(watcher);
    }
  };

  /**
  * Process a watcher actions.
  *
  * @param {object} task - watcher configuration.
  */
  function watching(task) {
    if (!task._source || task._source.disable) {
      server.log(['status', 'debug', 'Sentinl', 'scheduler'], `Non-Executing Disabled Watch: ${task._id}`);
      return;
    }

    server.log(['status', 'info', 'Sentinl', 'scheduler'], `Executing watcher: ${task._id}`);
    server.log(['status', 'debug', 'Sentinl', 'scheduler'], task);

    if (!task._source.actions || _.isEmpty(task._source.actions)) {
      server.log(['status', 'debug', 'Sentinl', 'scheduler'], `Watcher ${task._source.uuid} has no actions.`);
      return;
    }

    let actions = [];

    if (task._source.report) {
      handleReports(task);
    }

    if (_.keys(getNonReportActions(task._source.actions)).length) {
      handleActions(task);
    }
  };

  /**
  * Schedule a watcher.
  *
  * @param {object} task - watcher configuration.
  */
  function scheduleWatcher(task) {
    if (_.has(server.sentinlStore.schedule, `[${task._id}].later`)) {
      server.log(['status', 'info', 'Sentinl', 'scheduler'], `Clearing watcher: ${task._id}`);
      server.sentinlStore.schedule[task._id].later.clear();
    }

    server.sentinlStore.schedule[task._id] = {};
    server.sentinlStore.schedule[task._id].task = task;

    let interval;
    if (task._source.trigger.schedule.later) {
      // https://bunkat.github.io/later/parsers.html#text
      interval = later.parse.text(task._source.trigger.schedule.later);
      server.sentinlStore.schedule[task._id].interval = task._source.trigger.schedule.later;
    } else if (task._source.trigger.schedule.interval % 1 === 0) {
      // max 60 seconds!
      interval = later.parse.recur().every(task._source.trigger.schedule.interval).second();
      server.sentinlStore.schedule[task._id].interval = task._source.trigger.schedule.interval;
    }

    /* Run Watcher in interval */
    server.sentinlStore.schedule[task._id].later = later.setInterval(() => watching(task), interval);
    server.log(['status', 'info', 'Sentinl', 'scheduler'],
      `server.sentinlStore.scheduled Watch: ${task._id} every ${server.sentinlStore.schedule[task._id].interval}`);
  };

  /**
  * Get all watchers and schedule them.
  *
  * @param {object} server - Kibana server instance.
  */
  function doalert(server) {
    server.log(['status', 'debug', 'Sentinl', 'scheduler'], 'Reloading Watchers...');
    server.log(['status', 'debug', 'Sentinl', 'scheduler', 'auth'], `Enabled: ${config.settings.authentication.enabled}`);
    if (config.settings.authentication.enabled) {
      server.log(['status', 'debug', 'Sentinl', 'scheduler', 'auth'], `Mode: ${config.settings.authentication.mode}`);
    }

    if (!server.sentinlStore.schedule) {
      server.sentinlStore.schedule = [];
    }

    client = getElasticsearchClient(server, config);
    watcher = new Watcher(client, config);

    watcher.getCount().then((resp) => {
      return watcher.getWatchers(resp.count).then((resp) => {
        /* Orphanize */
        try {
          removeOrphans(resp);
        } catch (err) {
          server.log(['status', 'debug', 'Sentinl', 'scheduler'], `Failed to remove orphans`);
        }

        /* Schedule watchers */
        _.each(resp.hits.hits, (hit) => scheduleWatcher(hit));
      });
    })
    .catch((error) => {
      if (error.statusCode === 404) {
        server.log(['status', 'info', 'Sentinl', 'scheduler'], 'No indices found, initializing.');
      } else {
        server.log(['status', 'error', 'Sentinl', 'scheduler'], `An error occurred while looking for data in indices: ${error}`);
      }
    });
  };

  return {
    doalert
  };

};
