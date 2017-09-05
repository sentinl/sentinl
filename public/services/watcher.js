import { app } from '../app.module';
import _ from 'lodash';
import emailWatcherDefaults from '../defaults/email_watcher';
import reportWatcherDefaults from '../defaults/report_watcher';

app.factory('Watcher', ['$http', '$injector', 'Promise', function ($http, $injector, Promise) {

  let savedObjectsAPI = undefined;
  let savedWatchers = undefined;
  // Kibi: inject saved objects api related modules if they exist.
  if ($injector.has('savedObjectsAPI')) {
    savedObjectsAPI = $injector.get('savedObjectsAPI');
    if ($injector.has('savedWatchers')) {
      savedWatchers = $injector.get('savedWatchers');
    }
  }

  return class Watcher {

    static savedObjectsAPIEnabled = _.isObject(savedObjectsAPI) && _.isObject(savedWatchers);

    static fields = [
      'actions', 'input',
      'condition', 'transform',
      'trigger', 'disable',
      'report', 'title'
    ];

    /**
    * Creates id for a new watcher.
    */
    static createId = function () {
      return Math.random().toString(36).substr(2, 100) + '-'
        + Math.random().toString(36).substr(2, 100) + '-'
        + Math.random().toString(36).substr(2, 100);
    }

    /**
    * Move watcher._source properties 1 level up, under watcher.
    *
    * @param {object} watcher - watcher object.
    */
    static flatSource(watcher) {
      _.forEach(watcher._source, (val, key) => {
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
    static nestedSource(watcher, fields) {
      watcher._source = {};
      _.forEach(this.fields, (field) => {
        if (_.has(watcher, field)) watcher._source[field] = watcher[field];
        delete watcher[field];
      });
      watcher._id = watcher.id;
      delete watcher.id;
      return watcher;
    }

    /**
    * Gets some of Sentinl configuration settings.
    */
    static getConfiguration() {
      return $http.get('../api/sentinl/config')
        .then((response) => {
          if (response.status !== 200) {
            throw new Error('Fail to get Sentinl configuration');
          }
          return response;
        });
    }

    /**
    * Lists existing watchers.
    *
    * @param {string} string - search string.
    * @param {integer} number - number of results to return.
    */
    static list(string = null) {
      if (this.savedObjectsAPIEnabled) { // Kibi
        return this.getConfiguration()
          .then((config) => {
            const removeReservedChars = false;
            return savedWatchers.find(string, removeReservedChars, config.data.es.number_of_results)
              .then((response) => {
                return _.map(response.hits, (watcher) => this.nestedSource(watcher, this.fields));
              });
          });
      } else { // Kibana
        return $http.get('../api/sentinl/list')
          .then((response) => {
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
    static get(id) {
      if (this.savedObjectsAPIEnabled) { // Kibi
        return savedWatchers.get(id)
          .then((watcher) => {
            return this.nestedSource(watcher, this.fields);
          });
      } else { // Kibana
        return $http.get(`../api/sentinl/get/watcher/${id}`)
          .then((response) => {
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
    static new(type) {
      if (this.savedObjectsAPIEnabled) { // Kibi
        if (type === 'report') {
          savedWatchers.Class.defaults = reportWatcherDefaults;
        } else {
          savedWatchers.Class.defaults = emailWatcherDefaults;
        }

        return savedWatchers.get()
          .then((watcher) => {
            return this.nestedSource(watcher, this.fields);
          });
      } else { // Kibana
        let watcher = {
          _id: this.createId(),
          _source: {}
        };

        if (type === 'report') {
          watcher._source = reportWatcherDefaults;
        } else {
          watcher._source = emailWatcherDefaults;
        }

        return Promise.resolve(watcher);
      }
    }

    /**
    * Saves watcher object.
    *
    * @param {object} watcher - watcher object.
    */
    static save(watcher) {
      if (this.savedObjectsAPIEnabled) { // Kibi
        if (watcher.hasOwnProperty('save')) {
          return this.flatSource(watcher).save();
        }

        return savedWatchers.get(watcher._id)
          .then((savedWatcher) => {
            _.forEach(watcher._source, (val, key) => {
              savedWatcher[key] = val;
            });
            return savedWatcher.save();
          });
      } else { // Kibana
        return this.getConfiguration()
          .then((response) => {
            watcher._index = response.data.es.index;
            watcher._type = response.data.es.type;
            return watcher;
          })
          .then((watcher) => {
            return $http.post(`../api/sentinl/watcher/${watcher._id}`, watcher)
              .then((response) => {
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
    static delete(id) {
      if (this.savedObjectsAPIEnabled) { // Kibi
        return savedWatchers.delete(id).then(() => id);
      } else { // Kibana
        return $http.delete(`../api/sentinl/watcher/${id}`)
          .then((response) => {
            if (response.status !== 200) {
              throw new Error(`Fail to delete watcher ${id}`);
            }
            return id;
          });
      }
    }

  };
}]);
