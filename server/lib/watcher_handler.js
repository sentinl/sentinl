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
import WarningAndLog from './messages/warning_and_log';
import SuccessAndLog from './messages/success_and_log';
import { isKibi } from './helpers';
import logHistory from './log_history';
import KableClient from './kable_client';
import TimelionClient from './timelion_client';
import sirenFederateHelper from './siren/federate_helper';

/**
* Helper class to handle watchers
*/
export default class WatcherHandler {
  constructor(server, client, config) {
    this.server = server;
    this.config = !config ? getConfiguration(server) : config;
    this.log = new Log(this.config.app_name, this.server, 'watcher_handler');
    this.client = !client ? getElasticsearchClient({server, config: this.config}) : client;
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
    this.kable = new KableClient(server);
    this.timelion = new TimelionClient(server);
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

  _docUuid(id) {
    return id.split(':')[1] || id.split(':')[0];
  }

  /**
  * Get user from user index
  *
  * @param {string} watcherId
  * @return {object} user data
  */
  async getUser(id) {
    try {
      return await this.client.get({
        index: this.config.es.default_index,
        type: this.siren ? this.config.es.user_type : this.config.es.default_type,
        id: this.siren ? id : (this.config.es.user_type + ':' + this._docUuid(id)),
      });
    } catch (err) {
      throw new Error('get user: ' + err.toString());
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
      throw new Error('count watchers: ' + err.toString());
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
      throw new Error('get watchers: ' + err.toString());
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
      throw new Error('input search: ' + err.toString());
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
    this.log.debug(`condition: ${JSON.stringify(condition, null, 2)}`);
    if (condition.never) {
      throw new Error('warning, action execution is disabled');
    }

    // script
    if (has(condition, 'script.script')) {
      try {
        if (!eval(condition.script.script)) { // eslint-disable-line no-eval
          return new WarningAndLog(this.log, 'no data satisfy "script" condition');
        }
      } catch (err) {
        throw new Error('apply condition "script": ' + err.toString());
      }
    }

    // compare
    if (condition.compare) {
      try {
        if (!compare.valid(payload, condition)) {
          return new WarningAndLog(this.log, 'no data satisfy "compare" condition');
        }
      } catch (err) {
        throw new Error('apply condition "compare": ' + err.toString());
      }
    }

    // compare array
    if (condition.array_compare) {
      try {
        if (!compareArray.valid(payload, condition)) {
          return new WarningAndLog(this.log, 'no data satisfy "array compare" condition');
        }
      } catch (err) {
        throw new Error('apply condition "array compare": ' + err.toString());
      }
    }

    // find anomalies
    if (isAnomaly) {
      try {
        payload = anomaly.check(payload, condition);
      } catch (err) {
        throw new Error('apply condition "anomaly": ' + err.toString());
      }
    }

    // find hits outside range
    if (isRange) {
      try {
        payload = range.check(payload, condition);
      } catch (err) {
        throw new Error('apply condition "range": ' + err.toString());
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
    this.log.debug(`transform: ${JSON.stringify(transform, null, 2)}`);
    const bulkTransform = async (link) => {
      // validate JS script in transform
      if (has(link, 'script.script')) {
        try {
          // transform global payload
          eval(link.script.script); // eslint-disable-line no-eval
        } catch (err) {
          throw new Error('apply transform "script": ' + err.toString());
        }
      }
      // search in transform
      if (has(link, 'search.request')) {
        try {
          payload = await this.search(link.search.request, method);
        } catch (err) {
          throw new Error('apply transform "search": ' + err.toString());
        }
      }
      return null;
    };

    if (transform && transform.chain && size(transform.chain)) { // transform chain
      return Promise.each(transform.chain, (link) => bulkTransform(link)).then(() => {
        if (!payload || !size(payload)) {
          return new WarningAndLog(this.log, 'no data was found after "chain" transform was applied');
        }
        return new SuccessAndLog(this.log, 'successfully applied "chain" transform', { payload });
      }).catch((err) => {
        throw new Error('apply transform "chain": ' + err.toString());
      });
    } else if (transform && size(transform)) { // transform
      try {
        await bulkTransform(transform);
        if (!payload || !size(payload)) {
          return new WarningAndLog(this.log, 'no data was found after transform was applied');
        }
        return new SuccessAndLog(this.log, 'successfully applied transform', { payload });
      } catch (err) {
        throw new Error('apply transform: ' + err.toString());
      }
    }

    return new SuccessAndLog(this.log, 'no transform found');
  }

  /**
  * Execute watcher
  *
  * @param {object} task watcher
  * @param {string} ES search method name
  * @param {object} ES search request or kable
  * @param {object} condition of watcher
  * @param {object} transform of watcher
  * @param {object} actions of watcher
  * @return {object} success or warning message
  */
  async _execute(task, method, search, condition, transform, actions) {
    const isAnomaly = has(task._source, 'sentinl.condition.anomaly') ? true : false;
    const isRange = has(task._source, 'sentinl.condition.range') ? true : false;
    let payload;

    if (search.timelion) {
      try {
        payload = await this.timelion.run(search.timelion);
      } catch (err) {
        throw new Error('timelion payload: ' + err.toString());
      }
    } else if (search.kable) {
      try {
        payload = await this.kable.run(search.kable);
      } catch (err) {
        throw new Error('get kable payload: ' + err.toString());
      }
    } else if (search.request) {
      try {
        payload = await this.search(search.request, method); // data from Elasticsearch
      } catch (err) {
        throw new Error('get payload: ' + err.toString());
      }
    } else {
      throw new Error('unknown input: ' + JSON.stringify(search));
    }

    try {
      const resp = this._executeCondition(payload, condition, isAnomaly, isRange);
      if (resp && resp.warning) {
        return resp; // payload is empty, do not execute actions
      }
      if (resp.payload) {
        payload = resp.payload;
      }
    } catch (err) {
      throw new Error('exec condition: ' + err.toString());
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
      throw new Error('exec transform: ' + err.toString());
    }

    this.doActions(payload, this.server, actions, task);
    return new SuccessAndLog(this.log, 'successfuly executed');
  }

  _checkWatcher(task) {
    this.log.info('executing');

    let method = 'search';
    try {
      if (sirenFederateHelper.federateIsAvailable(this.server)) {
        method = sirenFederateHelper.getClientMethod(this.client);
      }
    } catch (err) {
      this.log.warning('Siren federate: "elasticsearch.plugins" is not available when running from kibana: ' + err.toString());
    }

    const actions = this.getActions(task._source.actions);
    let search = get(task._source, 'input.search'); // search.request, search.kable, search.timelion
    let condition = task._source.condition;
    let transform = task._source.transform;

    if (!search) {
      throw new Error('search request or kable is malformed');
    }
    if (!condition) {
      throw new Error('condition is malformed');
    }

    return {method, search, condition, transform, actions};
  }

  /**
  * Execute watcher.
  *
  * @param {object} task - Elasticsearch watcher object
  */
  async execute(task) {
    this.log = new Log(this.config.app_name, this.server, `watcher ${task._id}`);
    if (!isEmpty(this.getActions(task._source.actions))) {
      try {
        const {method, search, condition, transform, actions} = this._checkWatcher(task);
        if (this.config.settings.authentication.impersonate || task._source.impersonate) {
          this.client = await this.getImpersonatedClient(task._id);
        }
        return await this._execute(task, method, search, condition, transform, actions);
      } catch (err) {
        logHistory({
          server: this.server,
          watcherTitle: task._source.title,
          message: 'execute advanced watcher: ' + err.toString(),
          level: 'high',
          isError: true,
        });
        throw new Error('execute watcher: ' + err.toString());
      }
    }
    return new WarningAndLog(this.log, 'no actions found');
  }

  /**
  * Impersonate ES client
  *
  * @return {promise} client - impersonated client
  */
  async getImpersonatedClient(watcherId) {
    try {
      const user = await this.getUser(watcherId);
      if (!user.found) {
        throw new Error('fail to impersonate watcher, user was not found. Create watcher user first.');
      }

      return getElasticsearchClient({
        server: this.server,
        config: this.config,
        impersonateUsername: get(user, '_source.username') || get(user, `_source[${this.config.es.user_type}].username`),
        impersonateSha: get(user, '_source.sha') || get(user, `_source[${this.config.es.user_type}].sha`),
        impersonatePassword: get(user, '_source.password') || get(user, `_source[${this.config.es.user_type}].password`),
        impersonateId: user._id,
        isSiren: this.siren,
      });
    } catch (err) {
      throw new Error('impersonate Elasticsearch API client: ' + err.toString());
    }
  }
}
