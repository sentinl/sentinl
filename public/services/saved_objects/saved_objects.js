import {isObject, forEach, has, map} from 'lodash';
import uuid from 'uuid/v4';

/**
* Parent class for Sentinl watcher and script docs
*/
class SavedObjects {

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
    this.type = type;
    this.ServerConfig = ServerConfig;
    this.savedObjectsAPI = this.$injector.has('savedObjectsAPI') ? this.$injector.get('savedObjectsAPI') : null;
    // Kibi: inject saved objects api related modules if they exist.
    this.savedObjects = {};
    this.isSiren = isObject(this.savedObjectsAPI);
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
  * Get object
  *
  * @param {string} id
  * @return {object} doc
  */
  async get(id, fields) {
    try {
      const doc = await this.savedObjects.get(id);
      return this.nestedSource(doc, fields);
    } catch (err) {
      throw new Error(`fail to get doc ${id}, ${err}`);
    }
  }

  /**
  * List all available docs
  *
  * @param {object} savedObjects (savedScripts or savedWatchers)
  * @param {boolean} removeReservedChars from query string
  * @return {array} list of docs of this.type
  */
  //async list(savedObjects, query, removeReservedChars = false) {
  async list(query, removeReservedChars = false) {
    try {
      const config = await this.ServerConfig.get();

      let res;
      if (this.isSiren) {
        res = await this.savedObjects.find(query, removeReservedChars, config.data.es.number_of_results);
      } else {
        res = await this.savedObjects.find(query, config.data.es.number_of_results);
      }

      return map(res.hits, (watcher) => this.nestedSource(watcher, this.fields));
    } catch (err) {
      throw new Error(`fail to list ${this.type}s, ${err}`);
    }
  }

  /**
  * Delete single doc
  *
  * @param {object} savedObjects (savedScripts or savedWatchers)
  * @param {string} id of the doc
  * @return {string} doc id
  */
  async delete(id) {
    try {
      await this.savedObjects.delete(id);
      return id;
    } catch (err) {
      throw new Error(`fail to delete ${this.type} ${id}, ${err}`);
    }
  }
}

export default SavedObjects;
