/*global angular*/
import WatcherService from './watcher_service';
angular.module('apps/sentinl.watcherService', []).factory('watcherService',
  /* @ngInject */ ($http, $injector, Promise) => {
    return new WatcherService($http, $injector, Promise);
  });
