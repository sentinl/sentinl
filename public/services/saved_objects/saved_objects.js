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
  * Get object
  *
  * @param {string} id
  * @return {object} doc
  */
  async get(id) {
    try {
      return await this.savedObjects.get(id);
    } catch (err) {
      throw new Error('SavedObjects get: ' + err.toString());
    }
  }

  /**
  * List all available docs
  *
  * @param {object} savedObjects (savedScripts or savedWatchers)
  * @param {boolean} removeReservedChars from query string
  * @return {array} list of docs of this.type
  */
  async list(query, removeReservedChars = false) {
    try {
      const config = await this.ServerConfig.get();

      let res;
      if (this.isSiren) {
        res = await this.savedObjects.find(query, removeReservedChars, config.data.es.number_of_results);
      } else {
        res = await this.savedObjects.find(query, config.data.es.number_of_results);
      }

      return res.hits;
    } catch (err) {
      throw new Error('SavedObjects list: ' + err.toString());
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
      throw new Error('SavedObjects delete: ' + err.toString());
    }
  }

  async hash(text) {
    try {
      const resp = await this.$http.post('../api/sentinl/hash', { text });
      return resp.data.sha;
    } catch (err) {
      throw new Error('SavedObjects hash text: ' + err.toString());
    }
  }
}

export default SavedObjects;
