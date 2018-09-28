import EsApi from '../es_api';

class ReportEsApi extends EsApi {
  constructor($http, $injector) {
    super('report', $http, $injector);
  }
}

export default ReportEsApi;
