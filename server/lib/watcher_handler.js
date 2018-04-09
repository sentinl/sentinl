import { get, has, forEach, difference, map, size, isObject, isEmpty } from 'lodash';
import Promise from 'bluebird';
import range from './validators/range';
import anomaly from './validators/anomaly';
import compare from './validators/compare';
import compareArray from './validators/compare_array';
import getElasticsearchClient from './get_elasticsearch_client';
import getConfiguration from './get_configuration';
import actionFactory from './actions';
import Log from './log';
import ErrorAndLog from './messages/error_and_log';
import WarningAndLog from './messages/warning_and_log';
import SuccessAndLog from './messages/success_and_log';
import { isKibi } from './helpers';

/**
* Helper class to handle watchers
*/
export default class WatcherHandler {
  constructor(server, client, config) {
    this.server = server;
    this.config = !config ? getConfiguration(server) : config;
    this.client = !client ? getElasticsearchClient(server, this.config) : client;
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
  * @param {object} payload data from Elasticsearch
  * @param {object} server of Kibana
  * @param {object} actions of watcher
  * @parms {object} task watcher
  */
  doActions(payload, server, actions, task) {
    actionFactory(server, actions, payload, task);
  }

  /**
  * Get user from user index
  *
  * @param {string} watcherId
  * @return {object} user data
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
      throw new ErrorAndLog(this.log, err, `fail to get user: ${err.message}`);
    }
  }

  /**
  * Count watchers
  *
  * @return {object} count data
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
      throw new ErrorAndLog(this.log, err, `fail to count watchers: ${err.message}`);
    }
  }

  /**
  * Get watchers
  *
  * @param {number} count - number of watchers to get
  * @return {object} watchers all data
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
      return await this.search(request);
    } catch (err) {
      throw new ErrorAndLog(this.log, err, `fail to get watchers: ${err.message}`);
    }
  }

  /**
  * Search
  *
  * @param {object} request query
  * @param {string} method name
  * @return {object} data from ES
  */
  async search(request, method = 'search') {
    try {
      return await this.client[method](request);
    } catch (err) {
      throw new ErrorAndLog(this.log, err, `fail to search: ${err.message}`);
    }
  }

  /**
  * Get all watcher actions
  *
  * @param {object} actions
  * @return {object} actions in normalized form
  */
  getActions(actions) {
    const filteredActions = {};
    forEach(actions, (settings, name) => {
      filteredActions[name] = settings;
    });
    return filteredActions;
  }

  /**
  * Execute condition
  *
  * @param {object} payload data from Elasticsearch
  * @param {object} condition
  * @param {boolean} isAnomaly
  * @param {boolean} isRange
  * @return {object} null or warning message
  */
  _executeCondition(payload, condition, isAnomaly = false, isRange = false) {
    if (condition.never) {
      throw new Error('warning, action execution is disabled');
    }

    // script
    if (has(condition, 'script.script')) {
      try {
        if (!eval(condition.script.script)) { // eslint-disable-line no-eval
          return new WarningAndLog(this.log, 'no data was found that match the used "script" conditions');
        }
      } catch (err) {
        throw new ErrorAndLog(this.log, err, `fail to apply condition "script": ${err.message}`);
      }
    }

    // compare
    if (condition.compare) {
      try {
        if (!compare.valid(payload, condition)) {
          return new WarningAndLog(this.log, 'no data was found that match the used "compare" conditions');
        }
      } catch (err) {
        throw new ErrorAndLog(this.log, err, 'fail to apply condition "compare"');
      }
    }

    // compare array
    if (condition.array_compare) {
      try {
        if (!compareArray.valid(payload, condition)) {
          return new WarningAndLog(this.log, 'no data was found that match the used "array compare" condition');
        }
      } catch (err) {
        throw new ErrorAndLog(this.log, err, `fail to apply condition "array compare": ${err.message}`);
      }
    }

    // find anomalies
    if (isAnomaly) {
      try {
        payload = anomaly.check(payload, condition);
      } catch (err) {
        throw new ErrorAndLog(this.log, err, `fail to apply condition "anomaly": ${err.message}`);
      }
    }

    // find hits outside range
    if (isRange) {
      try {
        payload = range.check(payload, condition);
      } catch (err) {
        throw new ErrorAndLog(this.log, err, `fail to apply condition "range": ${err.message}`);
      }
    }
    return new SuccessAndLog(this.log, 'successfully applied condition', { payload });
  }

  /**
  * Execute transform
  *
  * @param {object} payload data from Elasticsearch
  * @param {object} transform
  * @param {string} ES search method name
  * @return {object} null or warning message
  */
  async _executeTransform(payload, transform, method) {
    const bulkTransform = async (link) => {
      // validate JS script in transform
      if (has(link, 'script.script')) {
        try {
          // update global payload
          if (!eval(link.script.script)) { // eslint-disable-line no-eval
            return new WarningAndLog(this.log, 'no data was found after "script" transform was applied');
          }
        } catch (err) {
          throw new ErrorAndLog(this.log, err, `fail to apply transform "script": ${err.message}`);
        }
      }

      // search in transform
      if (has(link, 'search.request')) {
        try {
          payload = await this.search(link.search.request, method);
        } catch (err) {
          throw new ErrorAndLog(this.log, err, `fail to apply transform "search": ${err.message}`);
        }
      }
      return null;
    };

    if (transform && transform.chain && size(transform.chain)) { // transform chain
      return Promise.each(transform.chain, (link) => bulkTransform(link)).then(() => {
        if (!payload) {
          return new WarningAndLog(this.log, 'no data was found after "chain" transform was applied');
        }

        return new SuccessAndLog(this.log, 'successfully applied "chain" transform', { payload });
      }).catch((err) => {
        throw new ErrorAndLog(this.log, err, `fail to apply transform "chain": ${err.message}`);
      });

    } else if (transform && size(transform)) { // transform
      try {
        const resp = await bulkTransform(transform);
        if (resp && resp.warning) {
          return resp;
        }

        if (!payload) {
          return new WarningAndLog(this.log, 'no data was found after transform was applied');
        }

        return new SuccessAndLog(this.log, 'successfully applied transform', { payload });
      } catch (err) {
        throw new ErrorAndLog(this.log, err, `fail to apply transform: ${err.message}`);
      }
    }

    return new SuccessAndLog(this.log, 'no transform found');
  }

  /**
  * Execute watcher
  *
  * @param {object} task watcher
  * @param {string} ES search method name
  * @param {object} ES search request of watcher
  * @param {object} condition of watcher
  * @param {object} transform of watcher
  * @param {object} actions of watcher
  * @return {object} success or warning message
  */
  async _execute(task, method, request, condition, transform, actions) {
    let payload;

    try {
      payload = await this.search(request, method); // data from Elasticsearch
    } catch (err) {
      throw err;
    }

    if (!payload) {
      throw new Error('input search query is malformed or missing key parameters');
    }

    const isAnomaly = has(task._source, 'sentinl.condition.anomaly') ? true : false;
    const isRange = has(task._source, 'sentinl.condition.range') ? true : false;

    try {
      const resp = this._executeCondition(payload, condition, isAnomaly, isRange);
      if (resp && resp.warning) {
        return resp; // payload is empty, do not execute actions
      }
      if (resp.payload) {
        payload = resp.payload;
      }
    } catch (err) {
      throw err;
    }

    try {
      const resp = await this._executeTransform(payload, transform, method);
      if (resp && resp.warning) {
        return resp; // payload is empty, do not execute actions
      }
      if (resp.payload) {
        payload = resp.payload;
      }
    } catch (err) {
      throw err;
    }

    this.doActions(payload, this.server, actions, task);
    return new SuccessAndLog(this.log, 'successfuly executed');
  }

  /**
  * Execute watcher.
  *
  * @param {object} task - Elasticsearch watcher object
  */
  async execute(task) {
    this.log = new Log(this.config.app_name, this.server, `watcher ${task._id}`);

    if (!isEmpty(this.getActions(task._source.actions))) {
      this.log.info('executing');

      let sirenFederateAvailable = false;
      try {
        const elasticsearchPlugins = this.server.config().get('investigate_core.clusterplugins');
        if (elasticsearchPlugins && (elasticsearchPlugins.indexOf('siren-vanguard') > -1 ||
            elasticsearchPlugins.indexOf('siren-federate') > -1)) {
          sirenFederateAvailable = true;
        }
      } catch (err) {
        this.log.warning('"elasticsearch.plugins" not available when running from kibana');
      }

      const actions = this.getActions(task._source.actions);
      let request = has(task._source, 'input.search.request') ? task._source.input.search.request : undefined;
      let condition = size(task._source.condition) ? task._source.condition : undefined;
      let transform = task._source.transform ? task._source.transform : undefined;

      if (!request) {
        throw new Error('search request is malformed');
      }
      if (!condition) {
        throw new Error('condition is malformed');
      }

      let method = 'search';
      if (sirenFederateAvailable) {
        for (let candidate of ['investigate_search', 'kibi_search', 'vanguard_search', 'search']) {
          if (this.client[candidate]) {
            method = candidate;
            break;
          }
        }
      }

      try {
        if (this.config.settings.authentication.impersonate) {
          this.client = await this.getImpersonatedClient(task._id);
        }
        return await this._execute(task, method, request, condition, transform, actions);
      } catch (err) {
        throw new ErrorAndLog(this.log, err, `fail to execute watcher: ${err.message}`);
      }
    }
  }

  /**
  * Impersonate ES client
  *
  * @param {string} id = watcher/user id
  * @return {promise} client - impersonated client
  */
  async getImpersonatedClient(id) {
    try {
      const resp = this.getUser(id);
      if (!resp.found) {
        throw new Error('fail to authenticate watcher, user was not found');
      }

      const impersonate = {
        username: resp._source.username,
        sha: resp._source.sha
      };
      return getElasticsearchClient(this.server, this.config, 'data', impersonate);
    } catch (err) {
      throw new ErrorAndLog(this.log, err, `fail to impersonate Elasticsearch API client: ${err.message}`);
    }
  }
}
