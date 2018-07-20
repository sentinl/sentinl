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
      throw new Error(`fetch index "${index}" mapping: ${err.data.message}`);
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
      throw new Error(`get all indexes: ${err.message}`);
    }
  }
}

export default WatcherWizardEsService;
