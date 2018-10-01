/*global angular*/
import GetNotifier from './get_notifier';
angular.module('apps/sentinl.getNotifier', [])
  .factory('getNotifier', /* @ngInject */ ($injector) => new GetNotifier($injector));
