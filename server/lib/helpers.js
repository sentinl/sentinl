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
import _ from 'lodash';

const createIndex = function (server, config, indexName, docType, mappings, mode) {
  server.log(['status', 'info', 'Sentinl'], `Checking ${indexName} index ...`);
  if (!server.plugins.elasticsearch) {
    server.log(['status', 'error', 'Sentinl'], 'Elasticsearch client not available, retrying in 5s');
    tryCreate(server, config, indexName, docType, mappings, mode);
    return;
  }

  // if doc type is not default
  if (docType !== _.keys(mappings.mappings)[0]) {
    const body = mappings.mappings.user;
    delete mappings.mappings.user;
    mappings.mappings[docType] = body;
  }

  if (mode === 'alarm') {
    mappings.template = `${config.es.alarm_index}-*`;
  }

  const client = getElasticsearchClient(server, config);

  client.indices.exists({
    index: indexName
  })
  .then((exists) => {
    if (exists === true) {
      server.log(['status', 'debug', 'Sentinl'], `Index ${indexName} exists!`);
      return;
    }
    server.log(['status', 'info', 'Sentinl'], `Creating ${indexName} index ...`);

    client.indices.create({
      index: indexName,
      body: mappings
    })
    .then(function (resp) {
      server.log(['status', 'debug', 'Sentinl'], `Index ${indexName} response`, resp);
    }).catch((err) => server.log(['status', 'error', 'Sentinl'], err.message));
  })
  .catch((error) => server.log(['status', 'error', 'Sentinl'], `Failed to check if core index exists: ${error}`));
};

let tryCount = 0;
function tryCreate(server, config, indexName, docType, mappings, mode) {
  if (tryCount > 5) {
    server.log(['status', 'warning', 'Sentinl'], 'Failed creating Indices mapping!');
    return;
  }
  setTimeout(createIndex(server, config, indexName, docType, mappings, mode), 5000);
  tryCount++;
}

module.exports = {
  createIndex: createIndex
};
