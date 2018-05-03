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

import { stripObjectPropertiesByNameRegex } from '../lib/sentinl_helper';

import _ from 'lodash';
import { SpyModesRegistryProvider } from 'ui/registry/spy_modes';
import EMAILWATCHER from '../constants/email_watcher';

const dashboardSpyButton = function ($scope, config) {
  $scope.$bind('req', 'searchSource.history[searchSource.history.length - 1]');
  $scope.$watchMulti([
    'req',
    'req.started',
    'req.stopped',
    'searchSource'
  ], function () {
    if (!$scope.searchSource || !$scope.req) return;

    const req = $scope.req;
    const resp = $scope.req.resp;
    let indexPattern;
    $scope.indices = [];

    if (req.fetchParams && req.fetchParams.index) {
      const index = req.fetchParams.index.toString();
      $scope.indices.push(index);
    }

    $scope.createWatcher = function () {
      const watcherInterval = 'every 5 minutes';
      const watcherRange = 'now-1h';
      const alarm = {
        _index: 'watcher',
        _type: 'sentinl-watcher',
        _id: undefined,
        _new: 'true',
        _source: _.cloneDeep(EMAILWATCHER)
      };

      // Set Index
      alarm._source.input.search.request.index = $scope.indices;
      // Set Request Body
      if (req.fetchParams && req.fetchParams.body) {
        alarm._source.input.search.request.body = req.fetchParams.body;
      }
      // Patch Range
      if (indexPattern && indexPattern.getTimeField()) {
        if (!alarm._source.input.search.request.body.query.bool.must) {
          alarm._source.input.search.request.body.query.bool.must = [];
        }

        alarm._source.input.search.request.body.query.bool.must.push({
          range: {
            [indexPattern.timeFieldName]: {
              from: watcherRange
            }
          }
        });
      }

      stripObjectPropertiesByNameRegex(alarm._source.input.search, /\$.*/);
      window.localStorage.setItem('sentinl_saved_query', JSON.stringify(alarm));
    };

  });
};

// Spy Placement
SpyModesRegistryProvider.register(function () {
  return {
    display: 'Watcher',
    name: 'setalarm',
    order: 1000,
    link: dashboardSpyButton,
    template: require('plugins/sentinl/dashboard_spy_button/alarm_spy.html')
  };
});
