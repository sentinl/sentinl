/*global angular*/
import { isObject, map, forEach } from 'lodash';

const Script = function ($http, $injector, Watcher) {

  let savedObjectsAPI = undefined;
  let savedScripts = undefined;
  // Kibi: inject saved objects api related modules if they exist.
  if ($injector.has('savedObjectsAPI')) {
    savedObjectsAPI = $injector.get('savedObjectsAPI');
    if ($injector.has('savedScripts')) {
      savedScripts = $injector.get('savedScripts');
    }
  }

  /**
  * Handles watcher script documents.
  */
  return class Script extends Watcher {

    static savedObjectsAPIEnabled = isObject(savedObjectsAPI) && isObject(savedScripts);

    static fields = ['title', 'description', 'body'];

    /**
    * Lists all available scripts.
    *
    * @param {string} type - script type (input, condition or transform).
    */
    static list(type) {
      if (this.savedObjectsAPIEnabled) { // Kibi
        const query = type;
        return this.getConfiguration()
          .then((config) => {
            const removeReservedChars = false;
            return savedScripts.find(query, removeReservedChars, config.data.es.number_of_results)
              .then((response) => {
                return map(response.hits, (watcher) => this.nestedSource(watcher, this.fields));
              });
          });
      } else { // Kibana
        return $http.get(`../api/sentinl/list/scripts/${type}`)
          .then((response) => {
            if (response.status !== 200) {
              throw new Error(`Fail to list scripts of type ${type}`);
            }
            return response.data.hits.hits;
          });
      }
    };

    /**
    * Creates new script of type: input, condition or transform.
    *
    * @param {object} doc - script document.
    */
    static new(doc) {
      if (this.savedObjectsAPIEnabled) { //Kibi
        return savedScripts.get()
          .then((script) => {
            forEach(doc._source, (val, key) => {
              script[key] = val;
            });
            return script.save();
          });
      } else { // Kibana
        return $http.post(`../api/sentinl/save/script/${doc._id}`, doc._source)
          .then((response) => {
            if (response.status !== 200) {
              throw new Error(`Fail to create new script ${doc._id}`);
            }
            return doc._id;
          });
      }
    };

    /**
    * Deletes single script of type: input, condition or transform.
    *
    * @param {string} id - script document id.
    */
    static delete(id) {
      if (this.savedObjectsAPIEnabled) { // Kibi
        return savedScripts.delete(id)
          .then(() => id);
      } else { // Kibana
        return $http.delete(`../api/sentinl/remove/script/${id}`)
          .then((response) => {
            if (response.status !== 200) {
              throw new Error(`Fail to delete script ${id}`);
            }
            return id;
          });
      }
    };
  };

};

Script.$inject = ['$http', '$injector', 'Watcher'];
export default angular.module('apps/sentinl.script', []).factory('Script', Script);
