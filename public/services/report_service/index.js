/*global angular*/
import ReportService from './report_service';
export default angular.module('apps/sentinl.reportService', []).factory('reportService',
  /* @ngInject */ ($http, $injector, Promise) => {
    return new ReportService($http, $injector, Promise);
  });
