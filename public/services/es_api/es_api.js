import { get, cloneDeep } from 'lodash';
import SentinlApi from '../sentinl_api';

class EsApi extends SentinlApi {
  constructor(docType, $http, $injector) {
    super(docType, $http, $injector);
    this.apiType = 'elasticsearchAPI';
    this.docType = docType;
    this.$http = $http;
    this.helper = $injector.get('sentinlHelper');
  }

  async get(id) {
    try {
      const resp = await this.$http.post(`../api/sentinl/${this.docType}/${id}`);
      return resp.data || {};
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} ${this.apiType} get`));
    }
  }

  async list() {
    try {
      const resp = await this.$http.post(`../api/sentinl/list/${this.docType}s`);
      return get(resp, 'data.hits.hits') || [];
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} ${this.apiType} list`));
    }
  }

  async index({id, ...keys}) {
    try {
      let url = `../api/sentinl/${this.docType}`;
      if (id) {
        url += `/${id}`;
      }

      const resp = await this.$http.put(url, {
        body: {...keys}
      });
      return get(resp, 'data._id');
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} ${this.apiType} index`));
    }
  }

  async save(watcher) {
    try {
      return await this.index(watcher);
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} ${this.apiType} save`));
    }
  }

  async delete(id, index) {
    try {
      let url = `../api/sentinl/${this.docType}/${id}`;
      if (index) {
        url += '/' + index;
      }

      const resp = await this.$http.delete(url);
      return get(resp, 'data._id');
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} ${this.apiType} delete`));
    }
  }
}

export default EsApi;
