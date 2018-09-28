/*global angular*/
import ReportFactory from './report_factory';
export default angular.module('apps/sentinl.reportFactory', []).factory('reportFactory',
  /* @ngInject */ ($http, $injector) => {
    return new ReportFactory($http, $injector);
  });
