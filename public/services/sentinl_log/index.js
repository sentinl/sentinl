/* global angular */
import SentinlLog from './sentinl_log';
export default angular.module('apps/sentinl.log', []).factory('sentinlLog', /* @ngInject */ ($log) => new SentinlLog($log));
