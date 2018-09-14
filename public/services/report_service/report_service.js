import SentinlApi from '../sentinl_api';

class ReportService extends SentinlApi {
  constructor($http, $injector, Promise) {
    super('report', $http, $injector);
  }
}

export default ReportService;
