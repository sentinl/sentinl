/*global angular*/
import Script from './script';
export default angular.module('apps/sentinl.script', [])
  .factory(Script.name, /* @ngInject */ ($http, $injector, ServerConfig) => new Script($http, $injector, ServerConfig));
