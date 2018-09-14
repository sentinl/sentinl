import SentinlApi from '../sentinl_api';

class UserService extends SentinlApi {
  constructor($http, $injector, Promise) {
    super('user', $http, $injector);
    this.docType = 'user';
    this.helper = $injector.get('sentinlHelper');
  }

  async new(watcherId, username, password) {
    try {
      return await this.index({ id: watcherId, username, password });
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} new`));
    }
  }
}

export default UserService;
