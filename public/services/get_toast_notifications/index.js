/*global angular*/
import GetToastNotifications from './get_toast_notifications';
angular.module('apps/sentinl.getToastNotifications', [])
  .factory('getToastNotifications', /* @ngInject */ ($injector) => GetToastNotifications.factory($injector));
