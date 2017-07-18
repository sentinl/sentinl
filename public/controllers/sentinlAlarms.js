/* global angular */
import _ from 'lodash';
import moment from 'moment';
import uiChrome from 'ui/chrome';

import confirmMessage from '../templates/confirm-message.html';
import { app } from '../app.module';

app.controller('sentinlAlarms', function ($rootScope, $scope, $route, $interval,
  $timeout, $injector, timefilter, Private, createNotifier, $window, $modal, navMenu,
  globalNavState, sentinlService) {
  $scope.title = 'Sentinl: Alarms';
  $scope.description = 'Kibana Alert App for Elasticsearch';

  const notify = createNotifier({
    location: 'Sentinl Alarms'
  });

  timefilter.enabled = true;

  $scope.topNavMenu = navMenu.getTopNav('alarms');
  $scope.tabsMenu = navMenu.getTabs('alarms');
  navMenu.setKbnLogo(globalNavState.isOpen());
  $scope.$on('globalNavState:change', () => navMenu.setKbnLogo(globalNavState.isOpen()));

  /* First Boot */

  $scope.elasticAlarms = [];
  $scope.timeInterval = timefilter.time;

  const getAlarms = function (interval) {
    sentinlService.updateFilter(interval)
    .then((resp) => {
      return sentinlService.listAlarms()
            .then((resp) => $scope.elasticAlarms = resp.data.hits.hits);
    })
    .catch(notify.error);
  };

  getAlarms($scope.timeInterval);

  $scope.$listen(timefilter, 'fetch', (res) => {
    getAlarms($scope.timeInterval);
  });

  /* Listen for refreshInterval changes */

  $rootScope.$watchCollection('timefilter.time', function (newvar, oldvar) {
    if (newvar === oldvar) { return; }
    let timeInterval = _.get($rootScope, 'timefilter.time');
    if (timeInterval) {
      $scope.timeInterval = timeInterval;
      sentinlService.updateFilter($scope.timeInterval)
      .catch(notify.error);
    }
  });

  $rootScope.$watchCollection('timefilter.refreshInterval', function () {
    let refreshValue = _.get($rootScope, 'timefilter.refreshInterval.value');
    let refreshPause = _.get($rootScope, 'timefilter.refreshInterval.pause');

    // Kill any existing timer immediately
    if ($scope.refreshalarms) {
      $timeout.cancel($scope.refreshalarms);
      $scope.refreshalarms = undefined;
    }

    // Check if Paused
    if (refreshPause) {
      if ($scope.refreshalarms) $timeout.cancel($scope.refreshalarms);
      return;
    }

    // Process New Filter
    if (refreshValue !== $scope.currentRefresh && refreshValue !== 0) {
      // new refresh value
      if (_.isNumber(refreshValue) && !refreshPause) {
        $scope.newRefresh = refreshValue;
        // Reset Interval & Schedule Next
        $scope.refreshalarms = $timeout(function () {
          $route.reload();
        }, refreshValue);
        $scope.$watch('$destroy', $scope.refreshalarms);
      } else {
        $scope.currentRefresh = 0;
        $timeout.cancel($scope.refreshalarms);
      }
    } else {
      $timeout.cancel($scope.refreshalarms);
    }
  });

  $scope.deleteAlarm = function (index, rmindex, rmtype, rmid) {
    const confirmModal = $modal.open({
      template: confirmMessage,
      controller: 'ConfirmMessageController',
      size: 'sm'
    });

    confirmModal.result.then((response) => {
      if (response === 'yes') {
        sentinlService.deleteAlarm(rmindex, rmtype, rmid)
        .then(() => {
          $timeout(() => {
            $scope.elasticAlarms.splice(index - 1, 1);
            notify.warning('SENTINL Alarm log successfully deleted!');
            getAlarms($scope.timeInterval);
          }, 1000);
        })
        .catch(notify.error);
      }
    });
  };

  $scope.deleteAlarmLocal = function (index) {
    notify.warning('SENTINL function not yet implemented!');
  };

  var currentTime = moment($route.current.locals.currentTime);
  $scope.currentTime = currentTime.format('HH:mm:ss');
  var utcTime = moment.utc($route.current.locals.currentTime);
  $scope.utcTime = utcTime.format('HH:mm:ss');
  var unsubscribe = $interval(function () {
    $scope.currentTime = currentTime.add(1, 'second').format('HH:mm:ss');
    $scope.utcTime = utcTime.add(1, 'second').format('HH:mm:ss');
  }, 1000);
  $scope.$watch('$destroy', unsubscribe);

});
