import { get } from 'lodash';

class WatcherWizardEsService {
  constructor($http, API, sentinlHelper) {
    this.$http = $http;
    this.API = API;
    this.sentinlHelper = sentinlHelper;
  }

  async getMapping(index) {
    try {
      const resp = await this.$http.post(this.API.ES.GET_MAPPING, {index});
      return resp.data;
    } catch (err) {
      throw new Error(this.sentinlHelper.apiErrMsg(err, `EsService fetch index "${index}" mapping`));
    }
  }

  async getAllIndexes() {
    try {
      const res = await this.$http.get(this.API.ES.ALL_INDEXES);
      return res.data;
    } catch (err) {
      throw new Error(this.sentinlHelper.apiErrMsg(err, 'EsService get all indexes'));
    }
  }
}

export default WatcherWizardEsService;
