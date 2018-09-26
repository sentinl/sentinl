/*global angular*/
import AlarmService from './alarm_service';
angular.module('apps/sentinl.alarmService', []).factory('alarmService',
  /* @ngInject */ ($http, $injector, Promise) => {
    return new AlarmService($http, $injector, Promise);
  });
