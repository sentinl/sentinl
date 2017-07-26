/**
* Helper class to get watchers data.
*/
export default class Watcher {

  constructor(client, config) {
    this.client = client;
    this.config = config;
  }

  /**
  * Gets user from user index
  *
  * @param {string} watcherId - watcher _id.
  */
  getUser(watcherId) {
    const options = {
      index: this.config.settings.authentication.user_index,
      type: this.config.settings.authentication.user_type,
      id: watcherId
    };
    return this.client.get(options)
    .then((resp) => resp)
    .catch((err) => err);
  }

  /**
  * Counts watchers.
  */
  getCount() {
    return this.client.count({
      index: this.config.es.default_index,
      type: this.config.es.type
    });
  }

  /**
  * Gets watchers.
  *
  * @param {number} count - number of watchers to get.
  */
  getWatchers(count) {
    return this.client.search({
      index: this.config.es.default_index,
      type: this.config.es.type,
      size: count
    });
  }

  /**
  * Search.
  *
  * @param {string} method - method name.
  * @param {object} request - search query.
  */
  search(method, request) {
    return this.client[method](request);
  }

}
