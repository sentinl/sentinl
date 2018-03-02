import { cloneDeep } from 'lodash';
import Crypto from '../classes/crypto';
import getConfiguration from '../get_configuration';

/**
 * Middleware for the saved objects API plugin.
 */
export default class SavedObjectsAPIMiddleware {

  constructor(server) {
    this._server = server;
    this._crypto = new Crypto(getConfiguration(server).settings.authentication.encryption);
  }

  /**
   * If the object is a user and it contains a password field,
   * removes the password field and adds a sha field with the encrypted password.
   *
   * @param {String} type - Object type.
   * @param {String} id - Optional object id.
   * @param {Object} body - HAPI request body.
   * @return {Object}
   * @private
   */
  encryptUserPassword(model, id, body) {
    if (model.type === 'sentinl-user' && body) {
      const modified = cloneDeep(body);
      if (body.password) {
        modified.sha = this._crypto.encrypt(body.password);
        modified.password = null;
        return {
          body: modified
        };
      }
    }
  }

  async createRequest(model, id, body, request) {
    return this.encryptUserPassword(model, id, body);
  }

  async createResponse(model, id, body, request, response) {
  }

  async updateRequest(model, id, body, request) {
    return this.encryptUserPassword(model, id, body);
  }

  async updateResponse(model, id, body, request, response) {
  }

  async deleteRequest(model, id, request) {
  }

  async deleteResponse(model, id, request) {
  }

  async getRequest(model, id, request) {
  }

  async getResponse(model, id, request, response) {
  }

  async searchRequest(model, size, search, request) {
  }

  async searchResponse(model, size, search, request, response) {
  }

  async patchRequest(model, id, fields, request) {
  }

  async patchResponse(model, id, fields, request, response) {
  }
}
