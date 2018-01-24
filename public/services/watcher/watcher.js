import { isObject, forEach, has, map } from 'lodash';
import uuid from 'uuid/v4';
import emailWatcherDefaults from '../../defaults/email_watcher';
import reportWatcherDefaults from '../../defaults/report_watcher';

class Watcher {

  constructor($http, $injector, Promise, ServerConfig) {
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
  * Move watcher._source properties 1 level up, under watcher.
  *
  * @param {object} watcher - watcher object.
  */
  flatSource(watcher) {
    forEach(watcher._source, (val, key) => {
      watcher[key] = val;
    });
    watcher.id = watcher._id;
    delete watcher._id;
    delete watcher._source;
    return watcher;
  }

  /**
  * Move watcher properties (filedsToParse and fieldsToNotParse) 1 level down, under watcher._source.
  *
  * @param {object} watcher - watcher object.
  */
  nestedSource(watcher, fields) {
    watcher._source = {};
    forEach(this.fields, (field) => {
      if (has(watcher, field)) watcher._source[field] = watcher[field];
      delete watcher[field];
    });
    watcher._id = watcher.id;
    delete watcher.id;
    return watcher;
  }

  /**
  * Runs watcher on demand.
  *
  * @param {string} id - watcher id
  */
  play(id) {
    return this.get(id).then((task) => {
      return this.$http.post('../api/sentinl/watcher/_execute', task).then(function (response) {
        return response.data;
      });
    });
  }

  /**
  * Lists existing watchers.
  *
  * @param {string} string - search string.
  * @param {integer} number - number of results to return.
  */
  list(string = null) {
    if (this.savedObjectsAPIEnabled) { // Kibi
      return this.ServerConfig.get().then((config) => {
        const removeReservedChars = false;
        return this.savedWatchers.find(string, removeReservedChars, config.data.es.number_of_results).then((response) => {
          return map(response.hits, (watcher) => this.nestedSource(watcher, this.fields));
        });
      });
    } else { // Kibana
      return this.$http.get('../api/sentinl/list').then((response) => {
        if (response.status !== 200) {
          throw new Error('Fail to list watchers');
        }
        return response.data.hits.hits;
      });
    }
  }

  /**
  * Gets watcher object.
  *
  * @param {string} id - watcher id.
  */
  get(id) {
    if (this.savedObjectsAPIEnabled) { // Kibi
      return this.savedWatchers.get(id).then((watcher) => {
        return this.nestedSource(watcher, this.fields);
      });
    } else { // Kibana
      return this.$http.get(`../api/sentinl/get/watcher/${id}`).then((response) => {
        if (response.status !== 200) {
          throw new Error(`Fail to get watcher ${id}`);
        }
        return response.data;
      });
    }
  }

  /**
  * Creates new watcher object.
  *
  * @param {string} type - watcher, reporter.
  */
  new(type) {
    if (this.savedObjectsAPIEnabled) { // Kibi
      if (type === 'report') {
        this.savedWatchers.Class.defaults = reportWatcherDefaults;
      } else {
        this.savedWatchers.Class.defaults = emailWatcherDefaults;
      }
      return this.savedWatchers.get().then((watcher) => this.nestedSource(watcher, this.fields));
    } else { // Kibana
      let watcher = {
        _id: uuid(),
        _source: {}
      };

      if (type === 'report') {
        watcher._source = reportWatcherDefaults;
      } else {
        watcher._source = emailWatcherDefaults;
      }
      return this.Promise.resolve(watcher);
    }
  }

  /**
  * Saves watcher object.
  *
  * @param {object} watcher - watcher object.
  */
  save(watcher) {
    if (this.savedObjectsAPIEnabled) { // Kibi
      if (watcher.hasOwnProperty('save')) {
        return this.flatSource(watcher).save();
      }

      return this.savedWatchers.get(watcher._id).then((savedWatcher) => {
        forEach(watcher._source, (val, key) => {
          savedWatcher[key] = val;
        });
        return savedWatcher.save();
      });
    } else { // Kibana
      return this.ServerConfig.get().then((response) => {
        watcher._index = response.data.es.index;
        watcher._type = response.data.es.type;
        return watcher;
      }).then((watcher) => {
        return this.$http.post(`../api/sentinl/watcher/${watcher._id}`, watcher).then((response) => {
          if (response.status !== 200) {
            throw new Error(`Fail to save watcher ${watcher._id}`);
          }
          return watcher._id;
        });
      });
    }
  }

  /**
  * Deletes watcher object.
  *
  * @param {string} id - watcher id.
  */
  delete(id) {
    if (this.savedObjectsAPIEnabled) { // Kibi
      return this.savedWatchers.delete(id).then(() => id);
    } else { // Kibana
      return this.$http.delete(`../api/sentinl/watcher/${id}`).then((response) => {
        if (response.status !== 200) {
          throw new Error(`Fail to delete watcher ${id}`);
        }
        return id;
      });
    }
  }
}

export default Watcher;
