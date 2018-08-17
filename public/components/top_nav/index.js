/* global angular */
import TopNav from './top_nav';

export default angular.module('apps.sentinl.topNav', []).directive('topNav', () => new TopNav());
