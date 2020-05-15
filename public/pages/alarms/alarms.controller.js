import moment from 'moment';
import { SentinlError } from '../../services';
import { toastNotificationsFactory, timefilterFactory } from '../../factories';

const toastNotifications = toastNotificationsFactory();

function AlarmsController($scope, $route, $interval,
  $timeout, $injector, navMenu, alarmService, confirmModal, sentinlLog) {
  'ngInject';

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

  const log = sentinlLog;
  log.initLocation('Alarms');

  $scope.alarmService = alarmService;

  $scope.topNavMenu = navMenu.getTopNav('alarms');
  $scope.tabsMenu = navMenu.getTabs('alarms');

  $scope.alarms = [];
  const timefilter = timefilterFactory($injector);
  timefilter.enable(true);

  function errorMessage(message, err) {
    err = new SentinlError(message, err);
    log.error(err);
    toastNotifications.addDanger(err);
  }

  let running = false;
  async function getAlarms() {
    running = true;
    try {
      await $scope.alarmService.updateFilter(timefilter.getTime());
      $scope.alarms = await $scope.alarmService.list();
    } catch (err) {
      errorMessage('get alarms', err);
    }
    running = false;
  };

  let refresher;
  function refreshIntervalForTimefilter(interval) {
    if (refresher) $timeout.cancel(refresher);
    interval = interval || timefilter.getRefreshInterval();
    if (interval.value > 0 && !interval.pause) {
      function startRefresh() {
        refresher = $timeout(function () {
          if (!running) getAlarms();
          startRefresh();
        }, interval.value);
      }
      startRefresh();
    }
  }

  getAlarms();

  //$scope.$listen(timefilter, 'fetch', getAlarms);
  //$scope.$listen(timefilter, 'refreshIntervalUpdate', refreshIntervalForTimefilter); // Kibana v6.3+

  if (timefilter.refreshInterval) {
    $scope.$watchCollection('timefilter.refreshInterval', refreshIntervalForTimefilter); // Kibana v5.6-6.2
  }

  /**
  * Delete alarm
  *
  * @param {integer} index of alarm on Alarms page
  * @param {object} alarm
  */
  $scope.deleteAlarm = function (index, alarm) {
    async function doDelete() {
      try {
        const id = await $scope.alarmService.delete(alarm.id, alarm._index);
        $scope.alarms.splice(index - 1, 1);
        toastNotifications.addSuccess(`alarm deleted ${id}`);
        getAlarms();
      } catch (err) {
        errorMessage('delete alarm', err);
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
