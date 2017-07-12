/* global angular */
import _ from 'lodash';
import confirmMessage from '../templates/confirm-message.html';

import { app } from '../app.module';
import WatcherHelper from '../classes/WatcherHelper';

// WIZARD CONTROLLER
app.controller('WizardController', function ($rootScope, $scope, $route, $interval,
  $timeout, timefilter, Private, createNotifier, $window, $uibModal,
  $log, navMenu, globalNavState, $routeParams, sentinlService, dataTransfer, $location) {

  $scope.topNavMenu = navMenu.getTopNav('wizard');
  $scope.tabsMenu = navMenu.getTabs('wizard', [{ name: 'Wizard', url: '#/wizard' }]);
  navMenu.setKbnLogo(globalNavState.isOpen());
  $scope.$on('globalNavState:change', () => navMenu.setKbnLogo(globalNavState.isOpen()));

  const notify = createNotifier({
    location: 'Sentinl Watcher Wizard'
  });

  // Init editor form
  const initWizard = function () {};


  // Get watcher
  $scope.watcher = {};

  if ($routeParams.watcherId && $routeParams.watcherId.length) { // edit existing watcher
    sentinlService.getWatcher($routeParams.watcherId).then((resp) => {
      $scope.watcher = resp.data.hits.hits[0];
      initWizard();
    });
  } else { // forwarded from dashboard spy panel
    $scope.watcher = dataTransfer.getWatcher();
    initWizard();
  }

});
