import {isObject, forEach, has} from 'lodash';
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
  constructor($http, $injector, Promise, ServerConfig, EMAILWATCHER, REPORTWATCHER) {
    super($http, $injector, Promise, ServerConfig, 'watcher');
    this.EMAILWATCHER = EMAILWATCHER;
    this.REPORTWATCHER = REPORTWATCHER;
    this.$http = $http;
    this.$injector = $injector;
    this.Promise = Promise;
    this.ServerConfig = ServerConfig;
    this.savedWatchersKibana = this.$injector.has('savedWatchersKibana') ? this.$injector.get('savedWatchersKibana') : null;
    // Kibi: inject saved objects api related modules if they exist.
    this.savedObjectsAPI = this.$injector.has('savedObjectsAPI') ? this.$injector.get('savedObjectsAPI') : null;
    this.savedWatchers = this.$injector.has('savedWatchers') ? this.$injector.get('savedWatchers') : null;
    this.isSiren = isObject(this.savedObjectsAPI) && isObject(this.savedWatchers);
    this.savedObjects = this.savedWatchersKibana;
    if (this.isSiren) {
      this.savedObjects = this.savedWatchers;
    }
    this.fields = [
      'actions', 'input',
      'condition', 'transform',
      'trigger', 'disable',
      'report', 'title'
    ];
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
      const resp = await this.$http.post('../api/sentinl/watcher/_execute', watcher);
      return resp.data;
    } catch (err) {
      throw err.data;
    }
  }

  /**
  * Get watcher
  *
  * @param {string} id of watcher
  * @return {object} doc
  */
  get(id) {
    return super.get(id, this.fields);
  }

  /**
  * Create new watcher object
  *
  * @param {string} type of watcher (email watcher, reporter)
  * @return {object} watcher doc
  */
  async new(type) {
    try {
      this.savedObjects.Class.defaults = type === 'report' ? this.REPORTWATCHER : this.EMAILWATCHER;
      let watcher = await this.savedObjects.get();
      return this.nestedSource(watcher, this.fields);
    } catch (err) {
      throw new Error(`fail to create new watcher, ${err}`);
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
        return await this.flatSource(watcher).save();
      } catch (err) {
        throw new Error(`fail to save watcher, ${err}`);
      }
    }

    try {
      const savedWatcher = await this.savedObjects.get(watcher._id);
      forEach(watcher._source, (val, key) => {
        savedWatcher[key] = val;
      });
      return savedWatcher.save();
    } catch (err) {
      throw new Error(`fail to save watcher, ${err}`);
    }
  }
}

export default Watcher;
