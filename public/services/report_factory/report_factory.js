import ReportEsApi from '../report_es_api';

class ReportFactory {
  constructor($http, $injector) {
    this.$http = $http;
    this.$injector = $injector;
  }

  get() {
    return new ReportEsApi(this.$http, this.$injector);
  }
}

export default ReportFactory;
