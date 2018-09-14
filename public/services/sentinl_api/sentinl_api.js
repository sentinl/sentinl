import { get, pick, cloneDeep } from 'lodash';

class SentinlApi {
  constructor(docType, $http, $injector) {
    if (this.constructor === SentinlApi) {
      throw new TypeError('Abstract class "SentinlApi" cannot be instantiated directly.');
    }
    this.docType = docType;
    this.$http = $http;
    this.helper = $injector.get('sentinlHelper');
  }

  _removeTmpAttributes(attributes) {
    return pick(attributes, Object.keys(attributes).filter(a => !a.startsWith('_')));
  }

  async play(id) {
    try {
      const watcher = await this.get(id);
      const attributes = cloneDeep(watcher);
      attributes.id = id;

      const resp = await this.$http.post('../api/sentinl/watcher/_execute', { attributes });
      return resp.data;
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} play`));
    }
  }

  /**
  * Sets timepicker filter time interval.
  *
  * @param {object} timeInterval - timepicker time.
  */
  async updateFilter(timeInterval) {
    try {
      return await this.$http.get('../api/sentinl/set/interval/' + JSON.stringify(timeInterval).replace(/\//g, '%2F'));
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} update time filter`));
    }
  }

  async get(id) {
    try {
      const resp = await this.$http.post(`../api/sentinl/${this.docType}/${id}`);
      return resp.data || {};
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} get`));
    }
  }

  async list() {
    try {
      const resp = await this.$http.post(`../api/sentinl/list/${this.docType}s`);
      return get(resp, 'data.saved_objects') || [];
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} list`));
    }
  }

  async index({id, ...keys}) {
    try {
      let url = `../api/sentinl/${this.docType}`;
      if (id) {
        url += `/${id}`;
      }

      const resp = await this.$http.put(url, {
        attributes: this._removeTmpAttributes({...keys})
      });
      return get(resp, 'data.id');
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} index`));
    }
  }

  async save(attributes) {
    try {
      return await this.index(attributes);
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} save`));
    }
  }

  async delete(id, index) {
    try {
      let url = `../api/sentinl/${this.docType}/${id}`;
      if (index) {
        url += '/' + index;
      }

      const resp = await this.$http.delete(url);
      return id;
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} delete`));
    }
  }

  new() {
    throw new Error('Should be ovveritten in subclass');
  }
}

export default SentinlApi;
