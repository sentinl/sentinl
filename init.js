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

import later from 'later';
import { once, has, forEach } from 'lodash';
import url from 'url';
import masterRoute from './server/routes/routes';
import getScheduler from './server/lib/scheduler';
import initIndices from './server/lib/initIndices';
import getElasticsearchClient from './server/lib/get_elasticsearch_client';
import getConfiguration from './server/lib/get_configuration';
import fs from 'fs';
import Log from './server/lib/log';

const mappings = {
  alarm: require('./server/mappings/alarm_index'),
};

const siren = {
  schema: {
    watch: require('./server/lib/siren/saved_objects/watch'),
    script: require('./server/lib/siren/saved_objects/script'),
    user: require('./server/lib/siren/saved_objects/user'),
  },
  SavedObjectsAPIMiddleware: require('./server/lib/siren/saved_objects_api'),
};

/**
* Initializes Sentinl app.
*
* @param {object} server - Kibana server.
*/
const init = once(function (server) {
  const config = getConfiguration(server);
  const scheduler = getScheduler(server);
  const log = new Log(config.app_name, server, 'init');

  if (fs.existsSync('/etc/sentinl.json')) {
    server.plugins.sentinl.status.red('Setting configuration values in /etc/sentinl.json is not supported anymore, please copy ' +
                                      'your Sentinl configuration values to config/kibi.yml or config/kibana.yml, ' +
                                      'remove /etc/sentinl.json and restart.');
    return;
  }

  log.info('initializing ...');

  // Object to hold different runtime values.
  server.sentinlStore = {
    schedule: {}
  };

  // Load Sentinl routes.
  masterRoute(server);

  // auto detect elasticsearch host, protocol and port
  const esUrl = url.parse(server.config().get('elasticsearch.url'));
  config.es.host = esUrl.hostname;
  config.es.port = +esUrl.port;
  config.es.protocol = esUrl.protocol.substring(0, esUrl.protocol.length - 1);

  if (config.settings.authentication.enabled && config.es.protocol === 'https') {
    config.settings.authentication.https = true;
  }

  config.es.default_index = server.config().get('kibana.index');
  config.settings.authentication.user_index = server.config().get('kibana.index');

  if (server.plugins.saved_objects_api) { // Siren: savedObjectsAPI.
    forEach(siren.schema, (schema) => {
      server.plugins.saved_objects_api.registerType(schema);
    });

    const middleware = new siren.SavedObjectsAPIMiddleware(server);
    server.plugins.saved_objects_api.registerMiddleware(middleware);
  }

  initIndices.createIndex(server, config, config.es.alarm_index, config.es.alarm_type, mappings.alarm, 'alarm');

  // Start cluster
  let node;
  if (config.settings.cluster.enabled) {
    const GunMaster = require('gun-master');
    node = new GunMaster(config.settings.cluster);
    node.run().catch(function (err) {
      log.error(`fail to run cluster node, ${err}`);
    });
  }

  // Schedule watchers execution.
  const sched = later.parse.recur().on(25,55).second();
  const handleWatchers = later.setInterval(() => scheduler.doalert(server, node), sched);
});

export default function (server, options) {

  let status = server.plugins.elasticsearch.status;
  if (status && status.state === 'green') {
    init(server);
  } else {
    status.on('change', () => {
      if (server.plugins.elasticsearch.status.state === 'green') {
        init(server);
      }
    });
  }

};
