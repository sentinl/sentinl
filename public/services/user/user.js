/*global angular*/
import { isObject } from 'lodash';

class User {

  constructor($http, $injector) {
    this.$http = $http;
    this.$injector = $injector;
    this.savedObjectsAPI = undefined;
    this.savedUsers = undefined;
    // Kibi: inject saved objects api related modules if they exist.
    if (this.$injector.has('savedObjectsAPI')) {
      this.savedObjectsAPI = this.$injector.get('savedObjectsAPI');
      if (this.$injector.has('savedScripts')) {
        this.savedUsers = this.$injector.get('savedUsers');
      }
    }
    this.savedObjectsAPIEnabled = isObject(this.savedObjectsAPI) && isObject(this.savedUsers);
  }

  /**
  * Creates new user.
  *
  * @param {string} id - watcher id.
  * @param {string} username - user name.
  * @param {string} password - user password.
  */
  new(id, username, password) {
    if (this.savedObjectsAPIEnabled) {
      return this.savedUsers.get()
        .then((user) => {
          user.id = id;
          user.watcher_id = id;
          user.username = username;
          user.password = password;
          return user.save();
        });
    } else {
      return this.$http.post(`../api/sentinl/user/${id}/${username}/${password}`)
        .then((response) => {
          if (response.status !== 200) {
            throw new Error(`Fail to create user ${username}/${id}`);
          }
          return id;
        });
    }
  }
}

export default User;
