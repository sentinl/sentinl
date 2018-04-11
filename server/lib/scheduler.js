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

import { has, forEach, difference, map, keys, isObject, isEmpty, assign } from 'lodash';
import later from 'later';
import getConfiguration from './get_configuration';
import WatcherHandler from './watcher_handler';
import Log from './log';

/**
* Schedules and executes watchers in background
*/
export default function Scheduler(server) {

  const config = getConfiguration(server);
  const log = new Log(config.app_name, server, 'scheduler');

  let watcherHandler;

  /**
  * Remove unused watchers watcher.
  *
  * @param {array} watchers
  */
  function removeOrphans(watchers) {
    let orphans = difference(forEach(keys(server.sentinlStore.schedule)), map(watchers, '_id'));
    forEach(orphans, function (orphan) {
      log.debug('deleting orphan watchers: ' + orphan);
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
  async function watching(task) {
    const prefix = `watcher ${task._id}`;

    if (!task._source || task._source.disable) {
      log.debug(prefix, 'do not execute disabled watcher');
      return;
    }

    log.info(prefix, 'executing');

    if (!task._source.actions || isEmpty(task._source.actions)) {
      log.warning(prefix, 'watcher has no actions');
      return;
    }

    try {
      const resp = await watcherHandler.execute(task);
      if (!resp.ok) {
        log.error(`${prefix}: fail to execute`, resp);
      }
    } catch (err) {
      log.error(`${prefix}: fail to execute`, err.message);
    }
  };

  /**
  * Schedule a watcher.
  *
  * @param {object} task - watcher configuration.
  */
  function scheduleWatcher(task) {
    if (has(server.sentinlStore.schedule, `[${task._id}].later`)) {
      log.debug(`clearing watcher ${task._id}`);
      server.sentinlStore.schedule[task._id].later.clear();
    }
    server.sentinlStore.schedule[task._id] = {task};

    if (config.es.watcher.schedule_timezone === 'local') {
      later.date.localTime();
    }

    // https://bunkat.github.io/later/parsers.html#text
    const schedule = later.parse.text(task._source.trigger.schedule.later);
    server.sentinlStore.schedule[task._id].schedule = task._source.trigger.schedule.later;

    /* Run Watcher in schedule */
    server.sentinlStore.schedule[task._id].later = later.setInterval(function () {
      watching(task);
    }, schedule);

    log.info(`scheduled watcher ${task._id}, to run every ${server.sentinlStore.schedule[task._id].schedule}`);
  };

  function putPropertiesUnderSource(watchers) {
    watchers.forEach(function (w) {
      if (w._source[config.es.watcher_type]) {
        assign(w._source, w._source[config.es.watcher_type]);
        delete w._source[config.es.watcher_type];
      }
    });
    return watchers;
  }

  async function alert(server) {
    log.debug('reloading watchers...');
    log.debug(`auth enabled: ${config.settings.authentication.enabled}`);

    if (!server.sentinlStore.schedule) {
      server.sentinlStore.schedule = [];
    }

    watcherHandler = new WatcherHandler(server);

    try {
      let resp = await watcherHandler.getCount();
      resp = await watcherHandler.getWatchers(resp.count);

      let tasks = resp.hits.hits;
      if (tasks.length) {
        tasks = putPropertiesUnderSource(tasks);

        /* Orphanize */
        try {
          removeOrphans(tasks);
        } catch (err) {
          log.error('fail to remove orphans', err);
        }

        /* Schedule watchers */
        tasks.forEach(function (t) {
          scheduleWatcher(t);
        });
      } else {
        log.debug('no watchers found');
      }
    } catch (err) {
      log.error('fail to schedule watchers', err);
    }
  }

  /**
  * Get all watchers and schedule them.
  *
  * @param {object} server - Kibana server instance.
  */
  async function doalert(server, node = null) {
    if (config.settings.cluster.enabled && node) {
      try {
        const master = await node.getMaster();
        if (master.id === config.settings.cluster.host.id || !master.id) {
          log.info('cluster master node, executing watchers');
          alert(server);
        } else {
          log.info('cluster slave node, do not execute watchers');
        }
      } catch (err) {
        log.error('fail to get cluster master node', err);
      }
    } else {
      log.debug('cluster disabled');
      alert(server);
    }
  };

  return {
    doalert
  };
};
