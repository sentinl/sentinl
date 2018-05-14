class EsService {
  constructor($http, API) {
    this.$http = $http;
    this.API = API;
  }

  /*
  * @return {array} indexes
  */
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

export default EsService;
