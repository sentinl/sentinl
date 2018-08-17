import template from './watcher_wizard_slack_action.html';
import priorities from '../../action_priorities';
import {capitalize} from 'lodash';

class WatcherWizardSlackAction {
  constructor($scope, wizardHelper) {
    this.$scope = $scope;
    this.wizardHelper = wizardHelper;
    this.actionId = this.actionId || this.$scope.actionId;
    this.watcher = this.watcher || this.$scope.watcher;
    this.actionSettings = this.actionSettings || this.$scope.actionSettings;
    this.actionDelete = this.actionDelete || this.$scope.actionDelete;

    this.type = 'slack';
    this.status = {
      isOpen: false,
    };
    this.priority = {
      selected: this.actionSettings.slack.priority,
      options: priorities,
      handleChange: () => {
        this.actionSettings.slack.priority = this.priority.selected;
      },
    };
  }

  getTagId(name = 'action') {
    name = name === 'action' ? 'watcherWizardSlackAction' : ('watcherWizardSlackAction' + capitalize(name));
    return this.wizardHelper.getUniqueTagId(name, this.actionId);
  }

  deleteAction() {
    this.actionDelete({actionId: this.actionId});
  }
}

function watcherWizardSlackAction() {
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
    controller:  WatcherWizardSlackAction,
    controllerAs: 'watcherWizardSlackAction',
    bindToController: {
      actionId: '@',
      watcher: '=',
      actionSettings: '=',
      actionDelete: '&',
      aceOptions: '&',
    },
  };
}

export default watcherWizardSlackAction;
