/*global angular*/
import NavMenu from './nav_menu';
export default angular.module('apps/sentinl.navMenu', [])
  .factory('navMenu', /* @ngInject */ ($rootScope, kbnUrl, sentinlConfig) => new NavMenu($rootScope, kbnUrl, sentinlConfig));
