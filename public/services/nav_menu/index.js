/*global angular*/
import NavMenu from './nav_menu';
angular.module('apps/sentinl.navMenu', [])
  .factory('navMenu', /* @ngInject */ ($rootScope, kbnUrl) => new NavMenu($rootScope, kbnUrl));
