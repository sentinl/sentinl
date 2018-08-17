/*global angular*/
import User from './user';
export default angular.module('apps/sentinl.user', [])
  .factory(User.name, /* @ngInject */ ($http, $injector, Promise, ServerConfig, sentinlLog, sentinlHelper) => {
    return new User($http, $injector, Promise, ServerConfig, sentinlLog, sentinlHelper);
  });
