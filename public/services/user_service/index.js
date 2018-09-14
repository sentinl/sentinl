/*global angular*/
import UserService from './user_service';
export default angular.module('apps/sentinl.userService', []).factory('userService',
  /* @ngInject */ ($http, $injector, Promise) => {
    return new UserService($http, $injector, Promise);
  });
