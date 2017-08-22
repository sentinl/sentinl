/* global angular */
import _ from 'lodash';
import moment from 'moment';
import chrome from 'ui/chrome';

import confirmMessage from '../templates/confirm-message.html';
import { app } from '../app.module';

app.controller('AlarmsController', function ($rootScope, $scope, $route, $interval,
  $timeout, $injector, timefilter, Private, createNotifier, $window, $uibModal, navMenu,
  globalNavState, Alarm) {
  $scope.title = 'Sentinl: Alarms';
  $scope.description = 'Kibi/Kibana Report App for Elasticsearch';

  const notify = createNotifier({
    location: 'Sentinl Alarms'
  });

  timefilter.enabled = true;

  $scope.topNavMenu = navMenu.getTopNav('alarms');
  $scope.tabsMenu = navMenu.getTabs('alarms');
  navMenu.setKbnLogo(globalNavState.isOpen());
  $scope.$on('globalNavState:change', () => navMenu.setKbnLogo(globalNavState.isOpen()));

  /* First Boot */

  $scope.alarms = [];
  $scope.timeInterval = timefilter.time;

  const getAlarms = function (interval) {
    Alarm.updateFilter(interval)
      .then((resp) => {
        return Alarm.list().then((resp) => $scope.alarms = resp.data.hits.hits);
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
      Alarm.updateFilter($scope.timeInterval)
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
    const confirmModal = $uibModal.open({
      template: confirmMessage,
      controller: 'ConfirmMessageController',
      size: 'sm'
    });

    confirmModal.result.then((response) => {
      if (response === 'yes') {
        Alarm.delete(rmindex, rmtype, rmid)
          .then((response) => {
            $scope.alarms.splice(index - 1, 1);
            notify.info(`Alarm ${response} deleted`);
            getAlarms($scope.timeInterval);
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
