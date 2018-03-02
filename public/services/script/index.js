/*global angular*/
import Script from './script';
export default angular.module('apps/sentinl.script', [])
  .factory(Script.name, /* @ngInject */ ($http, $injector, Promise, ServerConfig) => new Script($http, $injector, Promise, ServerConfig));
