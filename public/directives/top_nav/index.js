/* global angular */
import TopNav from './top_nav';
angular.module('apps/sentinl.topNav', []).directive('topNav', () => new TopNav());
