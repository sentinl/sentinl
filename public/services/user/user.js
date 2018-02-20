/*global angular*/
import { isObject } from 'lodash';
import SavedObjects from '../saved_objects';

class User extends SavedObjects {

  constructor($http, $injector, Promise, ServerConfig) {
    super($http, $injector, Promise, ServerConfig, 'user');
    this.$injector = $injector;
    // Siren: inject saved objects api related modules if they exist.
    this.savedUsersKibana = this.$injector.has('savedUsersKibana') ? this.$injector.get('savedUsersKibana') : null;
    this.savedObjectsAPI = this.$injector.has('savedObjectsAPI') ? this.$injector.get('savedObjectsAPI') : null;
    this.savedUsers = this.$injector.has('savedScripts') ? this.$injector.get('savedUsers') : null;
    this.isSiren = isObject(this.savedObjectsAPI) && isObject(this.savedUsersSiren);
    this.savedObjects = this.savedUsersKibana;
    if (this.isSiren) {
      this.savedObjects = this.savedUsers;
    }
  }

  /**
  * Creates new user.
  *
  * @param {string} id - watcher id.
  * @param {string} username - user name.
  * @param {string} password - user password.
  */
  async new(id, username, password) {
    try {
      const user = await this.savedObjects.get();
      user.id = id;
      user.watcher_id = id;
      user.username = username;
      user.password = password;
      return user.save();
    } catch (err) {
      throw new Error(`fail to create new user ${username} ${id}, ${err}`);
    }
  }
}

export default User;
