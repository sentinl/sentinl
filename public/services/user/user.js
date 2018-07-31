/*global angular*/
import { isObject } from 'lodash';
import SavedObjects from '../saved_objects';

class User extends SavedObjects {

  constructor($http, $injector, Promise, ServerConfig, sentinlLog) {
    super($http, $injector, Promise, ServerConfig, 'user');
    this.$injector = $injector;
    // Siren: inject saved objects api related modules if they exist.
    this.savedUsersKibana = this.$injector.has('savedUsersKibana') ? this.$injector.get('savedUsersKibana') : null;
    this.savedObjectsAPI = this.$injector.has('savedObjectsAPI') ? this.$injector.get('savedObjectsAPI') : null;
    this.savedUsers = this.$injector.has('savedUsers') ? this.$injector.get('savedUsers') : null;
    this.isSiren = isObject(this.savedObjectsAPI) && isObject(this.savedUsers);
    this.savedObjects = this.savedUsersKibana;
    if (this.isSiren) {
      this.savedObjects = this.savedUsers;
    }
    this.log = sentinlLog;
    this.log.initLocation('User');
  }

  /**
   * Creates new user.
   *
   * @param {string} id of watcher.
   * @param {string} username
   * @param {string} password
   */
  async new(id, username, password) {
    try {
      const user = await this.savedObjects.get();
      user.id = id; // sentinl-user:id, where id is id of watcher
      user.username = username;
      if (this.isSiren) {
        user.password = password; // password hashed by the Siren saved_objects_api middleware
      } else {
        user.sha = await this.hash(password);
      }
      return await user.save();
    } catch (err) {
      throw new Error(`create new user "${username}" for watcher "${id}": ${err.message || err.statusText}`);
    }
  }

  /**
   * get username by id
   *
   * @param {string} id of watcher or user
   * @return {object} username
   */
  async username(id) {
    try {
      const resp = await this.$http.post('../api/sentinl/user/username', {id});
      return resp.data;
    } catch (err) {
      if (err.status === 404) {
        this.log.warn(`user "${id}" was not found`);
      } else {
        throw new Error(`get username of "${id}": ${err.message || err.statusText}`);
      }
    }
  }
}

export default User;
