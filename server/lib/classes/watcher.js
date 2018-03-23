import { get, has, forEach, difference, map, size, isObject, isEmpty } from 'lodash';
import Promise from 'bluebird';
import range from '../validators/range';
import anomaly from '../validators/anomaly';
import compare from '../validators/compare';
import compareArray from '../validators/compare_array';
import getElasticsearchClient from '../get_elasticsearch_client';
import getConfiguration from '../get_configuration';
import actionFactory from '../actions';
import Log from '../log';
import { isKibi } from '../helpers';

/**
* Helper class to get watchers data.
*/
export default class Watcher {

  constructor(server, client, config) {
    this.server = server;
    this.config = !config ? getConfiguration(server) : config;
    this.client = !client ? getElasticsearchClient(server, this.config) : client;
    this.log = new Log(this.config.app_name, server, 'watcher');
    this.siren = isKibi(server);
    this.query = {
      watchers: {
        query: {
          term: {
            type: {
              value: this.config.es.watcher_type,
            }
          }
        }
      }
    };
  }

  /**
  * Execute actions
  *
  * @param {object} server - Kibana hapi server
  * @param {object} actions - watcher actions
  * @param {object} payload - ES payload after all manipulations it went through in this.execute()
  * @parms {object} task - watcher object
  */
  doActions(server, actions, payload, task) {
    actionFactory(server, actions, payload, task);
  }

  /**
  * Get user from user index
  *
  * @param {string} watcherId - watcher _id
  */
  async getUser(id) {
    const request = {
      index: this.config.es.default_index,
      type: this.config.es.default_type,
      id,
    };

    if (this.siren) {
      request.type = this.config.es.watcher_type;
    }

    try {
      return await this.client.get(request);
    } catch (err) {
      throw new Error(`auth, fail to get user, watcher: ${id}`);
    }
  }

  /**
  * Count watchers
  */
  async getCount() {
    const request = {
      index: this.config.es.default_index,
      type: this.config.es.default_type,
      body: this.query.watchers,
    };

    if (this.siren) {
      request.type = this.config.es.watcher_type;
      delete request.body;
    }

    try {
      return await this.client.count(request);
    } catch (err) {
      throw err;
    }
  }

  /**
  * Get watchers
  *
  * @param {number} count - number of watchers to get
  */
  async getWatchers(count) {
    const request = {
      index: this.config.es.default_index,
      type: this.config.es.default_type,
      size: count,
      body: this.query.watchers,
    };

    if (this.siren) {
      request.type = this.config.es.watcher_type;
      delete request.body;
    }

    try {
      return await this.client.search(request);
    } catch (err) {
      throw new Error('fail to get watchers');
    }
  }

  /**
  * Search
  *
  * @param {string} method name
  * @param {object} request query
  */
  search(method, request) {
    return this.client[method](request);
  }

  /**
  * Get all watcher actions
  *
  * @param {object} actions - watcher actions
  * @return {object} actions
  */
  getActions(actions) {
    const filteredActions = {};
    forEach(actions, (settings, name) => {
      filteredActions[name] = settings;
    });
    return filteredActions;
  }

