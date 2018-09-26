/*global angular*/
import DataTransfer from './data_transfer';
angular.module('apps/sentinl.dataTransfer', [])
  .factory('dataTransfer', /* @ngInject */ () => new DataTransfer());
