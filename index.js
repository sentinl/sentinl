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

export default function (kibana) {
  return new kibana.Plugin({
    require: ['kibana', 'elasticsearch'],
    uiExports: {
      spyModes: ['plugins/sentinl/button/alarm_button'],
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
          timefield: Joi.string().default('@timestamp'),
          default_index: Joi.string().default('watcher'),
          type: Joi.string().default('watch'),
          alarm_index: Joi.string().default('watcher_alarms')
        }).default(),
        sentinl: Joi.object({
          history: Joi.number().default(20),
          results: Joi.number().default(50),
          scriptResults: Joi.number().default(50)
        }).default(),
        settings: Joi.object({
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
            method: Joi.string().default('POST'),
            host: Joi.string(),
            port: Joi.number(),
            path: Joi.string().default(':/{{payload.watcher_id}'),
            body: Joi.string().default('{{payload.watcher_id}}{payload.hits.total}}')
          }).default(),
          report: Joi.object({
            active: Joi.boolean().default(false),
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
