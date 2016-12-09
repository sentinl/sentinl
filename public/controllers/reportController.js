import uiModules from 'ui/modules';
import _ from 'lodash';
import moment from 'moment';
import chrome from 'ui/chrome';

uiModules
.get('api/sentinl', [])
.controller('sentinlReports', function ($rootScope, $scope, $route, $interval,
  $timeout, timefilter, Private, createNotifier, $window, kbnUrl, $http) {
  $scope.title = 'Sentinl: Reports';
  $scope.description = 'Kibana Report App for Elasticsearch';

  const notify = createNotifier({
    location: 'Sentinl Reports'
  });

  timefilter.enabled = true;

  /* Update Time Filter */
  var updateFilter = function () {
    return $http.get('../api/sentinl/set/interval/' + JSON.stringify($scope.timeInterval).replace(/\//g, '%2F'));
  };

  /* First Boot */

  $scope.elasticReports = [];
  $scope.timeInterval = timefilter.time;
  updateFilter();
  $http.get('../api/sentinl/list/reports')
  .then(
    (resp) => $scope.elasticReports = resp.data.hits.hits,
    notify.error
  );

  /* Listen for refreshInterval changes */

  $rootScope.$watchCollection('timefilter.time', function (newvar, oldvar) {
    if (newvar === oldvar) { return; }
    let timeInterval = _.get($rootScope, 'timefilter.time');
    if (timeInterval) {
      $scope.timeInterval = timeInterval;
      updateFilter();
      $route.reload();
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
        // console.log('TIMEFILTER REFRESH');
        $scope.newRefresh = refreshValue;
        // Reset Interval & Schedule Next
        $scope.refreshreports = $timeout(function () {
          // console.log('Reloading data....');
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

  $scope.deleteReport = function ($index) {
    if ($window.confirm('Delete is Forever!\n Are you sure?')) {
      return $http.get('../api/sentinl/delete/alarm/' + $scope.elasticReports[$index]._index
      + '/' + $scope.elasticReports[$index]._type
      + '/' + $scope.elasticReports[$index]._id)
      .then(
        () => $timeout(function () {
          $scope.elasticReports.splice($index, 1);
          $scope.notify.warning('SENTINL Report log successfully deleted!');
        }),
        notify.error
      );
    }
  };

  $scope.deleteReportLocal = function ($index) {
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
