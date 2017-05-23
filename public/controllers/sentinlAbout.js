import _ from 'lodash';
import Notifier from 'ui/notify/notifier';
import moment from 'moment';

import { app } from '../app.module';

app.controller('sentinlAbout', function ($scope, $route, $interval, timefilter, Notifier, NavMenu) {
  $scope.title = 'Sentinl';
  $scope.description = 'Kibana Alert App for Elasticsearch';
  timefilter.enabled = false;
  $scope.notify = new Notifier();

  $scope.topNavMenu = NavMenu.getTopNav('about');
  $scope.tabsMenu = NavMenu.getTabs('about');

  if (!$scope.notified) {
    $scope.notify.warning('SENTINL is a work in progress! Use at your own risk!');
    $scope.notified = true;
  }

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
