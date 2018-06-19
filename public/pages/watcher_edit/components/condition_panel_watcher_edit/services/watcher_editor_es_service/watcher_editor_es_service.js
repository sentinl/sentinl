class WatcherEditorEsService {
  constructor($http, API) {
    this.$http = $http;
    this.API = API;
  }

  async getMapping(index) {
    try {
      const resp = await this.$http.post(this.API.ES.GET_MAPPING, {index});
      return resp.data;
    } catch (err) {
      throw new Error(`fetch index ${index} mapping: ${err.message}`);
    }
  }
}

export default WatcherEditorEsService;
