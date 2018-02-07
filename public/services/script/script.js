import { isObject, map, forEach } from 'lodash';
import Worker from '../worker/worker';

/**
* A class to manage Sentinl scripts (input, condition and transform)
*/
class Script extends Worker {
  /**
  * Constructor
  *
  * @param {object} $http service
  * @param {object} $injector service
  * @param {object} Promise
  * @param {object} ServerConfig service
  */
  constructor($http, $injector, Promise, ServerConfig) {
    super($http, $injector, Promise, ServerConfig, 'script');
    this.$http = $http;
    this.$injector = $injector;
    this.ServerConfig = ServerConfig;
    this.savedObjectsAPI = undefined;
    this.savedScripts = undefined;
    // Kibi: inject saved objects api related modules if they exist.
    if (this.$injector.has('savedObjectsAPI')) {
      this.savedObjectsAPI = this.$injector.get('savedObjectsAPI');
      if (this.$injector.has('savedScripts')) {
        this.savedScripts = this.$injector.get('savedScripts');
      }
    }
    this.savedObjectsAPIEnabled = isObject(this.savedObjectsAPI) && isObject(this.savedScripts);
    this.fields = ['title', 'description', 'body'];
  }

  /**
  * List all available scripts
  *
  * @param {string} query string (input, condition or transform).
  * @return {array} list of scrips
  */
  list(query) {
    return super.list(this.savedScripts, '../api/sentinl/list/scripts/', query);
  }

  /**
  * Create new script (input, condition or transform)
  *
  * @param {object} script doc
  * @return {string} script id
  */
  new(script) {
    // Kibi
    if (this.savedObjectsAPIEnabled) {
      return this.savedScripts.get().then((script) => {
        forEach(script._source, (val, key) => {
          script[key] = val;
        });
        return script.save().then(() => {
          return script.id;
        });
      }).catch(() => {
        throw new Error('fail to create script ' + script.id);
      });
    }
    // Kibana
    return this.$http.post(`../api/sentinl/save/script/${script._id}`, script._source).then((response) => {
      if (response.status !== 200) {
        throw new Error('fail to create script ' + script._id);
      }
      return script._id;
    });
  }

  /**
  * Deletes single script of type: input, condition or transform.
  *
  * @param {string} script id
  * @return {string} script id
  */
  delete(id) {
    return super.delete(this.savedScripts, '../api/sentinl/remove/script/', id);
  }
}

export default Script;
