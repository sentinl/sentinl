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
/*global later:false*/
import 'later/later';
import { get, once, has, forEach, includes } from 'lodash';
import url from 'url';
import path from 'path';
import getScheduler from './server/lib/scheduler';
import initIndices from './server/lib/init_indices';
import getConfiguration from './server/lib/get_configuration';
import { existsSync } from 'fs';
import Log from './server/lib/log';
import getChromePath from './server/lib/actions/report/get_chrome_path';
import { isKibi } from './server/lib/helpers';

import sentinlRoutes from './server/routes/routes';
import watcherRoutes from './server/routes/watcher';
import alarmRoutes from './server/routes/alarm';
import userRoutes from './server/routes/user';
import kableRoutes from './server/routes/kable';
import timelionRoutes from './server/routes/timelion';
import sqlRoutes from './server/routes/sql';

const mappings = {
  alarm: require('./server/mappings/alarm_index'),
  watcher: require('./server/mappings/sentinl')
};

const siren = {
  schema: {
    watch: require('./server/lib/siren/saved_objects/watch'),
    script: require('./server/lib/siren/saved_objects/script'),
    user: require('./server/lib/siren/saved_objects/user'),
  },
};

async function prepareIndices(server, log, config, mappings) {
  try {
    let resp;
    if (config.es.default_index) {
      resp = await initIndices.createIndex({
        server,
        config,
        index: config.es.default_index,
        mappings: mappings.watcher
      });
      log.debug(`create index ${config.es.default_index}: ${JSON.stringify(resp)}`);
    }

    resp = await initIndices.createIndex({
      server,
      config,
      index: config.es.alarm_index,
      mappings: mappings.alarm,
      alarmIndex: true
    });
    log.debug(`create index ${config.es.alarm_index}: ${JSON.stringify(resp)}`);
  } catch (err) {
    throw new Error('init indices: ' + err.toString());
  }
}

/**
* Initializes Sentinl app.
*
* @param {object} server - Kibana server.
*/
const init = once(function (server) {
  const config = getConfiguration(server);
  const scheduler = getScheduler(server);
  const log = new Log(config.app_name, server, 'init');

  if (isKibi(server)) {
    const Migration1 = require('./lib/migrations/migrations_5/migration_1');
    const migrations = [
      Migration1
    ];
    server.expose('getMigrations', () => migrations);
  }

  if (existsSync('/etc/sentinl.json')) {
    server.plugins.sentinl.status.red('Setting configuration values in /etc/sentinl.json is not supported anymore, please copy ' +
                                      'your Sentinl configuration values to config/kibi.yml or config/kibana.yml, ' +
                                      'remove /etc/sentinl.json and restart.');
    return;
  }

  log.info('initializing ...');

  server.injectUiAppVars('sentinl', () => {
    const config = server.config();
    return {
      sentinlConfig: {
        appName: config.get('sentinl.app_name'),
        es: {
          timezone: config.get('sentinl.es.timezone'),
        },
        wizard: {
          condition: {
            queryType: config.get('sentinl.settings.wizard.condition.query_type'),
            scheduleType: config.get('sentinl.settings.wizard.condition.schedule_type'),
            over: config.get('sentinl.settings.wizard.condition.over'),
            last: config.get('sentinl.settings.wizard.condition.last'),
            interval: config.get('sentinl.settings.wizard.condition.interval'),
          },
        },
      }
    };
  });

  try {
    if (config.settings.report.puppeteer.browser_path) {
      server.expose('chrome_path', config.settings.report.puppeteer.browser_path);
    } else {
      server.expose('chrome_path', getChromePath());
    }
    log.info('Chrome bin found at: ' + server.plugins.sentinl.chrome_path);
  } catch (err) {
    log.error('setting puppeteer report engine: ' + err.toString());
  }

  // Object to hold different runtime values.
  server.sentinlStore = {
    schedule: {}
  };

  // Load Sentinl routes.
  sentinlRoutes(server);
  watcherRoutes(server);
  alarmRoutes(server);
  userRoutes(server);
  kableRoutes(server);
  timelionRoutes(server);
  sqlRoutes(server);

  // auto detect elasticsearch host, protocol and port
  //#################################################
  config.es.hosts = [];
  /*if(server.config().get('elasticsearch.hosts')) {
    server.config().get('elasticsearch.hosts').forEach(host => {
      const hostUrl = url.parse(host);
      config.es.hosts.push({
        host: hostUrl.hostname,
        port: hostUrl.port,
        protocol: hostUrl.protocol.substring(0, hostUrl.protocol.length - 1)
      });
    });
  }*/
  config.es.hosts.push(
    {
      host: 'localhost',
      port: '9200',
      protocol: 'http'
    }
  );

  if (config.settings.authentication.enabled && config.es.protocol === 'https') {
    config.settings.authentication.https = true;
  }

  config.settings.authentication.user_index = server.config().get('kibana.index');

  if (server.plugins.saved_objects_api) { // Siren: savedObjectsAPI.
    forEach(siren.schema, (schema) => {
      server.plugins.saved_objects_api.registerType(schema);
    });
  }

  (async () => {
    try {
      await prepareIndices(server, log, config, mappings);

      // Start cluster
      let node;
      if (config.settings.cluster.enabled) {
        const GunMaster = require('gun-master');
        node = new GunMaster(config.settings.cluster);
        node.run().catch(function (err) {
          log.error(`fail to run cluster node, ${err}`);
        });
      }

      if (isKibi(server)) {
        require('./server/lib/load_watcher_templates')(server, config)
          .then(() => log.info('Loaded sample scripts'))
          .catch(error => log.error(error));
      }

      // Schedule watchers execution.
      const sched = later.parse.recur().on(25, 55).second();
      const handleWatchers = later.setInterval(() => scheduler.doalert(server, node), sched);
    } catch (err) {
      log.error('start: ' + err.toString());
    }
  })();
});

export default function (server, options) {
  if (server.plugins.elasticsearch.status.state === 'green') {
    init(server);
  } else {
    server.plugins.elasticsearch.status.on('change', () => {
      if (server.plugins.elasticsearch.status.state === 'green') {
        init(server);
      }
    });
  }
};
