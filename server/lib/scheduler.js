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

import { has, forEach, difference, map, keys, isObject, isEmpty } from 'lodash';
import later from 'later';
import getConfiguration from './get_configuration';
import Watcher from './classes/watcher';

/**
* Schedules and executes watchers in background
*/
export default function Scheduler(server) {

  const config = getConfiguration(server);

  let watcher;
  let client;

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
      watcher.execute(task, 'report')
      .then(function (response) {
        server.log(['status', 'info', 'Sentinl', 'watcher'], `SUCCESS! Watcher has been executed: ${response.task.id}.`);
        if (response.message) {
          server.log(['status', 'info', 'Sentinl', 'watcher'], response.message);
        }
      })
      .catch(function (error) {
        server.log(['status', 'error', 'Sentinl', 'watcher'], `Watcher ${task._id}: ${error}`);
      });
    }

    if (keys(watcher.getNonReportActions(task._source.actions)).length) {
      watcher.execute(task)
      .then(function (response) {
        server.log(['status', 'info', 'Sentinl', 'watcher'], `SUCCESS! Watcher has been executed: ${response.task.id}.`);
        if (response.message) {
          server.log(['status', 'info', 'Sentinl', 'watcher'], response.message);
        }
      })
      .catch(function (error) {
        server.log(['status', 'error', 'Sentinl', 'watcher'], `Watcher ${task._id}: ${error}`);
      });
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

    watcher = new Watcher(server);

    watcher.getCount()
    .then(function (resp) {
      return watcher.getWatchers(resp.count)
      .then(function (resp) {
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
