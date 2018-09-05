/*global angular*/
import SentinlHelper from './sentinl_helper';
export default angular.module('apps/sentinl.sentinlHelper', [])
  .factory('sentinlHelper', /* @ngInject */ ($injector) => new SentinlHelper($injector));
