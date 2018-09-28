/*global angular*/
import AlarmFactory from './alarm_factory';
export default angular.module('apps/sentinl.alarmFactory', []).factory('alarmFactory',
  /* @ngInject */ ($http, $injector) => {
    return new AlarmFactory($http, $injector);
  });
