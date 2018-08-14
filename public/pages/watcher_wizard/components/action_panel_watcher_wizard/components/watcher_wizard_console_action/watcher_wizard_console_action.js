import template from './watcher_wizard_console_action.html';
import priorities from '../../action_priorities';
import {capitalize} from 'lodash';

class WatcherWizardConsoleAction {
  constructor($scope, wizardHelper) {
    this.$scope = $scope;
    this.wizardHelper = wizardHelper;
    this.actionId = this.actionId || this.$scope.actionId;
    this.watcher = this.watcher || this.$scope.watcher;
    this.actionSettings = this.actionSettings || this.$scope.actionSettings;
    this.actionDelete = this.actionDelete || this.$scope.actionDelete;

    this.type = 'console';
    this.status = {
      isOpen: false,
    };
    this.priority = {
      selected: this.actionSettings.console.priority,
      options: priorities,
      handleChange: () => {
        this.actionSettings.console.priority = this.priority.selected;
      },
    };
  }

  getTagId(name = 'action') {
    name = name === 'action' ? 'watcherWizardConsoleAction' : ('watcherWizardConsoleAction' + capitalize(name));
    return this.wizardHelper.getUniqueTagId(name, this.actionId);
  }

  deleteAction() {
    this.actionDelete({actionId: this.actionId});
  }
}

function watcherWizardConsoleAction() {
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
    controller:  WatcherWizardConsoleAction,
    controllerAs: 'watcherWizardConsoleAction',
    bindToController: {
      actionId: '@',
      watcher: '=',
      actionSettings: '=',
      actionDelete: '&',
      aceOptions: '&',
    },
  };
}

export default watcherWizardConsoleAction;
