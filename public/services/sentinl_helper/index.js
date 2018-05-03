/*global angular*/
import SentinlHelper from './sentinl_helper';
export default angular.module('apps/sentinl.sentinlHelper', [])
  .factory('sentinlHelper', /* @ngInject */ () => new SentinlHelper());
