/*global angular*/
import { isObject } from 'lodash';

const User = function ($http, $injector) {

  let savedObjectsAPI = undefined;
  let savedUsers = undefined;
  // Kibi: inject saved objects api related modules if they exist.
  if ($injector.has('savedObjectsAPI')) {
    savedObjectsAPI = $injector.get('savedObjectsAPI');
    if ($injector.has('savedScripts')) {
      savedUsers = $injector.get('savedUsers');
    }
  }

  /**
  * Handles users for watcher impersonation.
  */
  return class User {

    static savedObjectsAPIEnabled = isObject(savedObjectsAPI) && isObject(savedUsers);

    /**
    * Creates new user.
    *
    * @param {string} id - watcher id.
    * @param {string} username - user name.
    * @param {string} password - user password.
    */
    static new(id, username, password) {
      if (this.savedObjectsAPIEnabled) {
        return savedUsers.get()
          .then((user) => {
            user.id = id;
            user.watcher_id = id;
            user.username = username;
            user.password = password;
            return user.save();
          });
      } else {
        return $http.post(`../api/sentinl/user/${id}/${username}/${password}`)
          .then((response) => {
            if (response.status !== 200) {
              throw new Error(`Fail to create user ${username}/${id}`);
            }
            return id;
          });
      }
    };

  };

};

User.$inject = ['$http', '$injector'];
export default angular.module('apps/sentinl.user', []).factory('User', User);
