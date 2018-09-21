import getConfiguration from  '../get_configuration';
import { trimIdTypePrefix } from '../helpers';

export default class SirenSavedObjectsClient {
  constructor(server, request) {
    this._request = request;
    this._config = getConfiguration(server);
    this._client = server.savedObjectsClientFactory({
      callCluster: server.plugins.elasticsearch.getCluster('data')
    });
  }

  addUser(id, attributes) {
    return this.create(this._config.es.user_type, attributes, { id: trimIdTypePrefix(id) });
  }

  find({...args}) {
    return this._client.find({...args}, this._request);
  }

  create(type, attributes, options = {}) {
    options.overwrite = true;
    return this._client.create(type, attributes, options, this._request);
  }

  get(type, id) {
    return this._client.get(type, id, this._request);
  }

  delete(type, id) {
    return this._client.delete(type, id, this._request);
  }
}
