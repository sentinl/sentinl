import { get } from 'lodash';
import { SentinlError } from '../../../../services';

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
      throw new SentinlError(`fetch index '${index}' mapping`, err);
    }
  }

  async getAllIndexes() {
    try {
      const res = await this.$http.get(this.API.ES.ALL_INDEXES);
      return res.data;
    } catch (err) {
      throw new SentinlError('get all indexes', err);
    }
  }
}

export default WatcherWizardEsService;
