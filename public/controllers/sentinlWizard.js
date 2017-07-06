/* global angular */
import _ from 'lodash';

import confirmMessage from '../templates/confirm-message.html';
import { app } from '../app.module';

// WATCHERS CONTROLLER
app.controller('sentinlWizard', function ($rootScope, $scope, $route, $interval,
  $timeout, timefilter, Private, createNotifier, $window, $http, $modal, $log, navMenu, globalNavState) {

  $scope.title = 'Sentinl: Wizard';
  $scope.description = 'Kibana Alert App for Elasticsearch';

  const notify = createNotifier({
    location: 'Sentinl Wizard'
  });

  $scope.topNavMenu = navMenu.getTopNav('wizard');
  $scope.tabsMenu = navMenu.getTabs('wizard');
  navMenu.setKbnLogo(globalNavState.isOpen());
  $scope.$on('globalNavState:change', () => navMenu.setKbnLogo(globalNavState.isOpen()));
});
