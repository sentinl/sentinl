/*global angular*/
import User from './user';
export default angular.module('apps/sentinl.user', [])
  .factory(User.name, /* @ngInject */ ($http, $injector) => new User($http, $injector));
