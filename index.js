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

import fs from 'fs';
import _ from 'lodash';

export default function (kibana) {
  let requirements = ['kibana', 'elasticsearch'];

  // Kibi: check if saved objects api exists.
  const savedObjectsAPI = `${kibana.rootDir}/src/kibi_plugins/saved_objects_api`;
  if (fs.existsSync(savedObjectsAPI)) {
    requirements.push('saved_objects_api');

    // Kibi: import saved objects api related libs.
    const pathForLibs = `${kibana.rootDir}/plugins/sentinl/public/app.js`;
    const libsToImport = [
      'import \'./services/saved_watchers/index\';',
      'import \'./services/saved_users/index\';',
      'import \'./services/saved_scripts/index\';'
    ];

    const data = fs.readFileSync(pathForLibs);
    const libs = data.toString().trim().split('\n');

    _.forEach(_.difference(libsToImport, libs), (lib) => {
      fs.appendFileSync(pathForLibs, `${lib}\n`);
    });
  }

  return new kibana.Plugin({
    require: requirements,
    uiExports: {
      spyModes: ['plugins/sentinl/dashboard_spy_button/alarm_button'],
      app: {
        title: 'Sentinl',
        description: 'Kibana Alert App for Elasticsearch',
        main: 'plugins/sentinl/app',
        icon: 'plugins/sentinl/sentinl.svg',
        injectVars: function (server, options) {
          var config = server.config();
          return {
            kbnIndex: config.get('kibana.index'),
            esShardTimeout: config.get('elasticsearch.shardTimeout'),
            esApiVersion: config.get('elasticsearch.apiVersion')
          };
        }
      }
    },
    config: function (Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
        es: Joi.object({
          host: Joi.string().default('localhost'),
          port: Joi.number().default(9200),
          timefield: Joi.string().default('@timestamp'),
          default_index: Joi.string().default('watcher'),
          type: Joi.string().default('sentinl-watcher'),
          alarm_index: Joi.string().default('watcher_alarms'),
          alarm_type: Joi.string().default('alarm'),
          script_type: Joi.string().default('sentinl-script'),
          watcher: Joi.object({
            trigger: Joi.number().default(3),
            throttle: Joi.number().default(1),
            recover: Joi.number().default(15000)
          }).default(),
        }).default(),
        sentinl: Joi.object({
          history: Joi.number().default(20),
          results: Joi.number().default(50),
          scriptResults: Joi.number().default(50)
        }).default(),
        settings: Joi.object({
          authentication: Joi.object({
            enabled: Joi.boolean().default(false),
            https: Joi.boolean().default(true),
            verify_certificate: Joi.boolean().default(false),
            path_to_pem: Joi.string(),
            admin_username: Joi.string().default('admin'),
            admin_sha: Joi.string().default('6859a748bc07b49ae761f5734db66848'),
            mode: Joi.string().default('basic'),
            user_index: Joi.string().default('sentinl_users'),
            user_type: Joi.string().default('user'),
            encryption: Joi.object({
              algorithm: Joi.string().default('AES-256-CBC'),
              key: Joi.string().default('b9726b04608ac48ecb0b6918214ade54'),
              iv_length: Joi.number().default(16)
            }).default(),
          }).default(),
          email: Joi.object({
            active: Joi.boolean().default(false),
            user: Joi.string(),
            password: Joi.string(),
            host: Joi.string(),
            ssl: Joi.boolean().default(true),
            timeout: Joi.number().default(5000)
          }).default(),
          slack: Joi.object({
            active: Joi.boolean().default(false),
            username: Joi.string(),
            hook: Joi.string(),
            channel: Joi.string(),
          }).default(),
          webhook: Joi.object({
            active: Joi.boolean().default(false),
            use_https: Joi.boolean().default(false),
            method: Joi.string().default('POST'),
            host: Joi.string(),
            port: Joi.number(),
            path: Joi.string().default(':/{{payload.watcher_id}'),
            body: Joi.string().default('{{payload.watcher_id}}{payload.hits.total}}')
          }).default(),
          report: Joi.object({
            search_guard: Joi.boolean().default(false),
            simple_authentication: Joi.boolean().default(false),
            active: Joi.boolean().default(false),
            phantomjs_path: Joi.string().default(undefined),
            tmp_path: Joi.string().default('/tmp/')
          }).default(),
          pushapps: Joi.object({
            active: Joi.boolean().default(false),
            api_key: Joi.string()
          }).default()
        }).default()
      }).default();
    },
    init: require('./init.js')
  });
};
