import { get, isNumber } from 'lodash';
import moment from 'moment';
import { Notifier } from 'ui/notify';
import { SentinlError } from '../../services';
import { toastNotificationsFactory, timefilterFactory } from '../../factories';

const notify = new Notifier({ location: 'Reports' });
const toastNotifications = toastNotificationsFactory();

function ReportsController($scope, $injector, $route, $interval,
  $timeout, Private, $window, $uibModal, navMenu, globalNavState, reportService,
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
    notify.error(err);
  }

  $scope.reports = [];
  const timefilter = timefilterFactory($injector);
  timefilter.enable(true);

  $scope.isScreenshot = function (report) {
    return report.attachment.charAt(0) === 'i';
  };

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

  $scope.$listen(timefilter, 'fetch', getReports);
  $scope.$listen(timefilter, 'refreshIntervalUpdate', refreshIntervalForTimefilter); // Kibana v6.3+

  if (timefilter.refreshInterval) {
    $scope.$watchCollection('timefilter.refreshInterval', refreshIntervalForTimefilter); // Kibana v5.6-6.2
  }

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
