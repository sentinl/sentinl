import AlarmEsApi from '../alarm_es_api';

class AlarmFactory {
  constructor($http, $injector) {
    this.$http = $http;
    this.$injector = $injector;
  }

  get() {
    return new AlarmEsApi(this.$http, this.$injector);
  }
}

export default AlarmFactory;
