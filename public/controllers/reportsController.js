/* global angular */
import _ from 'lodash';
import moment from 'moment';

import confirmMessage from '../templates/confirm-message.html';
import { app } from '../app.module';

app.controller('ReportsController', function ($rootScope, $scope, $route, $interval,
  $timeout, timefilter, Private, createNotifier, $window, $uibModal, navMenu, globalNavState, Report) {
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

  $scope.elasticReports = [];
  $scope.timeInterval = timefilter.time;

  const getReports = function (interval) {
    Report.updateFilter(interval)
    .then((resp) => {
      return Report.list().then((resp) => $scope.elasticReports = resp.data.hits.hits);
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
    let timeInterval = _.get($rootScope, 'timefilter.time');
    if (timeInterval) {
      $scope.timeInterval = timeInterval;
      Report.updateFilter($scope.timeInterval)
      .catch(notify.error);
    }
  });

  $rootScope.$watchCollection('timefilter.refreshInterval', function () {
    let refreshValue = _.get($rootScope, 'timefilter.refreshInterval.value');
    let refreshPause = _.get($rootScope, 'timefilter.refreshInterval.pause');

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
      if (_.isNumber(refreshValue) && !refreshPause) {
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
      template: confirmMessage,
      controller: 'ConfirmMessageController',
      size: 'sm'
    });

    confirmModal.result.then((response) => {
      if (response === 'yes') {
        Report.delete(rmindex, rmtype, rmid)
        .then(() => {
          $scope.elasticReports.splice(index - 1, 1);
          $timeout(() => {
            notify.info('Report log successfully deleted!');
            getReports($scope.timeInterval);
          }, 1000);
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

});
