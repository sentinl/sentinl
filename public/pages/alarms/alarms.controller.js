import { get, isNumber } from 'lodash';
import SentinlError from '../../lib/sentinl_error';
import moment from 'moment';
import uiChrome from 'ui/chrome';

function AlarmsController($rootScope, $scope, $route, $interval,
  $timeout, $injector, Private, $window, $uibModal, navMenu,
  globalNavState, alarmService, COMMON, confirmModal, sentinlLog,
  getToastNotifications, getNotifier) {
  'ngInject';

  $scope.title = COMMON.alarms.title;
  $scope.description = COMMON.description;

  //columns for dynamic view
  $scope.alarmColumns = [
    {
      name:'level',
      label:'Level',
      visible: true
    },
    {
      name: 'action',
      label:'Action',
      visible: true
    },
    {
      name: 'watcher',
      label: 'Watcher',
      visible: true
    },
    {
      name: 'message',
      label: 'Message',
      visible: true
    }
  ];

  const location = COMMON.alarms.title;
  const notify = getNotifier.create({ location });
  const toastNotifications = getToastNotifications;

  const log = sentinlLog;
  log.initLocation(location);

  $scope.alarmService = alarmService;

  function errorMessage(err) {
    log.error(err);
    notify.error(err);
  }

  // timefilter.enabled = true; // Deprecated in Kibana 6.4
  // try {
  //   timefilter.enableAutoRefreshSelector();
  //   timefilter.enableTimeRangeSelector();
  // } catch (err) {
  //   log.warn('Kibana v6.2.X feature:', err);
  // }

  $scope.topNavMenu = navMenu.getTopNav('alarms');
  $scope.tabsMenu = navMenu.getTabs('alarms');

  /* First Boot */

  $scope.alarms = [];
  // $scope.timeInterval = timefilter.time;

  const getAlarms = function (interval) {
    $scope.alarmService.updateFilter(interval)
      .then((resp) => {
        return $scope.alarmService.list().then((resp) => $scope.alarms = resp);
      })
      .catch((err) => {
        errorMessage(new SentinlError('Get alarms', err));
      });
  };

  getAlarms($scope.timeInterval);

  // $scope.$listen(timefilter, 'fetch', (res) => {
  //   getAlarms($scope.timeInterval);
  // });

  /* Listen for refreshInterval changes */

  // $rootScope.$watchCollection('timefilter.time', function (newvar, oldvar) {
  //   if (newvar === oldvar) { return; }
  //   let timeInterval = get($rootScope, 'timefilter.time');
  //   if (timeInterval) {
  //     $scope.timeInterval = timeInterval;
  //     $scope.alarmService.updateFilter($scope.timeInterval)
  //       .catch(errorMessage);
  //   }
  // });

  //$rootScope.$watchCollection('timefilter.refreshInterval', function () {
  //  let refreshValue = get($rootScope, 'timefilter.refreshInterval.value');
  //  let refreshPause = get($rootScope, 'timefilter.refreshInterval.pause');

  //  // Kill any existing timer immediately
  //  if ($scope.refreshalarms) {
  //    $timeout.cancel($scope.refreshalarms);
  //    $scope.refreshalarms = undefined;
  //  }

  //  // Check if Paused
  //  if (refreshPause) {
  //    if ($scope.refreshalarms) $timeout.cancel($scope.refreshalarms);
  //    return;
  //  }

  //  // Process New Filter
  //  if (refreshValue !== $scope.currentRefresh && refreshValue !== 0) {
  //    // new refresh value
  //    if (isNumber(refreshValue) && !refreshPause) {
  //      $scope.newRefresh = refreshValue;
  //      // Reset Interval & Schedule Next
  //      $scope.refreshalarms = $timeout(function () {
  //        $route.reload();
  //      }, refreshValue);
  //      $scope.$watch('$destroy', $scope.refreshalarms);
  //    } else {
  //      $scope.currentRefresh = 0;
  //      $timeout.cancel($scope.refreshalarms);
  //    }
  //  } else {
  //    $timeout.cancel($scope.refreshalarms);
  //  }
  //});

  /**
  * Delete alarm
  *
  * @param {integer} index of alarm on Alarms page
  * @param {object} alarm
  */
  $scope.deleteAlarm = function (index, alarm) {
    async function doDelete() {
      try {
        await $scope.alarmService.delete(alarm.id, alarm._index);
        $scope.alarms.splice(index - 1, 1);
        toastNotifications.addSuccess(`Deleted alarm '${alarm.id}'`);
        getAlarms($scope.timeInterval);
      } catch (err) {
        errorMessage(new SentinlError('Delete alarm', err));
      }
    }

    const confirmModalOptions = {
      onConfirm: doDelete,
      confirmButtonText: 'Delete alarm',
    };

    confirmModal(`Are you sure you want to delete the alarm ${alarm.watcher}?`, confirmModalOptions);
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