  /**
  * Execute watcher.
  *
  * @param {object} task - Elasticsearch watcher object
  * @param {string} type - watcher type: report, action
  * @return {promise} id - successfully executed watcher id
  */
  execute(task) {
    const response = {
      task: {
        id: task._id
      }
    };

    if (!isEmpty(this.getActions(task._source.actions))) {
      let sirenFederateAvailable = false;
      try {
        const elasticsearchPlugins = this.server.config().get('investigate_core.clusterplugins');
        if (elasticsearchPlugins && (elasticsearchPlugins.indexOf('siren-vanguard') > -1 ||
            elasticsearchPlugins.indexOf('siren-federate') > -1)) {
          sirenFederateAvailable = true;
        }
      } catch (err) {
        // 'elasticsearch.plugins' not available when running from kibana
      }

      this.server.log(['status', 'info', 'Sentinl', 'watcher'], `Executing action: ${task._id}`);

      const actions = this.getActions(task._source.actions);
      let request = has(task._source, 'input.search.request') ? task._source.input.search.request : undefined;
      let condition = size(task._source.condition) ? task._source.condition : undefined;
      let transform = task._source.transform ? task._source.transform : undefined;

      let method = 'search';
      if (sirenFederateAvailable) {
        for (let candidate of ['investigate_search', 'kibi_search', 'vanguard_search', 'search']) {
          if (this.client[candidate]) {
            method = candidate;
            break;
          }
        }
      }

      if (!request) {
        throw new Error(`watcher search request is malformed, ${task._id}`);
      }
      if (!condition) {
        throw new Error(`watcher condition is malformed, ${task._id}`);
      }

      /**
      * Executing watcher input search, condition and transform.
      *
      * @param {object} watcher - watcher API object
      */
      const self = this;
      const execute = function () {
        /* INPUT */
        return self.search(method, request).then(function (payload) {
          if (!payload) {
            throw new Error(`input search query is malformed or missing key parameters, ${task._id}`);
          }

          /* CONDITION */

          // never execute actions
          if (condition.never) {
            response.message = `action execution is disabled, ${task._id}`;
            return response;
          }

          // script
          if (has(condition, 'script.script')) {
            try {
              // update global payload
              if (!eval(condition.script.script)) { // eslint-disable-line no-eval
                response.message = `no data was found that meets the used 'script 'conditions, ${task._id}`;
                return response;
              }
            } catch (err) {
              throw new Error(`condition 'script' error, ${task._id}: ${err}`);
            }
          }

          // compare
          if (condition.compare) {
            try {
              if (!compare.valid(payload, condition)) {
                response.message = `no data was found that meets the used 'compare' conditions, ${task._id}`;
                return response;
              }
            } catch (err) {
              throw new Error(`condition 'compare' error, ${task._id}: ${err}`);
            }
          }

          // compare array
          if (condition.array_compare) {
            try {
              if (!compareArray.valid(payload, condition)) {
                response.message = `no data was found that meets the used 'array compare' conditions, ${task._id}`;
                return response;
              }
            } catch (err) {
              throw new Error(`condition 'array compare' error, ${task._id}: ${err}`);
            }
          }

          // find anomalies
          if (has(task._source, 'sentinl.condition.anomaly')) {
            try {
              payload = anomaly.check(payload, task._source.sentinl.condition);
            } catch (err) {
              throw new Error(`condition 'anomaly' error, ${task._id}: ${err}`);
            }
          }

          // find hits outside range
          if (has(task._source, 'sentinl.condition.range')) {
            try {
              payload = range.check(payload, task._source.sentinl.condition);
            } catch (err) {
              throw new Error(`condition 'range' error, ${task._id}: ${err}`);
            }
          }

          /* TRANSFORM */

          const execTransform = function (link) {
            return new Promise(function (resolve, reject) {
              // validate JS script in transform
              if (has(link, 'script.script')) {
                try {
                  // update global payload
                  if (!eval(link.script.script)) { // eslint-disable-line no-eval
                    response.message = `no data was found after 'script' transform was applied, ${task._id}`;
                  }
                  resolve(null);
                } catch (err) {
                  reject(`transform 'script' error, ${task._id}: ${err}`);
                }
              }

              // search in transform
              if (has(link, 'search.request')) {
                resolve(self.search(method, link.search.request).then(function (_payload_) {
                  payload = _payload_; // update global payload
                  return null;
                }).catch(function (err) {
                  throw new Error(`transform 'search' error, ${task._id}: ${err}`);
                }));
              }
            });
          };

          if (transform && transform.chain && size(transform.chain)) { // transform chain
            return Promise.each(transform.chain, function (link) {
              return execTransform(link);
            }).then(function () {
              if (response.message && !payload) {
                return response;
              }

              if (!payload) {
                response.message = `no data was found after 'chain' transform was applied, ${task._id}!`;
                response.warning = true;
                return response;
              }

              return Promise.resolve(self.doActions(self.server, actions, payload, task)).then(function () {
                return response;
              });
            }).catch(function (err) {
              throw new Error(`Transform 'chain': ${err}`);
            });
          } else if (transform && size(transform)) { // transform
            return execTransform(transform).then(function () {
              if (!payload) {
                response.message = `no data was found after transform was applied, ${task._id}!`;
                return response;
              }

              return Promise.resolve(self.doActions(self.server, actions, payload, task)).then(() => response);
            });
          } else { // no transform
            return Promise.resolve(self.doActions(self.server, actions, payload, task)).then(() => response);
          }
        });
      };

      if (this.config.settings.authentication.impersonate) {
        return this.getImpersonatedClient(task._id).then((_client_) => {
          this.client = _client_;
          return execute();
        });
      } else {
        return execute();
      }
    }
  }

  /**
  * Impersonate ES client
  *
  * @param {string} id = watcher/user id
  * @return {promise} client - impersonated client
  */
  getImpersonatedClient(id) {
    return this.getUser(id).then((resp) => {
      if (resp.found) {
        const impersonate = {
          username: resp._source.username,
          sha: resp._source.sha
        };
        return getElasticsearchClient(this.server, this.config, 'data', impersonate);
      } else {
        throw new Error(`fail to authenticate watcher ${id}. User not found. ${JSON.stringify(resp)}`);
      }
    });
  }
}
