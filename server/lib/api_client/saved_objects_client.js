import getConfiguration from  '../get_configuration';

export default class SavedObjectsClient {
  constructor(server, request) {
    const { callWithRequest } = server.plugins.elasticsearch.getCluster('admin');
    const callCluster = (...args) => callWithRequest(request, ...args);

    this._config = getConfiguration(server);

    if (server.savedObjectsClientFactory) {
      this._client = server.savedObjectsClientFactory({ callCluster });
    } else {
      this._client = server.savedObjects.getScopedSavedObjectsClient(); // Kibana v6.4.2
    }
  }

  addUser(id, attributes) {
    return this.create(this._config.es.user_type, attributes, { id });
  }

  find({...args}) {
    return this._client.find({...args});
  }

  create(type, attributes, options = {}) {
    options.overwrite = true;
    return this._client.create(type, attributes, options);
  }

  get(type, id) {
    return this._client.get(type, id);
  }

  delete(type, id) {
    return this._client.delete(type, id);
  }
}
