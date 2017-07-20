export default class Watcher {

  constructor(client, config) {
    this.client = client;
    this.config = config;
  }

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

  getCount() {
    return this.client.count({
      index: this.config.es.default_index,
      type: this.config.es.type
    });
  }

  getWatchers(count) {
    return this.client.search({
      index: this.config.es.default_index,
      type: this.config.es.type,
      size: count
    });
  }

  search(method, request) {
    return this.client[method](request);
  }

}
