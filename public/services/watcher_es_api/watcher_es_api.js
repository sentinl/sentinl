import EsApi from '../es_api';

class WatcherEsApi extends EsApi {
  constructor($http, $injector, Promise) {
    super('watcher', $http, $injector);
    this.docType = 'watcher';
    this.$http = $http;
    this.Promise = Promise;
    this.helper = $injector.get('sentinlHelper');
    this.config = $injector.get('sentinlConfig');
    this.apiType = this.config.api.type;
  }

  async new(type) {
    try {
      return this.Promise.resolve(this.helper.getWatcherDefaults(type));
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} ${this.apiType} new`));
    }
  }
}

export default WatcherEsApi;
