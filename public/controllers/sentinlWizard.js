/* global angular */
import _ from 'lodash';

import confirmMessage from '../templates/confirm-message.html';
import { app } from '../app.module';

// WATCHERS CONTROLLER
app.controller('sentinlWizard', function ($rootScope, $scope, $route, $interval,
  $timeout, timefilter, Private, createNotifier, $window, $http, $modal,
  $log, navMenu, globalNavState, $routeParams, sentinlService) {

  $scope.topNavMenu = navMenu.getTopNav('wizard');
  $scope.tabsMenu = navMenu.getTabs('wizard');
  navMenu.setKbnLogo(globalNavState.isOpen());
  $scope.$on('globalNavState:change', () => navMenu.setKbnLogo(globalNavState.isOpen()));

  const notify = createNotifier({
    location: 'Sentinl Wizard'
  });

  $scope.watcher = {
    _id: $routeParams.watcherId
  };

  sentinlService.getWatcher($scope.watcher._id).then((resp) => {
    $scope.watcher = resp.data.hits.hits[0];
  });

});
