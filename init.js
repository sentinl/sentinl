/*
 * Copyright 2016, Lorenzo Mangani (lorenzo.mangani@gmail.com)
 * Copyright 2015, Rao Chenlin (rao.chenlin@gmail.com)
 *
 * This file is part of KaaE (http://github.com/elasticfence/kaae)
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
import _ from 'lodash';
import mustache from 'mustache';
import masterRoute from './server/routes/routes';
import scheduler from './server/lib/scheduler';
import helpers from './server/lib/helpers';
import $window from 'jquery';

module.exports = function (server, options) {

      var debug = false;
      var config = require('./server/lib/config');

      var $ = require('jquery');
      server.log(['status', 'info', 'KaaE'], 'KaaE Initializing');
      server.kaaeStore = [];
      masterRoute(server);

      // Create KaaE Indices, if required
      helpers.createKaaeIndex(server,config);
      helpers.createKaaeAlarmIndex(server,config);

      /* Bird Watching and Duck Hunting */
      var client = server.plugins.elasticsearch.client;
      var sched = later.parse.recur().on(25,55).second();;
      var t = later.setInterval(function(){ scheduler.doalert(server,client) }, sched);
      /* run NOW, plus later */
      scheduler.doalert(server,client);
};
