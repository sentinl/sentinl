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
import Log from './log';

/**
* Schedules and executes watchers in background
*/
export default function Scheduler(server) {

  const config = getConfiguration(server);
  const log = new Log(config.app_name, server, 'scheduler');

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
  function watching(task) {
    if (!task._source || task._source.disable) {
      log.debug(`do not execute disabled watcher: ${task._id}`);
      return;
    }

    log.info(`executing watcher: ${task._id}`);
    log.debug('watcher', task);

    if (!task._source.actions || isEmpty(task._source.actions)) {
      log.warning(`watcher has no actions: ${task._source.uuid}`);
      return;
    }

    watcher.execute(task).then(function (resp) {
      log.info(`watcher has been executed successfully: ${resp.task.id}`);
      if (resp.message) {
        log.info(`fail to execute watcher: ${task._id}, ${resp.message}`);
      }
    }).catch(function (error) {
      log.error(`fail to execute watcher: ${task._id}, ${error}`);
    });
  };

  /**
  * Schedule a watcher.
  *
  * @param {object} task - watcher configuration.
  */
  function scheduleWatcher(task, config) {
    if (has(server.sentinlStore.schedule, `[${task._id}].later`)) {
      log.debug(`clearing watcher: ${task._id}`);
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

  function alert(server) {
    log.debug('reloading watchers...');
    log.info(`auth enabled: ${config.settings.authentication.enabled}`);
    if (config.settings.authentication.enabled) {
      log.info(`auth mode: ${config.settings.authentication.mode}`);
    }

    if (!server.sentinlStore.schedule) {
      server.sentinlStore.schedule = [];
    }

    watcher = new Watcher(server);

    watcher.getCount().then(function (resp) {
      return watcher.getWatchers(resp.count).then(function (resp) {
        /* Orphanize */
        try {
          removeOrphans(resp);
        } catch (err) {
          log.error('failed to remove orphans');
        }
        /* Schedule watchers */
        forEach(resp.hits.hits, function (hit) {
          scheduleWatcher(hit, config);
        });
      });
    }).catch((error) => {
      if (error.statusCode === 404) {
        log.warning('no Elasticsearch indices found, initializing...');
      } else {
        log.error(`looking for data in Elasticsearch indices: ${error}`);
      }
    });
  }

  /**
  * Get all watchers and schedule them.
  *
  * @param {object} server - Kibana server instance.
  */
  function doalert(server, node = null) {
    if (config.settings.cluster.enabled && node) {
      return node.getMaster().then((master) => {
        if (master.id === config.settings.cluster.host.id || !master.id) {
          log.info('cluster master node, executing watchers');
          alert(server);
        } else {
          log.info('cluster slave node, do not execute watchers');
        }
      });
    } else {
      log.info('cluster disabled');
      alert(server);
    }
  };

  return {
    doalert
  };
};
