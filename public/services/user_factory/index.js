/*global angular*/
import UserFactory from './user_factory';
export default angular.module('apps/sentinl.userFactory', []).factory('userFactory',
  /* @ngInject */ ($http, $injector) => {
    return new UserFactory($http, $injector);
  });
