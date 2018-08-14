import template from './watcher_wizard_email_action.html';
import priorities from '../../action_priorities';
import {capitalize} from 'lodash';

class WatcherWizardEmailAction {
  constructor($scope, wizardHelper) {
    this.$scope = $scope;
    this.wizardHelper = wizardHelper;
    this.actionId = this.actionId || this.$scope.actionId;
    this.watcher = this.watcher || this.$scope.watcher;
    this.actionSettings = this.actionSettings || this.$scope.actionSettings;
    this.actionPropertyNormalization = this.actionPropertyNormalization || this.$scope.actionPropertyNormalization;
    this.actionDelete = this.actionDelete || this.$scope.actionDelete;
    this.aceOptions = this.aceOptions || this.$scope.aceOptions;

    this.type = 'email';
    this.status = {
      isOpen: false,
    };
    this.priority = {
      selected: this.actionSettings.email.priority,
      options: priorities,
      handleChange: () => {
        this.actionSettings.email.priority = this.priority.selected;
      },
    };
  }

  getTagId(name = 'action') {
    name = name === 'action' ? 'watcherWizardEmailAction' : ('watcherWizardEmailAction' + capitalize(name));
    return this.wizardHelper.getUniqueTagId(name, this.actionId);
  }

  deleteAction() {
    this.actionDelete({actionId: this.actionId});
  }
}

function watcherWizardEmailAction() {
  return {
    template,
    restrict: 'E',
    scope: {
      actionId: '@',
      watcher: '=',
      actionSettings: '=',
      actionPropertyNormalization: '&',
      actionDelete: '&',
      aceOptions: '&',
    },
    controller:  WatcherWizardEmailAction,
    controllerAs: 'watcherWizardEmailAction',
    bindToController: {
      actionId: '@',
      watcher: '=',
      actionSettings: '=',
      actionPropertyNormalization: '&',
      actionDelete: '&',
      aceOptions: '&',
    },
  };
}

export default watcherWizardEmailAction;
