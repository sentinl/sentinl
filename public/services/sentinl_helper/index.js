/*global angular*/
import SentinlHelper from './sentinl_helper';
angular.module('apps/sentinl.sentinlHelper', [])
  .factory('sentinlHelper', /* @ngInject */ () => new SentinlHelper());
