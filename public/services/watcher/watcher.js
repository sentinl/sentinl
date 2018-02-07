import {isObject, forEach, has} from 'lodash';
import uuid from 'uuid/v4';
import Worker from '../worker/worker';
import emailWatcherDefaults from '../../defaults/email_watcher';
import reportWatcherDefaults from '../../defaults/report_watcher';

/**
* A class to manage Sentinl watchers
*/
class Watcher extends Worker {
  /**
  * Constructor
  *
  * @param {object} $http service
  * @param {object} $injector service
  * @param {object} Promise
  * @param {object} ServerConfig service
  */
  constructor($http, $injector, Promise, ServerConfig) {
    super($http, $injector, Promise, ServerConfig, 'watcher');
    this.$http = $http;
    this.$injector = $injector;
    this.Promise = Promise;
    this.ServerConfig = ServerConfig;
    this.savedObjectsAPI = undefined;
    this.savedWatchers = undefined;
    // Kibi: inject saved objects api related modules if they exist.
    if (this.$injector.has('savedObjectsAPI')) {
      this.savedObjectsAPI = this.$injector.get('savedObjectsAPI');
      if (this.$injector.has('savedWatchers')) {
        this.savedWatchers = this.$injector.get('savedWatchers');
      }
    }
    this.savedObjectsAPIEnabled = isObject(this.savedObjectsAPI) && isObject(this.savedWatchers);
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
  * @param {string} id - watcher id
  * @return {object} ack
  */
  play(id) {
    return this.get(id).then((task) => {
      return this.$http.post('../api/sentinl/watcher/_execute', task).then((resp) => {
        if (resp.status !== 200) {
          throw new Error(`fail to get watcher ${id}`);
        }
        return resp.data;
      });
    });
  }

  /**
  * List existing watchers
  *
  * @param {string} quert search string
  * @return {array} list of all watchers
  */
  list(query = null) {
    return super.list(this.savedWatchers, '../api/sentinl/list', query);
  }

  /**
  * Get watcher object
  *
  * @param {string} id of watcher
  * @return {object} watcher doc
  */
  get(id) {
    // Kibi
    if (this.savedObjectsAPIEnabled) {
      return this.savedWatchers.get(id).then((watcher) => {
        return this.nestedSource(watcher, this.fields);
      }).catch(() => {
        throw new Error(`fail to get watcher ${id}`);
      });
    }
    // Kibana
    return this.$http.get(`../api/sentinl/get/watcher/${id}`).then((response) => {
      if (response.status !== 200) {
        throw new Error(`fail to get watcher ${id}`);
      }
      return response.data;
    });
  }

  /**
  * Create new watcher object
  *
  * @param {string} type of watcher (email watcher, reporter)
  * @return {object} watcher doc
  */
  new(type) {
    // Kibi
    if (this.savedObjectsAPIEnabled) {
      this.savedWatchers.Class.defaults = type === 'report' ? reportWatcherDefaults : emailWatcherDefaults;
      return this.savedWatchers.get().then((watcher) => {
        return this.nestedSource(watcher, this.fields);
      }).catch(() => {
        throw new Error('fail to create new watcher');
      });
    }
    // Kibana
    return this.Promise.resolve({
      _id: uuid(),
      _source: type === 'report' ? reportWatcherDefaults : emailWatcherDefaults,
    });
  }

  /**
  * Save watcher doc
  *
  * @param {object} watcher object
  * @return {string} watcher id
  */
  save(watcher) {
    // Kibi
    if (this.savedObjectsAPIEnabled) {
      if (watcher.hasOwnProperty('save')) {
        return this.flatSource(watcher).save().catch(() => {
          throw new Error(`fail to save watcher ${watcher._id}`);
        });
      }
      return this.savedWatchers.get(watcher._id).then((savedWatcher) => {
        forEach(watcher._source, (val, key) => {
          savedWatcher[key] = val;
        });
        return savedWatcher.save();
      }).catch(() => {
        throw new Error(`fail to save watcher ${watcher._id}`);
      });
    }
    // Kibana
    return this.ServerConfig.get().then((response) => {
      watcher._index = response.data.es.index;
      watcher._type = response.data.es.type;
      return watcher;
    }).then((watcher) => {
      return this.$http.post(`../api/sentinl/watcher/${watcher._id}`, watcher).then((response) => {
        if (response.status !== 200) {
          throw new Error(`fail to save watcher ${watcher._id}`);
        }
        return watcher._id;
      });
    });
  }

  /**
  * Delete watcher doc
  *
  * @param {string} id of deleted watcher
  */
  delete(id) {
    return super.delete(this.savedWatchers, '../api/sentinl/watcher/', id);
  }
}

export default Watcher;
