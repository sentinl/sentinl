import { has } from 'lodash';
import Log from './log';
import WarningAndLog from './messages/warning_and_log';
import SuccessAndLog from './messages/success_and_log';
import WatcherHandler from './watcher_handler';
import logHistory from './log_history';

/**
* Helper class to handle watchers
*/
export default class WatcherWizardHandler extends WatcherHandler {
  constructor(server, client, config) {
    super(server, client, config);
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
  _executeCondition(payload, condition) {
    this.log.debug(`condition: ${JSON.stringify(condition, null, 2)}`);

    // script
    if (has(condition, 'script.script')) {
      try {
        if (!eval(condition.script.script)) { // eslint-disable-line no-eval
          return new WarningAndLog(this.log, 'no data satisfy condition');
        }
      } catch (err) {
        throw new Error('apply condition "script": ' + err.toString());
      }
    }
    return new SuccessAndLog(this.log, 'successfully applied condition', { payload });
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
      // this.log.debug(`payload: ${JSON.stringify(payload)}`);
    } catch (err) {
      throw err;
    }

    try {
      const resp = this._executeCondition(payload, condition);
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
    try {
      const {method, search, condition, transform, actions} = this._checkWatcher(task);
      if (this.config.settings.authentication.impersonate || task._source.impersonate) {
        this.client = await this.getImpersonatedClient(task._id);
      }
      return await this._execute(task, method, search.request, condition, transform, actions);
    } catch (err) {
      logHistory({
        server: this.server,
        watcherTitle: task._source.title,
        message: 'execute wizard watcher: ' + err.toString(),
        level: 'high',
        isError: true,
      });
      throw new Error('execute wizard watcher: ' + err.toString());
    }
  }
}
