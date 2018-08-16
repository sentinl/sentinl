import template from './watcher_wizard_webhook_action.html';
import priorities from '../../action_priorities';
import { capitalize } from 'lodash';

class WatcherWizardWebhookAction {
  constructor($scope, wizardHelper) {
    this.$scope = $scope;
    this.wizardHelper = wizardHelper;
    this.actionId = this.actionId || this.$scope.actionId;
    this.watcher = this.watcher || this.$scope.watcher;
    this.actionSettings = this.actionSettings || this.$scope.actionSettings;
    this.actionDelete = this.actionDelete || this.$scope.actionDelete;

    this.type = 'webhook';
    this.status = {
      isOpen: false,
    };
    this.priority = {
      selected: this.actionSettings.webhook.priority,
      options: priorities,
      handleChange: () => this.actionSettings.webhook.priority = this.priority.selected,
    };
    this.method_options = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'];
    this.auth = {
      username: this.actionSettings.webhook.auth.split(':')[0],
      password: this.actionSettings.webhook.auth.split(':')[1]  || '',
      handleChange: () =>
        this.actionSettings.webhook.auth = (this.auth.username && this.auth.password) ? `${this.auth.username}:${this.auth.password}` : ''
    };
    this.header = {
      values: Object.entries(this.actionSettings.webhook.headers),
      handleChange: () => this.actionSettings.webhook.headers = WatcherWizardWebhookAction.convertParameterListToObject(this.header.values)
    };
    this.params = {
      values: Object.entries(this.actionSettings.webhook.params),
      handleChange: () => this.actionSettings.webhook.params = WatcherWizardWebhookAction.convertParameterListToObject(this.params.values)
    };
  }

  static convertParameterListToObject(parameters) {
    const obj = {};
    for (const [attribute, value] of parameters) {
      if (attribute && value) {
        obj[attribute] = value;
      }
    }
    return obj;
  }

  getTagId(name = 'action') {
    name = name === 'action' ? 'watcherWizardWebhookAction' : ('watcherWizardWebhookAction' + capitalize(name));
    return this.wizardHelper.getUniqueTagId(name, this.actionId);
  }

  deleteAction() {
    this.actionDelete({ actionId: this.actionId });
  }
}

function watcherWizardWebhookAction() {
  return {
    template,
    restrict: 'E',
    scope: {
      actionId: '@',
      watcher: '=',
      actionSettings: '=',
      actionDelete: '&',
      aceOptions: '&',
    },
    controller: WatcherWizardWebhookAction,
    controllerAs: 'watcherWizardWebhookAction',
    bindToController: {
      actionId: '@',
      watcher: '=',
      actionSettings: '=',
      actionDelete: '&',
      aceOptions: '&',
    },
  };
}

export default watcherWizardWebhookAction;
