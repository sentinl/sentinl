/* global angular */
import SentinlLog from './sentinl_log';
angular.module('apps/sentinl.log', []).factory('sentinlLog', /* @ngInject */ ($log) => new SentinlLog($log));
