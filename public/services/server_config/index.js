/*global angular*/
import ServerConfig from './server_config';
export default angular.module('apps/sentinl.server_config', [])
  .factory(ServerConfig.name, /* @ngInject */ ($http) => new ServerConfig($http));
