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

/**
* Puts mapping for a new type in an existent index.
*
* @param {object} server - Kibana server.
* @param {object} config - Sentinl configuration.
* @param {string} indexName - ES index name.
* @param {string} docType - New document type.
* @param {object} mappings - Mapping to apply.
*/
const putMapping = function (server, config, indexName, docType, mappings) {
  const log = new Log(config.app_name, server, 'init_indices');

  log.info(`checking ${indexName} index type ${docType}...`);
  if (!server.plugins.elasticsearch) {
    log.error('Elasticsearch client is not available, retry in 5 sec');
    retryPutMapping(server, config, indexName, docType, mappings);
    return;
  }

  const client = getElasticsearchClient(server, config);

  client.indices.putMapping({
    index: indexName,
    type: docType,
    body: mappings
  }).then(function (resp) {
    log.debug(`index ${indexName} response: ${resp}`);
  }).catch((err) => log.error(err.message));
};

/**
* Creates index with provided mapping.
*
* @param {object} server - Kibana server.
* @param {object} config - Sentinl configuration.
* @param {string} indexName - ES index name.
* @param {string} docType - New document type.
* @param {object} mappings - Mapping to apply.
* @param {string} mode - alarm template.
*/
const createIndex = function (server, config, indexName, docType, mappings, mode) {
  const log = new Log(config.app_name, server, 'init_indices');

  log.info(`checking ${indexName} index ...`);
  if (!server.plugins.elasticsearch) {
    log.error('Elasticsearch client is not available, retry in 5 sec');
    retryCreateIndex(server, config, indexName, docType, mappings, mode);
    return;
  }

  const client = getElasticsearchClient(server, config);

  if (mode === 'alarm') {
    mappings = {
      template: `${config.es.alarm_index}-*`,
      'mappings': {
        [config.es.alarm_type]: mappings
      }
    };
  } else {
    mappings = {
      'mappings': {
        [config.es.default_type]: mappings
      }
    };
  }

  client.indices.exists({
    index: indexName
  }).then((exists) => {
    if (exists === true) {
      log.debug(`index ${indexName} exists`);
      return;
    }
    log.info(`creating ${indexName} index ...`);

    return client.indices.create({
      index: indexName,
      body: mappings
    }).then(function (resp) {
      log.debug(`index ${indexName} response: ${resp}`);
    });
  }).catch((error) => log.error(`fail to check if core index exists: ${error}`));
};

let retryCreateIndexCount = 0;
function retryCreateIndex(server, config, indexName, docType, mappings, mode) {
  const log = new Log(config.app_name, server, 'init_indices');

  if (retryCreateIndexCount > 5) {
    log.error(`faile to create index mapping for ${indexName}`);
    return;
  }
  setTimeout(createIndex(server, config, indexName, docType, mappings, mode), 5000);
  retryCreateIndexCount++;
}

let retryPutMappingCount = 0;
function retryPutMapping(server, config, indexName, docType, mappings) {
  const log = new Log(config.app_name, server, 'init_indices');

  if (retryPutMappingCount > 5) {
    log.error(`fail to put mapping for ${indexName}/${docType}`);
    return;
  }
  setTimeout(createIndex(server, config, indexName, docType, mappings), 5000);
  retryPutMappingCount++;
}

module.exports = {
  createIndex: createIndex,
  putMapping: putMapping
};
