import uuid from 'uuid';
import getConfiguration from  '../get_configuration';
import getElasticsearchClient from '../get_elasticsearch_client';
import { getCurrentTime, flatAttributes } from '../helpers';
import { isKibi } from '../helpers';

export default class EsApi {
  constructor(server) {
    this._server = server;
    this._config = getConfiguration(server);
    this._client = getElasticsearchClient({server, config: this._config});
    this._rootType = this._config.es.default_type;
  }

  getMapping(index) {
    return this._client.indices.getMapping({ index });
  }

  getIndices(format = 'json') {
    return this._client.cat.indices({ format });
  }

  async impersonate(watcherId) {
    try {
      const id = this._trimIdTypePrefix(watcherId, this._config.es.watcher_type);
      let user = await this.get(this._config.es.user_type, id, this._config.es.default_index);

      if (!user.id) {
        throw new Error('user was not found');
      }

      user = flatAttributes(user);

      this._client = getElasticsearchClient({
        server: this._server,
        config: this._config,
        impersonateUsername: user.username,
        impersonateSha: user.sha,
        impersonatePassword: user.password,
        impersonateId: user.id,
        isSiren: isKibi(this._server),
      });
    } catch (err) {
      throw new Error('impersonate: ' + err.toString());
    }
  }

  async listWatchers(size) {
    try {
      const resp = await this.find({
        index: this._config.es.default_index,
        type: this._config.es.watcher_type,
        perPage: size || this._config.es.results,
      });

      resp.saved_objects = resp.saved_objects.map(flatAttributes);

      return resp;
    } catch (err) {
      throw new Error('EsApi list watchers: ' + err.toString());
    }
  }

  addUser(id, attributes) {
    return this.create(this._config.es.user_type, attributes, { id, overwrite: true }, this._config.es.default_index);
  }

  async logAlarm({
    watcherTitle,
    actionName,
    message,
    level = 'info',
    isReport = false,
    isError = false,
    attachment = null,
    payload = null,
  }) {
    const attributes = {
      '@timestamp': getCurrentTime(),
      error: isError,
      report: isReport,
      watcher: watcherTitle,
      action: actionName || 'unknown action',
      level,
      message
    };

    if (attachment) {
      attributes.attachment = attachment;
    }

    if (payload) {
      attributes.payload = payload;
    }

    try {
      const resp = await this.create(this._config.es.alarm_type, attributes, { overwrite: true }, this._config.es.alarm_index, true);
      return resp;
    } catch (err) {
      throw new Error('EsApi log alarm: ' + err.toString());
    }
  }

  /**
   * @returns {promise} - { hits: { hits: [...docs] }, total }
   */
  async search(body, method = 'search') {
    try {
      const resp = await this._client[method](body);

      if (resp.status === 404) {
        return {
          total: 0,
          hits: {
            hits: []
          }
        };
      }

      return resp;
    } catch (err) {
      throw new Error('EsApi search: ' + err.toString());
    }
  }

  /**
   * @returns {promise} - { saved_objects: [{ id, type, attributes }], total, per_page, page }
   */
  async find({
    index,
    type,
    page = 1,
    perPage = 20,
    sortField,
    sortOrder = 'asc',
    method = 'search',
    body,
  }) {
    const esOptions = {
      index,
      size: perPage,
      from: perPage * (page - 1),
      ignore: [404],
      body: body || {
        query: {
          bool: {
            filter: [
              {
                exists: {
                  field: type
                }
              }
            ]
          }
        }
      }
    };

    if (sortField) {
      esOptions.body.sort = [
        {
          [sortField]: {
            order: sortOrder
          }
        }
      ];
    }

    try {
      const resp = await this._client[method](esOptions);

      if (resp.status === 404) {
        return {
          page,
          per_page: perPage,
          total: 0,
          saved_objects: []
        };
      }

      return {
        page,
        per_page: perPage,
        total: resp.hits.total,
        saved_objects: resp.hits.hits.map(hit => {
          return {
            id: this._trimIdTypePrefix(hit._id, type),
            _index: hit._index,
            type,
            version: hit._version,
            attributes: hit._source[type] ? hit._source[type] : hit._source,
          };
        }),
      };
    } catch (err) {
      throw new Error('EsApi find: ' + err.toString());
    }
  }

  /**
   * @returns {promise} - { id, type, version, attributes }
  */
  async create(type, attributes = {}, options = { id: undefined, overwrite: true }, index) {
    const { id, overwrite } = options;
    const method = id && !overwrite ? 'create' : 'index';
    const isAlarm = type === this._config.es.alarm_type;

    let body = {
      type: type,
      [type]: attributes
    };

    if (isAlarm) {
      body = attributes;
      body.type = type;
    }

    const esOptions = {
      id: isAlarm ? id : this._generateId(type, id), // alarm id doesn't contain type prefic for backward compatibility
      type: isAlarm ? type : this._rootType, // alarm root type is not doc, it is set via config.es.alarm_type for backward compatibility
      index,
      refresh: true,
      body
    };

    try {
      const resp = await this._client[method](esOptions);

      return {
        id: this._trimIdTypePrefix(resp._id, type),
        type,
        version: resp._version,
        attributes
      };
    } catch (err) {
      throw new Error('EsApi create: ' + err.toString());
    }
  }

  /**
   * @returns {promise}
   */
  async delete(type, id, index) {
    const isAlarm = type === this._config.es.alarm_type;
    const esOptions = {
      id: isAlarm ? id : this._generateId(type, id), // alarm id doesn't contain type prefic for backward compatibility
      type: isAlarm ? type : this._rootType, // alarm root type is not doc, it is set via config.es.alarm_type for backward compatibility
      index,
      refresh: true,
      ignore: [404],
    };

    try {
      const resp = await this._client.delete(esOptions);

      if (resp.result === 'deleted') {
        return {};
      }

      if (resp.result === 'not_found') {
        throw new Error('not found: ' + id);
      }
    } catch (err) {
      throw new Error('EsApi delete: ' + err.toString());
    }
  }

  /**
   * @returns {promise} - { id, type, version, attributes }
   */
  async get(type, id, index) {
    const esOptions = {
      id: this._generateId(type, id),
      type: this._rootType,
      index,
      ignore: [404]
    };

    try {
      const resp = await this._client.get(esOptions);

      return {
        id,
        type,
        version: resp._version,
        attributes: resp._source[type] ? resp._source[type] : resp._source,
      };
    } catch (err) {
      throw new Error('EsApi get: ' + err.toString());
    }
  }

  _trimIdTypePrefix(id, type) {
    const prefix = type + ':';
    if (!id.startsWith(prefix)) {
      return id;
    }
    return id.slice(prefix.length);
  }

  _generateId(type, id) {
    return `${type}:${id || uuid.v1()}`;
  }
}
