import { get, isNumber } from 'lodash';
import moment from 'moment';

import confirmMessageTemplate from '../../confirm_message/confirm_message.html';

function ReportsController($rootScope, $scope, $route, $interval,
  $timeout, timefilter, Private, createNotifier, $window, $uibModal, navMenu, globalNavState, Report) {
  'ngInject';

  $scope.title = 'Sentinl: Reports';
  $scope.description = 'Kibi/Kibana Report App for Elasticsearch';

  $scope.topNavMenu = navMenu.getTopNav('reports');
  $scope.tabsMenu = navMenu.getTabs('reports');
  navMenu.setKbnLogo(globalNavState.isOpen());
  $scope.$on('globalNavState:change', () => navMenu.setKbnLogo(globalNavState.isOpen()));

  const notify = createNotifier({
    location: 'Sentinl Reports'
  });

  timefilter.enabled = true;

  /* First Boot */

  $scope.reports = [];
  $scope.timeInterval = timefilter.time;

  const getReports = function (interval) {
    Report.updateFilter(interval)
      .then((resp) => {
        return Report.list().then((resp) => $scope.reports = resp.data.hits.hits);
      })
      .catch(notify.error);
  };

  getReports($scope.timeInterval);

  $scope.$listen(timefilter, 'fetch', (res) => {
    getReports($scope.timeInterval);
  });

  /* Listen for refreshInterval changes */

  $rootScope.$watchCollection('timefilter.time', function (newvar, oldvar) {
    if (newvar === oldvar) { return; }
    let timeInterval = get($rootScope, 'timefilter.time');
    if (timeInterval) {
      $scope.timeInterval = timeInterval;
      Report.updateFilter($scope.timeInterval)
        .catch(notify.error);
    }
  });

  $rootScope.$watchCollection('timefilter.refreshInterval', function () {
    let refreshValue = get($rootScope, 'timefilter.refreshInterval.value');
    let refreshPause = get($rootScope, 'timefilter.refreshInterval.pause');

    // Kill any existing timer immediately
    if ($scope.refreshreports) {
      $timeout.cancel($scope.refreshreports);
      $scope.refreshreports = undefined;
    }

    // Check if Paused
    if (refreshPause) {
      if ($scope.refreshreports) {
        $timeout.cancel($scope.refreshreports);
      }
      return;
    }

    // Process New Filter
    if (refreshValue !== $scope.currentRefresh && refreshValue !== 0) {
      // new refresh value
      if (isNumber(refreshValue) && !refreshPause) {
        $scope.newRefresh = refreshValue;
        // Reset Interval & Schedule Next
        $scope.refreshreports = $timeout(function () {
          $route.reload();
        }, refreshValue);
        $scope.$watch('$destroy', $scope.refreshreports);
      } else {
        $scope.currentRefresh = 0;
        $timeout.cancel($scope.refreshreports);
      }

    } else {
      $timeout.cancel($scope.refreshreports);
    }

  });

  $scope.deleteReport = function (index, rmindex, rmtype, rmid) {
    const confirmModal = $uibModal.open({
      template: confirmMessageTemplate,
      controller: 'ConfirmMessageController',
      size: 'sm'
    });

    confirmModal.result.then((response) => {
      if (response === 'yes') {
        Report.delete(rmindex, rmtype, rmid)
          .then(function (response) {
            $scope.reports.splice(index - 1, 1);
            notify.info(`Deleted report "${response}"`);
            getReports($scope.timeInterval);
          })
          .catch(notify.error);
      }
    });
  };

  $scope.deleteReportLocal = function (index) {
    notify.warning('SENTINL function not yet implemented!');
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
