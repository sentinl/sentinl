import { app } from '../app.module';
import _ from 'lodash';

app.factory('Script', ['$http', '$injector', 'Watcher', function ($http, $injector, Watcher) {

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

    static fields = ['title', 'script_type', 'body'];

    /**
    * Lists all available scripts.
    *
    * @param {string} type - script type (input, condition or transform).
    */
    static list(type) {
      if (savedScripts) { // Kibi
        const query = `script_type:${type}`;
        return this.getConfiguration()
          .then((config) => {
            const removeReservedChars = false;
            return savedScripts.find(query, removeReservedChars, config.data.es.number_of_results)
              .then((response) => {
                return _.map(response.hits, (watcher) => this.nestedSource(watcher, this.fields));
              });
          });
      } else { // Kibana
        return $http.get(`../api/sentinl/list/scripts/${type}`)
          .then((response) => {
            if (response.data.ok) {
              return response.data.hits.hits;
            } else {
              throw new Error(`Fail to load watcher scripts.`);
            }
          });
      }
    };

    /**
    * Creates new script of type: input, condition or transform.
    *
    * @param {object} doc - script document.
    */
    static new(doc) {
      if (savedScripts) { //Kibi
        return savedScripts.get()
          .then((script) => {
            _.forEach(doc._source, (val, key) => {
              script[key] = val;
            });
            return script.save();
          });
      } else { // Kibana
        return $http.post(`../api/sentinl/save/script/${doc._id}`, doc._source)
          .then((response) => {
            if (response.data.ok) {
              return doc._id;
            } else {
              throw new Error(`Fail to create new script ${doc._id}.`);
            }
          });
      }
    };

    /**
    * Deletes single script of type: input, condition or transform.
    *
    * @param {string} id - script document id.
    */
    static delete(id) {
      if (savedScripts) { // Kibi
        return savedScripts.delete(id);
      } else { // Kibana
        return $http.delete(`../api/sentinl/remove/script/${id}`)
          .then((response) => {
            if (response.data.ok) {
              return id;
            } else {
              throw new Error(`Fail to delete script ${id}.`);
            }
          });
      }
    };
  };

}]);
