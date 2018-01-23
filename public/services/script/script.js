import { isObject, map, forEach } from 'lodash';

class Script {

  constructor($http, $injector, ServerConfig) {
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
  * Lists all available scripts.
  *
  * @param {string} type - script type (input, condition or transform).
  */
  list(type) {
    if (this.savedObjectsAPIEnabled) { // Kibi
      const query = type;
      return this.ServerConfig.get().then((config) => {
        const removeReservedChars = false;
        return this.savedScripts.find(query, removeReservedChars, config.data.es.number_of_results).then((response) => {
          return map(response.hits, (watcher) => this.nestedSource(watcher, this.fields));
        });
      });
    } else { // Kibana
      return this.$http.get(`../api/sentinl/list/scripts/${type}`).then((response) => {
        if (response.status !== 200) {
          throw new Error(`Fail to list scripts of type ${type}`);
        }
        return response.data.hits.hits;
      });
    }
  }

  /**
  * Creates new script of type: input, condition or transform.
  *
  * @param {object} doc - script document.
  */
  new(doc) {
    if (this.savedObjectsAPIEnabled) { //Kibi
      return this.savedScripts.get()
        .then((script) => {
          forEach(doc._source, (val, key) => {
            script[key] = val;
          });
          return script.save();
        });
    } else { // Kibana
      return this.$http.post(`../api/sentinl/save/script/${doc._id}`, doc._source)
        .then((response) => {
          if (response.status !== 200) {
            throw new Error(`Fail to create new script ${doc._id}`);
          }
          return doc._id;
        });
    }
  }

  /**
  * Deletes single script of type: input, condition or transform.
  *
  * @param {string} id - script document id.
  */
  delete(id) {
    if (this.savedObjectsAPIEnabled) { // Kibi
      return this.savedScripts.delete(id)
        .then(() => id);
    } else { // Kibana
      return this.$http.delete(`../api/sentinl/remove/script/${id}`)
        .then((response) => {
          if (response.status !== 200) {
            throw new Error(`Fail to delete script ${id}`);
          }
          return id;
        });
    }
  }
}

export default Script;
