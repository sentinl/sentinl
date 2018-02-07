import {isObject, forEach, has, map} from 'lodash';
import uuid from 'uuid/v4';

/**
* Parent class for Sentinl watcher and script docs
*/
class Worker {

  /**
  * Constructor
  *
  * @param {object} $http service
  * @param {object} $injector service
  * @param {object} Promise
  * @param {object} ServerConfig service
  * @param {object} type of worker (script or watcher)
  */
  constructor($http, $injector, Promise, ServerConfig, type) {
    this.$http = $http;
    this.$injector = $injector;
    this.ServerConfig = ServerConfig;
    this.savedObjectsAPI = undefined;
    // Kibi: inject saved objects api related modules if they exist.
    if (this.$injector.has('savedObjectsAPI')) {
      this.savedObjectsAPI = this.$injector.get('savedObjectsAPI');
    }
    this.savedObjectsAPIEnabled = isObject(this.savedObjectsAPI);
    this.type = type;
  }

  /**
  * Make flat document
  *
  * @param {object} doc object.
  * @return {object} doc with all properties on level 1
  */
  flatSource(doc) {
    forEach(doc._source, (val, key) => {
      doc[key] = val;
    });
    doc.id = doc._id;
    delete doc._id;
    delete doc._source;
    return doc;
  }

  /**
  * Make nested doc
  *
  * @param {object} watcher object
  * @return {object} watcher with properties on level 2, under '_source' property
  */
  nestedSource(doc, fields) {
    doc._source = {};
    forEach(this.fields, (field) => {
      if (has(doc, field)) doc._source[field] = doc[field];
      delete doc[field];
    });
    doc._id = doc.id;
    delete doc.id;
    return doc;
  }

  /**
  * List all available docs
  *
  * @param {object} savedObjects (savedScripts or savedWatchers)
  * @param {string} uri of API
  * @param {string} query string
  * @param {boolean} removeReservedChars from query string
  * @return {array} list of docs of this.type
  */
  list(savedObjects, uri, query, removeReservedChars = false) {
    // Kibi
    if (this.savedObjectsAPIEnabled) {
      return this.ServerConfig.get().then((config) => {
        return savedObjects.find(query, removeReservedChars, config.data.es.number_of_results);
      }).then((resp) => {
        return map(resp.hits, (watcher) => this.nestedSource(watcher, this.fields));
      }).catch(() => {
        throw new Error(`fail to list ${this.type}s`);
      });
    }
    // Kibana
    return this.$http.get(uri + (query || '')).then((resp) => {
      if (resp.status !== 200) {
        throw new Error(`fail to list ${this.type}s`);
      }
      return resp.data.hits.hits;
    });
  }

  /**
  * Delete single doc
  *
  * @param {object} savedObjects (savedScripts or savedWatchers)
  * @param {string} uri of sentinl API
  * @param {string} id of the doc
  * @return {string} doc id
  */
  delete(savedObjects, uri, id) {
    // Kibi
    if (this.savedObjectsAPIEnabled) {
      return savedObjects.delete(id).then(() => id).catch(() => {
        throw new Error(`fail to delete ${this.type} ` + id);
      });
    }
    // Kibana
    return this.$http.delete(uri + id).then((response) => {
      if (response.status !== 200) {
        throw new Error(`fail to delete ${this.type} ` + id);
      }
      return id;
    });
  }
}

export default Worker;
