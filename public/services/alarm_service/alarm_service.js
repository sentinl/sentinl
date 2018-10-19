import SentinlApi from '../sentinl_api';

class AlarmService extends SentinlApi {
  constructor($http, $injector, Promise) {
    super('alarm', $http, $injector);
  }
}

export default AlarmService;
