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

import { get, has, forEach, difference, map, keys, isObject, isEmpty } from 'lodash';
import Promise from 'bluebird';
import later from 'later';
import doActions from './actions';
import getConfiguration from './get_configuration';
import Watcher from './classes/watcher';
import getElasticsearchClient from './get_elasticsearch_client';
import range from './validators/range';
import anomaly from './validators/anomaly';
import compare from './validators/compare';

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
    forEach(actions, (settings, name) => {
      if (has(settings, 'report')) filteredActions[name] = settings;
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
    forEach(actions, (settings, name) => {
      if (!has(settings, 'report')) filteredActions[name] = settings;
    });
    return filteredActions;
  };

  /**
  * Remove unused watchers watcher.
  *
  * @param {object} resp - ES response, watchers list.
  */
  function removeOrphans(resp) {
    let orphans = difference(forEach(keys(server.sentinlStore.schedule)), map(resp.hits.hits, '_id'));
    forEach(orphans, function (orphan) {
      server.log(['status', 'info', 'Sentinl', 'scheduler'], 'Deleting orphan watcher: ' + orphan);
      if (isObject(server.sentinlStore.schedule[orphan].later) && has(server.sentinlStore.schedule[orphan].later, 'clear')) {
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

    if (keys(actions).length) {
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
    let request = has(task._source, 'input.search.request') ? task._source.input.search.request : undefined;
    let condition = keys(task._source.condition).length ? task._source.condition : undefined;
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
    * Executing watcher search request, condition and transform.
    *
    * @param {object} watcher - watcher API object
    */
    function executeWatcher(watcher) {
      /* INPUT */
      watcher.search(method, request).then((payload) => {
        server.log(['status', 'info', 'Sentinl', 'scheduler', 'payload'], payload);

        if (!payload) {
          server.log(['status', 'debug', 'Sentinl', 'scheduler'], `Watcher ${task._source.uuid}` +
            ' malformed or missing key parameters!');
          return;
        }

        server.log(['status', 'debug', 'Sentinl', 'scheduler'], payload);

        /* CONDITION */

        // never execute actions
        if (condition.never) {
          return;
        }

        // script
        if (has(condition, 'script.script')) {
          try {
            if (!eval(condition.script.script)) { // eslint-disable-line no-eval
              return;
            }
          } catch (err) {
            server.log(['error', 'Sentinl', 'scheduler'], `Condition Error for ${task._id}: ${err}`);
          }
        }

        // compare
        if (condition.compare) {
          try {
            if (!compare.valid(payload, condition)) {
              return;
            }
          } catch (err) {
            server.log(['error', 'Sentinl', 'scheduler'], `Condition Error for ${task._id}: ${err}`);
          }
        }

        // find anomalies
        if (has(task._source, 'sentinl.condition.anomaly')) {
          try {
            payload = anomaly.check(payload, task._source.sentinl.condition);
          } catch (err) {
            server.log(['error', 'Sentinl', 'scheduler'], `Fail to apply anomaly validator ${task._id}: ${err}`);
          }
        }

        // find hits outside range
        if (has(task._source, 'sentinl.condition.range')) {
          try {
            payload = range.check(payload, task._source.sentinl.condition);
          } catch (err) {
            server.log(['error', 'Sentinl', 'scheduler'], `Fail to apply range validator ${task._id}: ${err}`);
          }
        }

        /* TRANSFORM */

        // validate JS script in transform
        if (has(transform, 'script.script')) {
          try {
            if (!eval(transform.script.script)) { // eslint-disable-line no-eval
              return;
            }
          } catch (err) {
            server.log(['error', 'Sentinl', 'scheduler'], `Transform Script Error for ${task._id}: ${err}`);
          }
        }

        // search in transform
        if (has(transform, 'search.request')) {
          watcher.search(method, transform.search.request)
            .then((payload) => {
              if (!payload) return;
              doActions(server, actions, payload, task._source);
            });
        } else {
          doActions(server, actions, payload, task._source);
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
    server.log(['status', 'debug', 'Sentinl', 'scheduler'], JSON.stringify(task, null, 2));

    if (!task._source.actions || isEmpty(task._source.actions)) {
      server.log(['status', 'debug', 'Sentinl', 'scheduler'], `Watcher ${task._source.uuid} has no actions.`);
      return;
    }

    let actions = [];

    if (task._source.report) {
      handleReports(task);
    }

    if (keys(getNonReportActions(task._source.actions)).length) {
      handleActions(task);
    }
  };

  /**
  * Schedule a watcher.
  *
  * @param {object} task - watcher configuration.
  */
  function scheduleWatcher(task) {
    if (has(server.sentinlStore.schedule, `[${task._id}].later`)) {
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
        forEach(resp.hits.hits, (hit) => scheduleWatcher(hit));
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
