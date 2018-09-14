import { getCurrentTime } from './helpers';

export default class SentinlClient {
  constructor(server) {
    this._server = server;
    this._headers = {
      'kbn-xsrf': 'randomword',
      'content-type': 'application/json'
    };
  }

  async _get(type, id) {
    try {
      const resp = await this._server.inject({
        method: 'GET',
        url: `/api/sentinl/${type}/${id}`,
        headers: this._headers
      });
      return resp.result;
    } catch (err) {
      throw new Error(`get ${type}: ${err.toString()}`);
    }
  }

  async _list(type, size) {
    try {
      let url = `/api/sentinl/list/${type}s`;
      if (size) {
        url += `/${size}`;
      }

      const resp = await this._server.inject({
        method: 'GET',
        url,
        headers: this._headers
      });
      return resp.result;
    } catch (err) {
      throw new Error(`list ${type}: ${err.toString()}`);
    }
  }

  async _put(type, attributes, id) {
    try {
      let url = `/api/sentinl/${type}`;
      if (id) {
        url += `/${id}`;
      }

      const resp = await this._server.inject({
        method: 'PUT',
        url,
        headers: this._headers,
        payload: {
          attributes,
        },
      });
      return resp.result;
    } catch (err) {
      throw new Error(`put ${type}: ${err.toString()}`);
    }
  }

  async search(request, method) {
    try {
      const resp = await this._server.inject({
        method: 'POST',
        url: '/api/sentinl/watcher/search',
        headers: this._headers,
        payload: {
          request,
          method
        },
      });
      return JSON.parse(resp.payload);
    } catch (err) {
      throw new Error('watcher search: ' + err.toString());
    }
  }

  getUser(id) {
    return this._get('user', id);
  }

  listWatchers(size) {
    return this._list('watcher', size);
  }

  log({
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

    return this._put('alarm', attributes);
  }
}
