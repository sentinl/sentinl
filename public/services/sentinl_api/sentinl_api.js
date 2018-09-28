import { get } from 'lodash';

class SentinlApi {
  constructor(docType, $http, $injector) {
    if (this.constructor === SentinlApi) {
      throw new TypeError('Abstract class "SentinlApi" cannot be instantiated directly.');
    }
    this.docType = docType;
    this.apiType = 'SentinlAPI';
    this.$http = $http;
    this.helper = $injector.get('sentinlHelper');
  }

  async hash(text) {
    try {
      const resp = await this.$http.post('../api/sentinl/hash', { text });
      return get(resp, 'data.sha');
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} ${this.apiType} hash text`));
    }
  }

  async play(id) {
    try {
      const watcher = await this.get(id);
      const resp = await this.$http.post('../api/sentinl/watcher/_execute', {
        _id: watcher.id,
        _source: this.helper.pickWatcherSource(watcher)
      });
      return resp.data;
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} ${this.apiType} play`));
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
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} ${this.apiType} update time filter`));
    }
  }

  get() {
    throw new Error('Should be ovveritten in subclass');
  }

  list() {
    throw new Error('Should be ovveritten in subclass');
  }

  index() {
    throw new Error('Should be ovveritten in subclass');
  }

  save() {
    throw new Error('Should be ovveritten in subclass');
  }

  delete() {
    throw new Error('Should be ovveritten in subclass');
  }

  new() {
    throw new Error('Should be ovveritten in subclass');
  }
}

export default SentinlApi;
