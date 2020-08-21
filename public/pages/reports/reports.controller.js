import { get, isNumber } from 'lodash';
import moment from 'moment';
import { SentinlError } from '../../services';
import { toastNotificationsFactory, timefilterFactory } from '../../factories';

const toastNotifications = toastNotificationsFactory();

function ReportsController($scope, $injector, $route, $interval,
  $timeout, navMenu, reportService,
  confirmModal, sentinlLog) {
  'ngInject';

  $scope.topNavMenu = navMenu.getTopNav('reports');
  $scope.tabsMenu = navMenu.getTabs('reports');

  const log = sentinlLog;
  log.initLocation('Reports');

  $scope.reportService = reportService;

  function errorMessage(message, err) {
    err = new SentinlError(message, err);
    log.error(err);
    toastNotifications.addDanger(err.message);
  }

  $scope.reports = [];
  const timefilter = timefilterFactory($injector);
  timefilter.enable(true);

  let running = false;
  async function getReports() {
    running = true;
    try {
      await $scope.reportService.updateFilter(timefilter.getTime());
      $scope.reports = await $scope.reportService.list();
    } catch (err) {
      errorMessage('get reports', err);
    }
    running = false;
  }

  let refresher;
  function refreshIntervalForTimefilter(interval) {
    if (refresher) $timeout.cancel(refresher);
    interval = interval || timefilter.getRefreshInterval();
    if (interval.value > 0 && !interval.pause) {
      function startRefresh() {
        refresher = $timeout(function () {
          if (!running) getReports();
          startRefresh();
        }, interval.value);
      }
      startRefresh();
    }
  }

  getReports();

  //$scope.$listen(timefilter, 'fetch', getReports);
  //$scope.$listen(timefilter, 'refreshIntervalUpdate', refreshIntervalForTimefilter); // Kibana v6.3+

  if (timefilter.refreshInterval) {
    $scope.$watchCollection('timefilter.refreshInterval', refreshIntervalForTimefilter); // Kibana v5.6-6.2
  }

  function createReportUrl(base64String) {
    const type = base64String.charAt(0) === 'i' ? 'image/png' : 'application/pdf';
    const raw = atob(base64String);
    const view = new Uint8Array(new ArrayBuffer(raw.length));
    for (let i = 0; i < raw.length; i++) {
      view[i] = raw.charCodeAt(i);
    }
    return URL.createObjectURL(new Blob([view], { type }));
  };

  $scope.collapseReport = function (id) {
    const index = $scope.reports.findIndex(e => e.id === id);
    $scope.reports[index].url = createReportUrl($scope.reports[index].attachment);
    $scope.reports[index].collapsed = !$scope.reports[index].collapsed;
  };

  /**
  * Delete report
  *
  * @param {integer} index of report on Reports page
  * @param {object} report
  */
  $scope.deleteReport = function (index, report) {
    async function doDelete() {
      try {
        const id = await $scope.reportService.delete(report.id, report._index);
        $scope.reports.splice(index - 1, 1);
        toastNotifications.addSuccess(`report deleted ${id}`);
        getReports();
      } catch (err) {
        errorMessage('delete report', err);
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
