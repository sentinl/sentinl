import { get } from 'lodash';

class WatcherWizardEsService {
  constructor($http, API) {
    this.$http = $http;
    this.API = API;
  }

  async getMapping(index) {
    try {
      const resp = await this.$http.post(this.API.ES.GET_MAPPING, {index});
      return resp.data;
    } catch (err) {
      err = get(err, 'data.message') || err.toString();
      throw new Error(`EsService fetch index "${index}" mapping: ` + err);
    }
  }

  async getAllIndexes() {
    try {
      const res = await this.$http.get(this.API.ES.ALL_INDEXES);
      if (res.status === 200) {
        return res.data;
      }
      throw new Error(`get all indexes: ${res.status} ${res.statusText}`);
    } catch (err) {
      err = get(err, 'data.message') || err.toString();
      throw new Error('EsService get indices: ' + err);
    }
  }
}

export default WatcherWizardEsService;
