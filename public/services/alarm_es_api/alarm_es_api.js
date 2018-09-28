import EsApi from '../es_api';

class AlarmEsApi extends EsApi {
  constructor($http, $injector) {
    super('alarm', $http, $injector);
  }
}

export default AlarmEsApi;
