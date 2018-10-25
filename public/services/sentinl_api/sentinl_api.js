import { get, pick, cloneDeep } from 'lodash';
import { SentinlError } from '../';

class SentinlApi {
  constructor(docType, $http, $injector) {
    if (this.constructor === SentinlApi) {
      throw new TypeError('Abstract class "SentinlApi" cannot be instantiated directly.');
    }
    this.docType = docType;
    this.$http = $http;
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
      throw new SentinlError('execute watcher', err);
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
      throw new SentinlError('update time filter', err);
    }
  }

  async get(id) {
    try {
      const resp = await this.$http.post(`../api/sentinl/${this.docType}/${id}`);
      return resp.data || {};
    } catch (err) {
      throw new SentinlError(`get ${this.docType}`, err);
    }
  }

  async list() {
    try {
      const resp = await this.$http.post(`../api/sentinl/list/${this.docType}s`);
      return get(resp, 'data.saved_objects') || [];
    } catch (err) {
      throw new SentinlError(`list ${this.docType}`, err);
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
      throw new SentinlError(`index ${this.docType}`, err);
    }
  }

  async save(attributes) {
    try {
      return await this.index(attributes);
    } catch (err) {
      throw new SentinlError(`save ${this.docType}`, err);
    }
  }

  async delete(id, index) {
    try {
      let url = `../api/sentinl/${this.docType}/${id}`;
      if (index) {
        url += '/' + index;
      }

      await this.$http.delete(url);
      return id;
    } catch (err) {
      throw new SentinlError(`delete ${this.docType}`, err);
    }
  }

  new() {
    throw new SentinlError('create', new Error('should be ovveritten in subclass'));
  }
}

export default SentinlApi;
