/*global angular*/
import UserService from './user_service';
angular.module('apps/sentinl.userService', []).factory('userService',
  /* @ngInject */ ($http, $injector, Promise) => {
    return new UserService($http, $injector, Promise);
  });
