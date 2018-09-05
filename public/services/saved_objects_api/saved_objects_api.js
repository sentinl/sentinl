import { isObject, get, cloneDeep, assign } from 'lodash';
import SentinlApi from '../sentinl_api';

class SavedObjectsApi extends SentinlApi {
  constructor(docType, $http, $injector) {
    super(docType, $http, $injector);
    this.apiType = 'savedObjectsAPI';
    this.docType = docType;
    this.config = $injector.get('sentinlConfig');
    this.helper = $injector.get('sentinlHelper');

    if ($injector.has(`saved${this.helper.firstLetterToUpperCase(docType)}sKibana`)) {
      this.savedObjects = $injector.get(`saved${this.helper.firstLetterToUpperCase(docType)}sKibana`);
    }

    if ($injector.has('savedObjectsAPI')) { // Siren
      this.isSiren = true;
      this.savedObjects = $injector.get(`saved${this.helper.firstLetterToUpperCase(docType)}s`);
    }
  }

  async get(id) {
    try {
      return await this.savedObjects.get(id);
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} ${this.apiType} get`));
    }
  }

  async list(query, removeReservedChars = false) {
    try {
      let res;
      if (this.isSiren) {
        res = await this.savedObjects.find(query, removeReservedChars, this.config.es.number_of_results);
      } else {
        res = await this.savedObjects.find(query, this.config.es.number_of_results);
      }

      return res.hits;
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} ${this.apiType} list`));
    }
  }

  async delete(id) {
    try {
      await this.savedObjects.delete(id);
      return id;
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} ${this.apiType} delete`));
    }
  }

  async save(obj) {
    if (obj.hasOwnProperty('save')) {
      try {
        return await obj.save();
      } catch (err) {
        throw new Error(this.helper.apiErrMsg(err, `${this.docType} ${this.apiType} save`));
      }
    }

    try {
      const savedObj = await this.savedObjects.get(obj.id);
      assign(savedObj, obj);
      return await savedObj.save();
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} ${this.apiType} save`));
    }
  }
}

export default SavedObjectsApi;
