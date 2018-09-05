import SavedObjectsApi from '../saved_objects_api';

class UserSavedObjectsApi extends SavedObjectsApi {
  constructor($http, $injector) {
    super('user', $http, $injector);
    this.docType = 'user';
    this.helper = $injector.get('sentinlHelper');
    this.config = $injector.get('sentinlConfig');
    this.apiType =  this.config.api.type;
  }

  async new(watcherId, username, password) {
    try {
      const sha = await this.hash(password);
      const user = await this.get();
      user.username = username;
      user.id = this.helper.createUserId(watcherId);
      if (this.isSiren) {
        user.password = password; // password hashed by the Siren saved_objects_api middleware
      } else {
        user.sha = sha;
      }
      return await user.save();
    } catch (err) {
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} ${this.apiType} new`));
    }
  }
}

export default UserSavedObjectsApi;
