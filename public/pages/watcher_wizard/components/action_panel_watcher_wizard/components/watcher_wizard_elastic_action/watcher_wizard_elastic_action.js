import template from './watcher_wizard_elastic_action.html';
import priorities from '../../action_priorities';
import {capitalize} from 'lodash';

class WatcherWizardElasticAction {
  constructor($scope, wizardHelper) {
    this.$scope = $scope;
    this.wizardHelper = wizardHelper;
    this.actionId = this.actionId || this.$scope.actionId;
    this.watcher = this.watcher || this.$scope.watcher;
    this.actionSettings = this.actionSettings || this.$scope.actionSettings;
    this.actionDelete = this.actionDelete || this.$scope.actionDelete;

    this.type = 'elastic';
    this.status = {
      isOpen: false,
    };
    this.priority = {
      selected: this.actionSettings.elastic.priority,
      options: priorities,
      handleChange: () => {
        this.actionSettings.elastic.priority = this.priority.selected;
      },
    };
  }

  getTagId(name = 'action') {
    name = name === 'action' ? 'watcherWizardElasticAction' : ('watcherWizardElasticAction' + capitalize(name));
    return this.wizardHelper.getUniqueTagId(name, this.actionId);
  }

  deleteAction() {
    this.actionDelete({actionId: this.actionId});
  }
}

function watcherWizardElasticAction() {
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
    controller:  WatcherWizardElasticAction,
    controllerAs: 'watcherWizardElasticAction',
    bindToController: {
      actionId: '@',
      watcher: '=',
      actionSettings: '=',
      actionDelete: '&',
      aceOptions: '&',
    },
  };
}

export default watcherWizardElasticAction;
