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

import getElasticsearchClient from './get_elasticsearch_client';
import Log from './log';

const updateMappingTypes = function ({ mappings, watcherType, scriptType, userType, alarmType }) {
  const newMappings = {};

  if (watcherType && mappings['sentinl-watcher']) {
    newMappings[watcherType] = mappings['sentinl-watcher'];
  }
  if (scriptType && mappings['sentinl-script']) {
    newMappings[scriptType] = mappings['sentinl-script'];
  }
  if (userType && mappings['sentinl-user']) {
    newMappings[userType] = mappings['sentinl-user'];
  }
  if (alarmType && mappings['sentinl-alarm']) {
    newMappings[alarmType] = mappings['sentinl-alarm'];
  }

  return newMappings;
};

/**
* Creates index with provided mapping.
*
* @param {object} server - Kibana server.
* @param {object} config - Sentinl configuration.
* @param {string} index - ES index name.
* @param {object} mappings - Mapping to apply.
*/
const createIndex = async function ({ server, config, index, mappings, alarmIndex}) {
  const log = new Log(config.app_name, server, 'init_indices');
  log.info(`checking ${index} index ...`);

  try {
    const client = getElasticsearchClient({server, config});
    const exists = await client.indices.exists({ index });
    if (exists) {
      log.debug(`index ${index} exists`);
      return null;
    }

    log.info(`creating ${index} index ...`);

    let body = {
      mappings: {
        [config.es.default_type]: {
          properties: updateMappingTypes({
            mappings,
            watcherType: config.es.watcher_type,
            userType: config.es.user_type,
            alarmType: config.es.alarm_type,
            scriptType: config.es.script_type,
          })
        }
      }
    };

    if (alarmIndex) {
      body = {
        mappings: {
          [config.es.alarm_type]: mappings
        }
      };

      const patternAttributeName = (await client.info()).version.number.startsWith(5) ? 'template' : 'index_patterns';
      await client.indices.putTemplate({
        name: 'sentinl_watcher_alarms',
        body: {
          [patternAttributeName]: config.es.alarm_index + '*',
          mappings: body.mappings
        }
      });
    }

    return await client.indices.create({ index, body });
  } catch (err) {
    throw new Error('create index: ' + err.toString());
  }
};

module.exports = {
  createIndex: createIndex,
};
