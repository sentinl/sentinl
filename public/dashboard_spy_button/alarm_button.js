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
import EMAILWATCHERDASHBOARD from '../constants/email_watcher_dashboard';
import rison from 'rison';

const timeFractions = [60,60,24,7]; // 60s/min, 60m/hr, 24hr/day, 7day/week
const timeUnits = ['s','m','h','d','w']; // second, minute, hour, day, week
/**
  * Get UTC array
  * Returns an array with values in each dedicated time unit
  *
  * @param {integer} baseValue
  * @param {array} timeFractions relation between time types e.g. timeFractions = [60,60,24,7]; // 60s/min, 60m/hr, 24hr/day, 7day/week
  */
let getUTCArray = (baseValue, timeFractions) =>  {
  let timeData = [baseValue];
  for (let i = 0; i < timeFractions.length; i++) {
    timeData.push(parseInt(timeData[i] / timeFractions[i]));
    timeData[i] = timeData[i] % timeFractions[i];
  };
  return timeData;
};

const _getDashbaordUrl = function () {
  const [urlBase, query] = window.location.href.split('?', 2);
  let queryParameters = {};
  query.split('&').forEach(parameter => {
    const [key, value] = parameter.split('=');
    queryParameters[key] = (value.startsWith('h@')) ? JSON.parse(sessionStorage[value]) : rison.decode(value);
  });

  return urlBase + '?' + _.map(queryParameters, (value, key) => `${key}=${rison.encode(value)}`).join('&');
};

const dashboardSpyButton = function ($scope) {
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
      const index = req.fetchParams.index.title || req.fetchParams.index.toString();
      $scope.indices.push(index);
    }

    $scope.createWatcher = function () {
      const watcherRange = 'now-1h';
      const alarm = _.cloneDeep(EMAILWATCHERDASHBOARD);
      alarm.spy = true;
      alarm.dashboard_link = _getDashbaordUrl();

      // Set Index
      alarm.input.search.request.index = $scope.indices;
      // Set Request Body
      if (req.fetchParams && req.fetchParams.body) {
        alarm.input.search.request.body = req.fetchParams.body;
      }
      // Patch Range
      if (indexPattern && indexPattern.getTimeField()) {
        if (!alarm.input.search.request.body.query.bool.must) {
          alarm.input.search.request.body.query.bool.must = [];
        }

        alarm.input.search.request.body.query.bool.must.push({
          range: {
            [indexPattern.timeFieldName]: {
              from: watcherRange
            }
          }
        });
      }
      if (alarm.input.search.request.body.query.bool.must) {
        let must = alarm.input.search.request.body.query.bool.must;
        var newTimestamp = {};
        for (var key in must) {
          if (must.hasOwnProperty(key) && must[key].range) {
            if (must[key].range['@timestamp']) {
              if (must[key].range['@timestamp'].format) {
                if (_.includes(must[key].range['@timestamp'].format, 'epoch_millis')) {
                  let start = new Date(must[key].range['@timestamp'].gte);
                  let end = new Date(must[key].range['@timestamp'].lte);
                  let diff = new Date(end - start).getTime() / 1000; // UTC timestamp in seconds
                  let timeArray = getUTCArray(diff,timeFractions);
                  let largestUnit = 0;
                  for (let i = 0; i < timeArray.length; ++i) {
                    //[s,min,hour,day,week] == input array [60,60,24,7]
                    largestUnit = i;
                    if (timeArray[i] !== 0) {
                      break;
                    }
                  }
                  let relativeTime = timeArray[largestUnit];// works as start time in the right unit
                  if (largestUnit <= timeArray.length) {
                    for (let k = largestUnit + 1; k < timeArray.length; ++k) {
                      let timeSize = 1;
                      if (timeArray[k] !== 0) {
                        for (let g = k; g > largestUnit; --g) {
                          timeSize *= timeFractions[g - 1];
                        }
                      }
                      relativeTime += timeArray[k] * timeSize;
                    }
                  }
                  newTimestamp.gte = 'now-' + relativeTime + timeUnits[largestUnit] + '/' + timeUnits[largestUnit];
                  newTimestamp.lte = 'now/' + timeUnits[largestUnit];
                  alarm.input.search.request.body.query.bool.must[key].range['@timestamp'] = newTimestamp;
                }
              }
            }
          }
        }
      }

      stripObjectPropertiesByNameRegex(alarm.input.search, /\$.*/);
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
