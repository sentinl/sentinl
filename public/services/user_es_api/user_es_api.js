import EsApi from '../es_api';

class UserEsApi extends EsApi {
  constructor($http, $injector) {
    super('user', $http, $injector);
    this.docType = 'user';
    this.helper = $injector.get('sentinlHelper');
    this.config = $injector.get('sentinlConfig');
    this.apiType = this.config.api.type;
  }

  async new(watcherId, username, password) {
    const sha = await this.hash(password);
    try {
      return this.index({ id: watcherId, username, sha });
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} ${this.apiType} new`));
    }
  }
}

export default UserEsApi;
