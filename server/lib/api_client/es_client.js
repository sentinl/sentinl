import uuid from 'uuid';
import getConfiguration from  '../get_configuration';
import getElasticsearchClient from '../get_elasticsearch_client';
import { getCurrentTime } from '../helpers';

export default class EsApi {
  constructor(server) {
    this._config = getConfiguration(server);
    this._client = getElasticsearchClient({server, config: this._config});
    this._rootType = this._config.es.default_type;
  }

  /**
   * @returns {promise} - { hits: { hits: [...docs] }, total }
   */
  async search(body, method = 'search') {
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
        const { type, updated_at: updatedAt } = hit._source;
        return {
          id: this._trimIdTypePrefix(hit._id, type),
          _index: hit._index,
          type,
          ...updatedAt && { updated_at: updatedAt },
          version: hit._version,
          attributes: hit._source[type] ? hit._source[type] : hit._source,
        };
      }),
    };
  }

  /**
   * @returns {promise} - { id, type, version, attributes }
  */
  async create(type, attributes = {}, options = { id: undefined, overwrite: true }, index, isAlarm) {
    const { id, overwrite } = options;
    const method = id && !overwrite ? 'create' : 'index';
    const time = getCurrentTime();

    let body = {
      type: type,
      updated_at: time,
      [type]: attributes
    };

    if (isAlarm) {
      body = attributes;
      body.type = type;
      body.updated_at = time;
    }

    const esOptions = {
      id: this._generateId(type, id),
      type: isAlarm ? type : this._rootType,
      index,
      refresh: 'wait_for',
      body
    };

    const resp = await this._client[method](esOptions);

    return {
      id: this._trimIdTypePrefix(resp._id, type),
      type: type,
      updated_at: time,
      version: resp._version,
      attributes
    };
  }

  /**
   * @returns {promise}
   */
  async delete(type, id, index, isAlarm) { // alarm id doesn't contain type prefic for backward compatibility
    const esOptions = {
      id: isAlarm ? id : this._generateId(type, id),
      type: isAlarm ? type : this._rootType,
      index,
      refresh: 'wait_for',
      ignore: [404],
    };

    const resp = await this._client.delete(esOptions);

    if (resp.result === 'deleted') {
      return {};
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

    const resp = await this._client.get(esOptions);
    const { updated_at: updatedAt } = resp._source;

    return {
      id,
      type: type,
      ...updatedAt && { updated_at: updatedAt },
      version: resp._version,
      attributes: resp._source[type] ? resp._source[type] : resp._source,
    };
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
