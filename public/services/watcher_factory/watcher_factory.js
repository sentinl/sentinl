import WatcherEsApi from '../watcher_es_api';
import WatcherSavedObjectsApi from '../watcher_saved_objects_api';

class WatcherFactory {
  constructor($http, $injector, Promise) {
    this.$http = $http;
    this.$injector = $injector;
    this.Promise = Promise;
  }

  get(apiType) {
    let api;
    switch (apiType) {
      case 'elasticsearchAPI':
        api = new WatcherEsApi(this.$http, this.$injector, this.Promise);
        break;
      default:
        api = new WatcherSavedObjectsApi(this.$http, this.$injector, this.Promise);
    }
    return api;
  }
}

export default WatcherFactory;
