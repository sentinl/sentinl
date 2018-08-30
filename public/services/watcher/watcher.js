import { get, assign, isObject, forEach, has, cloneDeep } from 'lodash';
import uuid from 'uuid/v4';
import SavedObjects from '../saved_objects';

/**
* A class to manage Sentinl watchers
*/
class Watcher extends SavedObjects {
  /**
  * Constructor
  *
  * @param {object} $http service
  * @param {object} $injector service
  * @param {object} Promise
  * @param {object} ServerConfig service
  */
  constructor($http, $injector, Promise, ServerConfig, sentinlHelper, EMAILWATCHERADVANCED, EMAILWATCHERWIZARD, REPORTWATCHER) {
    super($http, $injector, Promise, ServerConfig, 'watcher', sentinlHelper);
    this.EMAILWATCHERADVANCED = EMAILWATCHERADVANCED;
    this.EMAILWATCHERWIZARD = EMAILWATCHERWIZARD;
    this.REPORTWATCHER = REPORTWATCHER;
    this.$http = $http;
    this.$injector = $injector;
    this.Promise = Promise;
    this.ServerConfig = ServerConfig;
    this.sentinlHelper = sentinlHelper;
    this.savedWatchersKibana = this.$injector.has('savedWatchersKibana') ? this.$injector.get('savedWatchersKibana') : null;
    // Kibi: inject saved objects api related modules if they exist.
    this.savedObjectsAPI = this.$injector.has('savedObjectsAPI') ? this.$injector.get('savedObjectsAPI') : null;
    this.savedWatchers = this.$injector.has('savedWatchers') ? this.$injector.get('savedWatchers') : null;
    this.isSiren = isObject(this.savedObjectsAPI) && isObject(this.savedWatchers);
    this.savedObjects = this.savedWatchersKibana;
    if (this.isSiren) {
      this.savedObjects = this.savedWatchers;
    }
  }

  /**
  * Run watcher on demand
  *
  * @param {string} id of watcher
  * @return {object} ack
  */
  async play(id) {
    try {
      const watcher = await this.get(id);
      const resp = await this.$http.post('../api/sentinl/watcher/_execute', {
        _id: watcher.id,
        _source: this.sentinlHelper.pickWatcherSource(watcher)
      });
      return resp.data;
    } catch (err) {
      throw new Error(this.sentinlHelper.apiErrMsg(err, 'Watcher play'));
    }
  }

  /**
  * Get watcher
  *
  * @param {string} id of watcher
  * @return {object} doc
  */
  get(id) {
    return super.get(id);
  }

  /**
  * Create new watcher object
  *
  * @param {string} type of watcher (email watcher, reporter)
  * @return {object} watcher doc
  */
  async new(type) {
    try {
      switch (type) {
        case 'report':
          this.savedObjects.Class.defaults = cloneDeep(this.REPORTWATCHER);
          break;
        case 'advanced':
          this.savedObjects.Class.defaults = cloneDeep(this.EMAILWATCHERADVANCED);
          break;
        default:
          this.savedObjects.Class.defaults = cloneDeep(this.EMAILWATCHERWIZARD);
      }

      return await this.savedObjects.get();
    } catch (err) {
      throw new Error(this.sentinlHelper.apiErrMsg(err, 'Watcher new'));
    }
  }

  /**
  * Save watcher doc
  *
  * @param {object} watcher object
  * @return {string} watcher id
  */
  async save(watcher) {
    if (watcher.hasOwnProperty('save')) {
      try {
        return await watcher.save();
      } catch (err) {
        throw new Error(this.sentinlHelper.apiErrMsg(err, 'Watcher save'));
      }
    }

    try {
      const savedWatcher = await this.savedObjects.get(watcher.id);
      assign(savedWatcher, watcher);
      return await savedWatcher.save();
    } catch (err) {
      throw new Error(this.sentinlHelper.apiErrMsg(err, 'Watcher save'));
    }
  }
}

export default Watcher;
