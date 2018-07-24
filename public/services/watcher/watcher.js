import { isObject, forEach, has, cloneDeep } from 'lodash';
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
      const check = await this.check(watcher);
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
      this.savedObjects.Class.defaults = type === 'report' ? cloneDeep(this.REPORTWATCHER) : cloneDeep(this.EMAILWATCHER);
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
      return await savedWatcher.save();
    } catch (err) {
      throw new Error(`fail to save watcher, ${err}`);
    }
  }

  /**
   * Check watcher access
   * Simple get request for indices, if it returns error on any, it should return false
   * 
   * @param {object} watcher object
   * @return {boolean} ok or not to create watcher for indices
   */
  async check(watcher) {
    try {
      const config = await this.ServerConfig.get();
      if (config.authenticate) {
        if (config.authenticate.provider) {
          console.log(JSON.stringify(config.authenticate), JSON.stringify(watcher));
          switch (config.authenticate.provider) {
            case 'sg':
              console.log('SG detected, performing search request.');
              // for each index, perform a simple search request

              break;
            case 'xp':
              console.log('XP detected, performing search request.');
              break;
            default:
              console.log('In defalt: ', JSON.stringify(config.authenticate));
              break;
          }
          return true;
        }
      }
    } catch (err) {
      throw new Error(`fail to check access for indices ${err}`);
    }
  }

}

export default Watcher;
