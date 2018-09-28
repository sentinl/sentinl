/*global angular*/
import WatcherFactory from './watcher_factory';
export default angular.module('apps/sentinl.watcherFactory', []).factory('watcherFactory',
  /* @ngInject */ ($http, $injector, Promise) => {
    return new WatcherFactory($http, $injector, Promise);
  });
