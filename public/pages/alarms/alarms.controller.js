import { get, isNumber } from 'lodash';
import moment from 'moment';
import uiChrome from 'ui/chrome';

import confirmMessageTemplate from '../../confirm_message/confirm_message.html';

function AlarmsController($rootScope, $scope, $route, $interval,
  $timeout, $injector, timefilter, Private, createNotifier, $window, $uibModal, navMenu,
  globalNavState, Alarm, COMMON, $log) {
  'ngInject';

  $scope.title = COMMON.alarms.title;
  $scope.description = COMMON.description;

  const notify = createNotifier({
    location: COMMON.alarms.title,
  });

  timefilter.enabled = true;
  try {
    timefilter.enableAutoRefreshSelector();
    timefilter.enableTimeRangeSelector();
  } catch (err) {
    $log.warn('Kibana v6.2.X feature:', err);
  }

  $scope.topNavMenu = navMenu.getTopNav('alarms');
  $scope.tabsMenu = navMenu.getTabs('alarms');

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
    let timeInterval = get($rootScope, 'timefilter.time');
    if (timeInterval) {
      $scope.timeInterval = timeInterval;
      Alarm.updateFilter($scope.timeInterval)
        .catch(notify.error);
    }
  });

  $rootScope.$watchCollection('timefilter.refreshInterval', function () {
    let refreshValue = get($rootScope, 'timefilter.refreshInterval.value');
    let refreshPause = get($rootScope, 'timefilter.refreshInterval.pause');

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
      if (isNumber(refreshValue) && !refreshPause) {
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
      template: confirmMessageTemplate,
      controller: 'ConfirmMessageController',
      size: 'sm'
    });

    confirmModal.result.then((response) => {
      if (response === 'yes') {
        Alarm.delete(rmindex, rmtype, rmid)
          .then(function (response) {
            $scope.alarms.splice(index - 1, 1);
            notify.info(`Deleted alarm "${response}"`);
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
};

export default AlarmsController;
