import { isObject, forEach } from 'lodash';
import SavedObjects from '../saved_objects';

/**
* A class to manage Sentinl scripts (input, condition and transform)
*/
class Script extends SavedObjects {
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
    this.savedScriptsKibana = this.$injector.has('savedScriptsKibana') ? this.$injector.get('savedScriptsKibana') : null;
    // Kibi: inject saved objects api related modules if they exist.
    this.savedObjectsAPI = this.$injector.has('savedObjectsAPI') ? this.$injector.get('savedObjectsAPI') : null;
    this.savedScripts = this.$injector.has('savedScripts') ? this.$injector.get('savedScripts') : null;
    this.isSiren = isObject(this.savedObjectsAPI) && isObject(this.savedScripts);
    this.savedObjects = this.savedScriptsKibana;
    if (this.isSiren) {
      this.savedObjects = this.savedScripts;
    }
    this.fields = ['title', 'description', 'body'];
  }

  /**
  * Create new script (input, condition or transform)
  *
  * @param {object} doc of script
  * @return {string} script id
  */
  async new(doc) {
    try {
      const script = await this.savedObjects.get();
      forEach(doc._source, (val, key) => {
        script[key] = val;
      });
      return await script.save();
    } catch (err) {
      throw new Error(`fail to create script ${doc.id}, ${err}`);
    }
  }
}

export default Script;
