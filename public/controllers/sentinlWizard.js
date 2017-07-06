/* global angular */
import _ from 'lodash';

import confirmMessage from '../templates/confirm-message.html';
import { app } from '../app.module';

// WIZARD CONTROLLER
app.controller('sentinlWizard', function ($rootScope, $scope, $route, $interval,
  $timeout, timefilter, Private, createNotifier, $window, $http, $modal,
  $log, navMenu, globalNavState, $routeParams, sentinlService, dataTransfer) {

  $scope.topNavMenu = navMenu.getTopNav('wizard');
  $scope.tabsMenu = navMenu.getTabs('wizard');
  navMenu.setKbnLogo(globalNavState.isOpen());
  $scope.$on('globalNavState:change', () => navMenu.setKbnLogo(globalNavState.isOpen()));

  const notify = createNotifier({
    location: 'Sentinl Wizard'
  });

  $scope.watcher = {};

  if ($routeParams.watcherId && $routeParams.watcherId.length) { // edit existing watcher
    sentinlService.getWatcher($routeParams.watcherId).then((resp) => {
      $scope.watcher = resp.data.hits.hits[0];
    });
  } else { // forwarded from dashboard spy panel
    $scope.watcher = dataTransfer.getWatcher();
  }

});
