import template from './watcher_wizard_ses_action.html';
import priorities from '../../action_priorities';
import {capitalize} from 'lodash';

class WatcherWizardSesAction {
  constructor($scope, $sce, wizardHelper) {
    this.$scope = $scope;
    this.wizardHelper = wizardHelper;
    this.actionId = this.actionId || this.$scope.actionId;
    this.watcher = this.watcher || this.$scope.watcher;
    this.actionSettings = this.actionSettings || this.$scope.actionSettings;
    this.actionPropertyNormalization = this.actionPropertyNormalization || this.$scope.actionPropertyNormalization;
    this.actionDelete = this.actionDelete || this.$scope.actionDelete;
    this.aceOptions = this.aceOptions || this.$scope.aceOptions;

    this.type = 'ses';
    this.status = {
      isOpen: false,
    };
    this.priority = {
      selected: this.actionSettings.ses.priority,
      options: priorities,
      handleChange: () => {
        this.actionSettings.ses.priority = this.priority.selected;
      },
    };
  }

  getTagId(name = 'action') {
    name = name === 'action' ? 'watcherWizardSesAction' : ('watcherWizardSesAction' + capitalize(name));
    return this.wizardHelper.getUniqueTagId(name, this.actionId);
  }

  deleteAction() {
    this.actionDelete({actionId: this.actionId});
  }
}

function watcherWizardSesAction() {
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
    controller: WatcherWizardSesAction,
    controllerAs: 'watcherWizardSesAction',
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

export default watcherWizardSesAction;
