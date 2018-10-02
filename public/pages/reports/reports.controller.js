import { get, isNumber } from 'lodash';
import SentinlError from '../../lib/sentinl_error';
import moment from 'moment';

function ReportsController($rootScope, $scope, $route, $interval,
  $timeout, Private, $window, $uibModal,
  navMenu, globalNavState, reportService, COMMON, confirmModal, sentinlLog,
  getToastNotifications, getNotifier, getTimefilter) {
  'ngInject';

  $scope.title = COMMON.reports.title;
  $scope.description = COMMON.description;

  $scope.topNavMenu = navMenu.getTopNav('reports');
  $scope.tabsMenu = navMenu.getTabs('reports');

  const location = COMMON.reports.title;
  const notify = getNotifier.create({ location });
  const toastNotifications = getToastNotifications;
  const timefilter = getTimefilter;
  const log = sentinlLog;
  log.initLocation(location);

  $scope.reportService = reportService;

  function errorMessage(err) {
    log.error(err);
    notify.error(err);
  }

  function getTime() {
    // Kibana v6.3 .time, v6.4 .getTime()
    return timefilter.time ? timefilter.time : timefilter.getTime();
  }

  try {
    timefilter.enableAutoRefreshSelector();
    timefilter.enableTimeRangeSelector();
  } catch (err) {
    log.warn('Kibana v6.2.X feature:', err);
  }

  /* First Boot */

  $scope.reports = [];

  $scope.isScreenshot = function (report) {
    return report.attachment.charAt(0) === 'i';
  };

  const getReports = function (interval) {
    $scope.reportService.updateFilter(interval)
      .then((resp) => {
        return $scope.reportService.list().then((resp) => $scope.reports = resp);
      })
      .catch((err) => {
        errorMessage(new SentinlError('Get reports', err));
      });
  };

  getReports(getTime());
  $scope.$listen(timefilter, 'fetch', () =>{
    getReports(getTime());
  });

  let refresher;
  $scope.$listen(timefilter, 'refreshIntervalUpdate', function () {
    if (refresher) $timeout.cancel(refresher);
    const interval = timefilter.getRefreshInterval();
    if (interval.value > 0 && !interval.pause) {
      function startRefresh() {
        refresher = $timeout(function () {
          if (!$scope.running) $scope.search();
          startRefresh();
        }, interval.value);
      }
      startRefresh();
    }
  });

  /**
  * Delete report
  *
  * @param {integer} index of report on Reports page
  * @param {object} report
  */
  $scope.deleteReport = function (index, report) {
    async function doDelete() {
      try {
        await $scope.reportService.delete(report.id, report._index);
        $scope.reports.splice(index - 1, 1);
        toastNotifications.addSuccess(`Deleted '${report.id}'`);
        getReports(getTime());
      } catch (err) {
        errorMessage(new SentinlError('Delete report', err));
      }
    }

    const confirmModalOptions = {
      onConfirm: doDelete,
      confirmButtonText: 'Delete report',
    };

    confirmModal('Are you sure you want to delete the report?', confirmModalOptions);
  };

  const currentTime = moment($route.current.locals.currentTime);
  $scope.currentTime = currentTime.format('HH:mm:ss');
  const utcTime = moment.utc($route.current.locals.currentTime);
  $scope.utcTime = utcTime.format('HH:mm:ss');
  const unsubscribe = $interval(function () {
    $scope.currentTime = currentTime.add(1, 'second').format('HH:mm:ss');
    $scope.utcTime = utcTime.add(1, 'second').format('HH:mm:ss');
  }, 1000);
  $scope.$watch('$destroy', unsubscribe);
};

export default ReportsController;
