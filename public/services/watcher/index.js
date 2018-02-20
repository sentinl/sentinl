/*global angular*/
import Watcher from './watcher';
export default angular.module('apps/sentinl.watcher', [])
  .factory(Watcher.name, /* @ngInject */ ($http, $injector, Promise, ServerConfig, EMAILWATCHER, REPORTWATCHER) => {
    return new Watcher($http, $injector, Promise, ServerConfig, EMAILWATCHER, REPORTWATCHER);
  });
