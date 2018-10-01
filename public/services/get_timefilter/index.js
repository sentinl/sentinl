/*global angular*/
import GetTimefilter from './get_timefilter';
angular.module('apps/sentinl.getTimefilter', [])
  .factory('getTimefilter', /* @ngInject */ ($injector) => GetTimefilter.factory($injector));
