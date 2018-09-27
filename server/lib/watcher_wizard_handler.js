import { has } from 'lodash';
import Log from './log';
import WarningAndLog from './messages/warning_and_log';
import SuccessAndLog from './messages/success_and_log';
import WatcherHandler from './watcher_handler';
import apiClient from './api_client';
import WatcherWizardHandlerError from './errors/watcher_wizard_handler_error';

/**
* Helper class to handle watchers
*/
export default class WatcherWizardHandler extends WatcherHandler {
  constructor(server, client, config) {
    super(server, client, config);
    // Use Elasticsearch API because Kibana savedObjectsClient
    // can't be used without session user from request
    this._client = apiClient(server, 'elasticsearchAPI');
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
        throw new WatcherWizardHandlerError('apply condition "script"', err);
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
      payload = await this._client.search(request, method); // data from Elasticsearch
    } catch (err) {
      throw new WatcherWizardHandlerError('exec search', err);
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
      throw new WatcherWizardHandlerError('exec condition', err);
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
      const { method, search, condition, transform } = this._checkWatcher(task);
      if (this.config.settings.authentication.impersonate || task.impersonate) {
        await this._client.impersonate(task.id);
      }
      return await this._execute(task, method, search.request, condition, transform, task.actions);
    } catch (err) {
      err = new WatcherWizardHandlerError('execute wizard watcher', err);
      this._client.logAlarm({
        server: this.server,
        watcherTitle: task.title,
        message: err.toString(),
        level: 'high',
        isError: true,
      });
      throw err;
    }
  }
}
