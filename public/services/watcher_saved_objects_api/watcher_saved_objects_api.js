import SavedObjectsApi from '../saved_objects_api';

/**
* A class to manage Sentinl watchers
*/
class WatcherSavedObjectsApi extends SavedObjectsApi {
  constructor($http, $injector, Promise) {
    super('watcher', $http, $injector);
    this.docType = 'watcher';
    this.$http = $http;
    this.Promise = Promise;
    this.helper = $injector.get('sentinlHelper');
    this.config = $injector.get('sentinlConfig');
    this.apiType =  this.config.api.type;
  }

  async new(type) {
    try {
      this.savedObjects.Class.defaults = this.helper.getWatcherDefaults(type);
      return await this.get();
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} ${this.apiType} new`));
    }
  }
}

export default WatcherSavedObjectsApi;
