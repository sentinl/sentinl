/*global angular*/
import Alarm from './alarm';
export default angular.module('apps/sentinl.alarm', [])
  .factory(Alarm.name, /* @ngInject */ ($http) => new Alarm($http));
