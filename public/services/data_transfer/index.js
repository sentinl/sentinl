/*global angular*/
import DataTransfer from './data_transfer';
export default angular.module('apps/sentinl.dataTransfer', [])
  .factory('dataTransfer', /* @ngInject */ () => new DataTransfer());
