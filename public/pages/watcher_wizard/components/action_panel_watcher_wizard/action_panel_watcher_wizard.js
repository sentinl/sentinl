import template from './action_panel_watcher_wizard.html';
import { cloneDeep } from 'lodash';

class ActionPanelWatcherWizard {
  constructor($scope) {
    this.$scope = $scope;
    this.watcher = this.watcher || this.$scope.watcher;
    this.onAdd = this.onAdd || this.$scope.onAdd;
    this.actionPropertyNormalization = this.actionPropertyNormalization || this.$scope.actionPropertyNormalization;
    this.onDelete = this.onDelete || this.$scope.onDelete;
    this.aceOptions = this.aceOptions || this.$scope.aceOptions;

    this.status = {
      closeOthers: true,
    };
  }

  isAction(action, type) {
    return action[type] ? true : false;
  }
}

function actionPanelWatcherWizard() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=',
      onAdd: '&',
      actionPropertyNormalization: '&',
      onDelete: '&',
      aceOptions: '&',
    },
    controller:  ActionPanelWatcherWizard,
    controllerAs: 'actionPanelWatcherWizard',
    bindToController: {
      watcher: '=',
      onAdd: '&',
      actionPropertyNormalization: '&',
      onDelete: '&',
      aceOptions: '&',
    },
  };
}

export default actionPanelWatcherWizard;
