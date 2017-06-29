export default class Watcher {


  constructor(client, config) {
    this.client = client;
    this.config = config;
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
