import SentinlApi from '../sentinl_api';
import { SentinlError } from '../';

class UserService extends SentinlApi {
  constructor($http, $injector, Promise) {
    super('user', $http, $injector);
    this.docType = 'user';
  }

  async new(watcherId, username, password) {
    try {
      return await this.index({ id: watcherId, username, password });
    } catch (err) {
      throw new SentinlError('create user', err);
    }
  }
}

export default UserService;
